/**
 * Best-effort discovery of an image server already running on this machine.
 *
 * Same argument as `llm/probe.ts`: the managed engine exists for people who
 * have nothing, and anyone already running Automatic1111 has no reason to
 * download a second copy of stable diffusion. Unlike the LLM side there is no
 * single probe path that covers everything, so each candidate carries the
 * endpoint that identifies it *and* the API shape it speaks — which is
 * exactly what Settings needs to fill in for a one-click switch.
 */

import type { ImageApiKind } from "../config.js";

export interface ImageProbeCandidate {
  label: string;
  base_url: string;
  kind: ImageApiKind;
  /** A cheap GET that identifies this server. */
  path: string;
}

/** Each project's documented default port. */
export const IMAGE_PROBE_CANDIDATES: ImageProbeCandidate[] = [
  {
    label: "Automatic1111",
    base_url: "http://127.0.0.1:7860",
    kind: "a1111",
    path: "/sdapi/v1/sd-models",
  },
  {
    label: "sd-server",
    base_url: "http://127.0.0.1:1234",
    kind: "a1111",
    path: "/sdapi/v1/sd-models",
  },
  {
    label: "LocalAI",
    base_url: "http://127.0.0.1:8080",
    kind: "openai",
    path: "/v1/models",
  },
];

export interface DetectedImageEndpoint {
  label: string;
  base_url: string;
  kind: ImageApiKind;
  /** Checkpoint names the endpoint reports, for pre-filling the model field.
   *  Empty when it answered but listed nothing recognisable. */
  models: string[];
}

const PROBE_TIMEOUT_MS = 400;

export type FetchFn = typeof fetch;

export async function probeEndpoint(
  candidate: ImageProbeCandidate,
  fetchImpl: FetchFn = fetch,
): Promise<DetectedImageEndpoint | null> {
  try {
    const resp = await fetchImpl(`${candidate.base_url}${candidate.path}`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!resp.ok) return null;
    const body = (await resp.json()) as unknown;
    return {
      label: candidate.label,
      base_url: candidate.base_url,
      kind: candidate.kind,
      models: modelNames(body),
    };
  } catch {
    // Nothing listening, timed out, or answered with something that isn't
    // JSON — all the same "not there" as far as this cares.
    return null;
  }
}

/** A1111 answers an array of `{title, model_name}`; the OpenAI shape answers
 *  `{data: [{id}]}`. Both are read leniently — a listing we can't parse is not
 *  a reason to hide an endpoint that clearly responded. */
function modelNames(body: unknown): string[] {
  if (Array.isArray(body)) {
    return body
      .map((entry) =>
        entry && typeof entry === "object"
          ? ((entry as Record<string, unknown>).model_name ??
            (entry as Record<string, unknown>).title)
          : null,
      )
      .filter((name): name is string => typeof name === "string");
  }
  if (body && typeof body === "object" && Array.isArray((body as { data?: unknown[] }).data)) {
    return (body as { data: unknown[] }).data
      .map((entry) =>
        entry && typeof entry === "object" ? (entry as Record<string, unknown>).id : null,
      )
      .filter((id): id is string => typeof id === "string");
  }
  return [];
}

/** Every candidate, checked in parallel — worst case one `PROBE_TIMEOUT_MS`
 *  wait, not one per candidate. */
export async function probeAll(fetchImpl: FetchFn = fetch): Promise<DetectedImageEndpoint[]> {
  const results = await Promise.all(
    IMAGE_PROBE_CANDIDATES.map((c) => probeEndpoint(c, fetchImpl)),
  );
  return results.filter((r): r is DetectedImageEndpoint => r !== null);
}
