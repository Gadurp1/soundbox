/**
 * Stream an HTTP download to disk.
 *
 * Every large download in the server — model weights, engine archives — goes
 * through here rather than collecting chunks in an array and writing them at
 * the end. A 5 GB checkpoint held in memory is a 5 GB heap, and on a machine
 * that is about to load that same checkpoint into a model it is the
 * difference between finishing and being killed.
 *
 * The bytes land in `<dest>.part` and are renamed into place only after they
 * add up, so a half-finished file never sits at the path that "is it
 * downloaded?" checks look at. A server that stops sending for a minute is
 * treated as dead rather than waited on forever, which is what an unbounded
 * `for await` over a stalled socket otherwise does.
 */

import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

/** How long the server may go without sending a byte — before the response
 *  headers as well as between chunks — before the download is abandoned. */
export const DEFAULT_IDLE_TIMEOUT_MS = 60_000;

/** A download that failed for a reason worth telling a person. Callers wrap it
 *  in their own error type (InstallError, ModelError) so the message reaches
 *  the UI the same way their other failures do. */
export class DownloadError extends Error {
  constructor(
    message: string,
    /** The HTTP status when the server answered with an error, else null. */
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "DownloadError";
  }
}

export interface DownloadOptions {
  headers?: Record<string, string>;
  /** The size the file should be, when the catalog knows it. A mismatch fails
   *  the download instead of installing a truncated or substituted file. 0 or
   *  absent means unknown. */
  expectedBytes?: number;
  /** Called per chunk. `total` is the Content-Length (falling back to
   *  `expectedBytes`), or 0 when neither is known. */
  onProgress?: (done: number, total: number) => void;
  idleTimeoutMs?: number;
  /** Cancels the download from outside, e.g. a job being cancelled. */
  signal?: AbortSignal;
  /** Inspect the response before any bytes are written — the place a caller
   *  turns a 401 into "add a token in Settings". Throwing aborts the download.
   *  The default rejects any non-2xx status. */
  checkResponse?: (resp: Response) => void;
}

export interface DownloadResult {
  bytes: number;
  /** Hex SHA-256 of what was written, computed on the way through so a
   *  checksum check never needs to read the file back into memory. */
  sha256: string;
}

export async function downloadToFile(
  url: string,
  dest: string,
  opts: DownloadOptions = {},
): Promise<DownloadResult> {
  const idleMs = opts.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  const controller = new AbortController();
  let stalled = false;
  let idleTimer: NodeJS.Timeout | null = null;
  const armIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      stalled = true;
      controller.abort();
    }, idleMs);
  };
  const onOuterAbort = () => controller.abort();
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", onOuterAbort, { once: true });
  }

  const part = `${dest}.part`;
  armIdle();
  try {
    const resp = await fetch(url, {
      headers: opts.headers ?? {},
      redirect: "follow",
      signal: controller.signal,
    });
    if (opts.checkResponse) opts.checkResponse(resp);
    else if (!resp.ok) throw new DownloadError(`HTTP ${resp.status} fetching ${url}`, resp.status);
    if (!resp.body) throw new DownloadError(`Empty response fetching ${url}`, resp.status);

    // Content-Length only describes the bytes we will count when nothing
    // decoded them on the way: fetch transparently gunzips, and then the
    // header is the compressed size.
    const encoded = (resp.headers.get("content-encoding") ?? "identity") !== "identity";
    const declared = encoded ? 0 : Number(resp.headers.get("content-length") ?? 0);
    const total = declared || opts.expectedBytes || 0;

    const hash = createHash("sha256");
    let done = 0;
    const meter = new Transform({
      transform(chunk: Buffer, _enc, callback) {
        armIdle();
        hash.update(chunk);
        done += chunk.byteLength;
        opts.onProgress?.(done, total);
        callback(null, chunk);
      },
    });

    await mkdir(dirname(dest), { recursive: true });
    await pipeline(
      Readable.fromWeb(resp.body as unknown as WebReadableStream<Uint8Array>),
      meter,
      createWriteStream(part),
    );

    if (declared && done !== declared) {
      throw new DownloadError(
        `Download of ${url} ended early: got ${done} of ${declared} bytes.`,
      );
    }
    if (opts.expectedBytes && done !== opts.expectedBytes) {
      throw new DownloadError(
        `Download of ${url} is ${done} bytes, expected ${opts.expectedBytes}. The file ` +
          `upstream may have changed, or the transfer was cut short.`,
      );
    }
    await rename(part, dest);
    return { bytes: done, sha256: hash.digest("hex") };
  } catch (exc) {
    await rm(part, { force: true }).catch(() => {});
    if (stalled) {
      throw new DownloadError(
        `Download of ${url} stalled — no data for ${Math.round(idleMs / 1000)}s. ` +
          `Check your network and try again.`,
      );
    }
    throw exc;
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
    opts.signal?.removeEventListener("abort", onOuterAbort);
  }
}
