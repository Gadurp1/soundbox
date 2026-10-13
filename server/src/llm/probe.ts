/**
 * Best-effort discovery of an LLM server already running on this machine.
 *
 * The managed llama-server install exists for people who have nothing —
 * anyone already running Ollama, LM Studio, or their own llama-server has no
 * reason to download a second one. All three speak the same
 * `/v1/models` OpenAI-compat probe, so one check covers them; a short timeout
 * keeps a "nothing there" answer cheap since this runs on every status fetch.
 */

export interface ProbeCandidate {
  label: string;
  base_url: string;
}

/** Each project's documented default port. */
export const PROBE_CANDIDATES: ProbeCandidate[] = [
  { label: "Ollama", base_url: "http://127.0.0.1:11434" },
  { label: "LM Studio", base_url: "http://127.0.0.1:1234" },
  { label: "llama-server", base_url: "http://127.0.0.1:8080" },
];

export interface DetectedEndpoint {
  label: string;
  base_url: string;
  /** Model ids the endpoint reports having loaded/available, for pre-filling
   *  the model field — empty if it answered but listed nothing. */
  models: string[];
}

const PROBE_TIMEOUT_MS = 400;

export type FetchFn = typeof fetch;

export async function probeEndpoint(
  candidate: ProbeCandidate,
  fetchImpl: FetchFn = fetch,
): Promise<DetectedEndpoint | null> {
  try {
    const resp = await fetchImpl(`${candidate.base_url}/v1/models`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!resp.ok) return null;
    const body = (await resp.json()) as { data?: { id?: string }[] };
    const models = (body.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
    return { label: candidate.label, base_url: candidate.base_url, models };
  } catch {
    // Nothing listening, timed out, or answered with something that isn't
    // JSON shaped like this — all the same "not there" as far as this cares.
    return null;
  }
}

/** Every candidate, checked in parallel — worst case this costs one
 *  `PROBE_TIMEOUT_MS` wait, not one per candidate. */
export async function probeAll(fetchImpl: FetchFn = fetch): Promise<DetectedEndpoint[]> {
  const results = await Promise.all(
    PROBE_CANDIDATES.map((c) => probeEndpoint(c, fetchImpl)),
  );
  return results.filter((r): r is DetectedEndpoint => r !== null);
}
