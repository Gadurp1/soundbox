/**
 * Follow a job to completion.
 *
 * Subscribes to `GET /api/jobs/{id}/events` (SSE, `data: <Job JSON>`); if the
 * EventSource errors the transport transparently falls back to polling
 * `GET /api/jobs/{id}` every 750ms. Pass `null` to stop watching.
 */

import { useEffect, useState } from "react";
import { api, errorMessage, type Job } from "@/lib/api";

export interface JobStream {
  job: Job | null;
  error: string | null;
  /** True while the job exists and has not reached a terminal status. */
  active: boolean;
}

const TERMINAL = new Set(["done", "error", "cancelled"]);

export function useJobStream(jobId: string | null): JobStream {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJob(null);
    setError(null);
    if (!jobId) return;
    const unsubscribe = api.subscribeJob(
      jobId,
      (next) => setJob(next),
      (err) => setError(errorMessage(err)),
    );
    return unsubscribe;
  }, [jobId]);

  return {
    job,
    error,
    active: Boolean(jobId) && (!job || !TERMINAL.has(job.status)),
  };
}

/**
 * Follow N jobs to completion at once, each with its own live EventSource.
 *
 * `useJobStream` is fine for a screen that only ever cares about "the current
 * job" — the composer's own inline progress. But any list view can have
 * several turns in flight together (a second Generate fired while the first
 * is still rendering, or several category pages sharing one session), and
 * they each need their own subscription: sharing one `jobId` slot means every
 * row but the most-recently-submitted one silently stops receiving updates
 * and its progress bar freezes at whatever percent it last saw.
 *
 * Subscriptions are kept in a ref, diffed against `jobIds` on every render
 * (mount new ones, tear down ones no longer requested) rather than expressed
 * as one `useJobStream` call per id — the list's length changes across
 * renders, which plain hook calls can't do.
 */
export interface JobStreams {
  jobs: Record<string, Job>;
  errors: Record<string, string>;
}

export function useJobStreams(jobIds: readonly string[]): JobStreams {
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const subs = useState(() => new Map<string, () => void>())[0];

  useEffect(() => {
    const wanted = new Set(jobIds);

    // Drop subscriptions for ids no longer requested, and their stale state.
    for (const id of [...subs.keys()]) {
      if (wanted.has(id)) continue;
      subs.get(id)?.();
      subs.delete(id);
      setJobs((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setErrors((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

    // Add subscriptions for newly requested ids.
    for (const id of wanted) {
      if (subs.has(id)) continue;
      const unsubscribe = api.subscribeJob(
        id,
        (next) => setJobs((prev) => ({ ...prev, [id]: next })),
        (err) => setErrors((prev) => ({ ...prev, [id]: errorMessage(err) })),
      );
      subs.set(id, unsubscribe);
    }
  }, [jobIds, subs]);

  // Tear every subscription down on unmount.
  useEffect(() => () => subs.forEach((unsubscribe) => unsubscribe()), [subs]);

  return { jobs, errors };
}
