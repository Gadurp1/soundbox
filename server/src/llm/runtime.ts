/**
 * Lifecycle of the managed `llama-server` child process.
 *
 * One persistent process per server run (not one per request — first-token
 * latency already includes model load, no reason to pay it twice), started
 * lazily on first use and stopped after `auto_unload_minutes` of no enhance
 * calls, via the same idle tick `ModelManager.maybeAutoUnload` uses.
 */

import { type ChildProcessByStdio, spawn } from "node:child_process";
import { createServer } from "node:net";
import type { Readable } from "node:stream";

import { ModelError } from "../errors.js";

type LlamaServerProcess = ChildProcessByStdio<null, Readable, Readable>;

const HEALTH_TIMEOUT_MS = 60_000;
const HEALTH_POLL_MS = 250;

async function freePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      const port = typeof address === "object" && address ? address.port : null;
      srv.close(() => (port ? resolve(port) : reject(new Error("could not allocate a port"))));
    });
  });
}

interface RunningServer {
  proc: LlamaServerProcess;
  baseUrl: string;
  modelPath: string;
  stderrTail: string[];
}

export class LlmRuntime {
  private running: RunningServer | null = null;
  private starting: Promise<RunningServer> | null = null;
  private lastUsed = Date.now();

  /** Start the process if needed (or reuse it if `modelPath` matches what's
   *  already running), and return its base URL once `/health` answers. */
  async ensureRunning(binaryPath: string, modelPath: string): Promise<{ baseUrl: string }> {
    if (this.running && this.running.modelPath === modelPath) {
      this.lastUsed = Date.now();
      return { baseUrl: this.running.baseUrl };
    }
    if (this.running && this.running.modelPath !== modelPath) {
      await this.stop();
    }
    if (this.starting) {
      const r = await this.starting;
      this.lastUsed = Date.now();
      return { baseUrl: r.baseUrl };
    }
    this.starting = this.start(binaryPath, modelPath, "auto");
    try {
      const r = await this.starting;
      this.running = r;
      this.lastUsed = Date.now();
      return { baseUrl: r.baseUrl };
    } finally {
      this.starting = null;
    }
  }

  private async start(
    binaryPath: string,
    modelPath: string,
    gpuMode: "auto" | "cpu",
  ): Promise<RunningServer> {
    const port = await freePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const args = [
      "-m",
      modelPath,
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "-c",
      "4096",
      "--no-webui",
      "--parallel",
      "1",
    ];
    args.push("-ngl", gpuMode === "cpu" ? "0" : "99");

    const proc = spawn(binaryPath, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const stderrTail: string[] = [];
    const onOutput = (chunk: Buffer) => {
      const lines = chunk.toString("utf-8").split(/\r?\n/).filter(Boolean);
      stderrTail.push(...lines);
      if (stderrTail.length > 40) stderrTail.splice(0, stderrTail.length - 40);
    };
    proc.stdout.on("data", onOutput);
    proc.stderr.on("data", onOutput);

    let exited: { code: number | null } | null = null;
    proc.on("exit", (code) => {
      exited = { code };
      if (this.running?.proc === proc) this.running = null;
    });

    try {
      await this.waitForHealth(baseUrl, proc, () => exited, stderrTail);
    } catch (exc) {
      proc.kill();
      // A CPU-only asset that was still handed -ngl 99, or a GPU driver that
      // can't actually serve the layers, both fail the same way — one retry
      // fully on CPU is cheap and turns a hard failure into "slower than
      // expected" instead of "enhance is broken on this machine".
      if (gpuMode === "auto") return await this.start(binaryPath, modelPath, "cpu");
      throw exc;
    }

    return { proc, baseUrl, modelPath, stderrTail };
  }

  private async waitForHealth(
    baseUrl: string,
    proc: LlamaServerProcess,
    getExited: () => { code: number | null } | null,
    stderrTail: string[],
  ): Promise<void> {
    const deadline = Date.now() + HEALTH_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const exited = getExited();
      if (exited) {
        throw new ModelError(
          `llama-server exited (code ${exited.code}) before it became ready.\n\n` +
            stderrTail.slice(-15).join("\n"),
        );
      }
      try {
        const resp = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2_000) });
        if (resp.ok) return;
      } catch {
        // Not up yet — keep polling.
      }
      await new Promise((r) => setTimeout(r, HEALTH_POLL_MS));
    }
    proc.kill();
    throw new ModelError(
      `llama-server did not become ready within ${HEALTH_TIMEOUT_MS / 1000}s.\n\n` +
        stderrTail.slice(-15).join("\n"),
    );
  }

  touch(): void {
    this.lastUsed = Date.now();
  }

  get isRunning(): boolean {
    return this.running !== null;
  }

  /** Called by the same 30s tick that drives `ModelManager.maybeAutoUnload`. */
  async maybeAutoStop(idleMinutes: number): Promise<boolean> {
    if (idleMinutes <= 0 || this.running === null) return false;
    if (Date.now() - this.lastUsed < idleMinutes * 60_000) return false;
    await this.stop();
    return true;
  }

  async stop(): Promise<void> {
    const r = this.running;
    this.running = null;
    if (!r) return;
    await new Promise<void>((resolve) => {
      r.proc.once("exit", () => resolve());
      r.proc.kill();
      setTimeout(resolve, 3_000).unref();
    });
  }
}
