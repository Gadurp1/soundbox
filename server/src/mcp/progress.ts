/**
 * `notifications/progress` for tools that block on a job.
 *
 * A render can outlast a client's tool-call timeout — several clients kill a
 * call at 60 s — and from the client's side a call that says nothing for a
 * minute looks the same as one that hung. A client that wants to hear about it
 * puts a `progressToken` in the request's `_meta`; this sends that token
 * notifications carrying the job's 0–1 fraction and its message, so the client
 * can show it and, if it resets its timeout on progress, keep the call alive.
 *
 * Throttled on both ends: a change goes out at most once per `minIntervalMs`,
 * and a heartbeat goes out every `heartbeatMs` even when nothing moved, because
 * the stretch most likely to trip a timeout — loading weights — is exactly the
 * one where the fraction sits still.
 *
 * Without a token every method is a no-op, so tools call it unconditionally.
 */

/** The slice of a request handler's `extra` this needs — loose so the stdio
 *  bridge and the HTTP server can both hand theirs over. */
export interface ProgressExtra {
  _meta?: { progressToken?: string | number };
  sendNotification: (notification: {
    method: "notifications/progress";
    params: { progressToken: string | number; progress: number; total?: number; message?: string };
  }) => Promise<void>;
}

/** What a job looks like from here: the in-process Job and the HTTP job JSON
 *  share these fields. */
export interface JobLike {
  status: string;
  phase?: string | null;
  progress?: number | null;
  message?: string | null;
}

export interface ProgressOptions {
  /** Least time between two notifications that report a change. */
  minIntervalMs?: number;
  /** Most time between two notifications, changed or not. */
  heartbeatMs?: number;
  /** Clock, for tests. */
  now?: () => number;
}

/**
 * The spec requires `progress` to increase with every notification, so a
 * heartbeat that repeats the same fraction is nudged up by this much. Far
 * below anything a client rounds to.
 */
const NUDGE = 1e-6;

export class ProgressReporter {
  private readonly token: string | number | undefined;
  private readonly send: ProgressExtra["sendNotification"] | undefined;
  private readonly minIntervalMs: number;
  private readonly heartbeatMs: number;
  private readonly now: () => number;
  private lastSentAt = -Infinity;
  private lastProgress = -1;
  private lastMessage: string | undefined;

  constructor(extra: ProgressExtra | undefined, opts: ProgressOptions = {}) {
    this.token = extra?._meta?.progressToken;
    this.send = extra?.sendNotification;
    this.minIntervalMs = opts.minIntervalMs ?? 1_000;
    this.heartbeatMs = opts.heartbeatMs ?? 5_000;
    this.now = opts.now ?? (() => performance.now());
  }

  get active(): boolean {
    return this.token !== undefined && this.send !== undefined;
  }

  /**
   * Report where the work is. Cheap to call on every poll; decides itself
   * whether this one goes out.
   */
  update(fraction: number, message?: string): void {
    if (!this.active) return;
    const t = this.now();
    const elapsed = t - this.lastSentAt;
    const frac = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
    const changed = frac > this.lastProgress || (message !== undefined && message !== this.lastMessage);
    if (!(changed && elapsed >= this.minIntervalMs) && elapsed < this.heartbeatMs) return;

    // Never report less than last time, and always report more.
    const progress = Math.min(1, Math.max(frac, this.lastProgress + NUDGE));
    if (progress <= this.lastProgress) return; // already at 1: nothing left to say
    this.lastSentAt = t;
    this.lastProgress = progress;
    this.lastMessage = message;
    const params: { progressToken: string | number; progress: number; total: number; message?: string } = {
      progressToken: this.token!,
      progress,
      total: 1,
    };
    if (message) params.message = message;
    // A client that went away mid-render must not fail the render.
    this.send!({ method: "notifications/progress", params }).catch(() => undefined);
  }

  /** `update` from a job snapshot. */
  job(job: JobLike): void {
    this.update(job.progress ?? 0, describe(job));
  }

  /**
   * A reporter for step `index` of `count` sequential jobs, mapping each job's
   * 0–1 onto its share of the whole — speak_story reads one line per job.
   */
  step(index: number, count: number, label?: string): (job: JobLike) => void {
    return (job) => {
      const inner = job.status === "done" ? 1 : (job.progress ?? 0);
      const what = describe(job);
      this.update(
        (index + inner) / Math.max(1, count),
        label ? (what ? `${label}: ${what}` : label) : what,
      );
    };
  }
}

/** The job's own words, or failing that the stage it is in. */
function describe(job: JobLike): string | undefined {
  // A finished job keeps its last message ("sampling"); say it is done.
  if (job.status === "done") return "done";
  return job.message || job.phase || job.status || undefined;
}
