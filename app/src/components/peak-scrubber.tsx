/**
 * A slim, clickable seek strip drawn from a sound's peaks.
 *
 * For the places that audition a single sound through a bare `<audio>` element
 * rather than the full `WaveformPlayer`: the studio's library shelf and the
 * script's per-line audition. Both had a play button and nothing else, so a
 * sound could only ever be heard from the top — and in a shelf of twenty
 * takes, "hear the bit four seconds in" meant listening to the first four
 * seconds, every time.
 *
 * Not `WaveformPlayer`, deliberately. That mounts a wavesurfer instance with
 * its own media element and transport, which is right for a library row and
 * wrong for twenty rows in a scrolling shelf — twenty decoders and twenty
 * subscriptions for a control that is 20 pixels tall. This draws the peaks the
 * server already computed as plain SVG and reports clicks in seconds; whoever
 * owns the audio element does the seeking. Presentational on purpose: the two
 * callers arbitrate playback differently (one element per pane, one per page)
 * and neither should have to hand that over to get a scrub bar.
 */

import { cn } from "@/lib/utils";

export function PeakScrubber({
  peaks,
  durationS,
  currentTime,
  onSeek,
  className,
  label = "Seek",
}: {
  /** The sound's precomputed peaks, 0..1. An empty array still renders a
   *  clickable strip — seeking must not depend on having a picture. */
  peaks: number[];
  durationS: number;
  currentTime: number;
  /** Called with the clicked position in seconds. */
  onSeek: (seconds: number) => void;
  className?: string;
  label?: string;
}) {
  const fraction =
    durationS > 0 ? Math.min(1, Math.max(0, currentTime / durationS)) : 0;

  /** Seconds under the pointer, from the strip's own box rather than the
   *  event target's — a click can land on a bar, which is narrower. */
  function seekFromEvent(event: React.MouseEvent<HTMLDivElement>): void {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width <= 0 || durationS <= 0) return;
    const ratio = (event.clientX - box.left) / box.width;
    onSeek(Math.min(durationS, Math.max(0, ratio * durationS)));
  }

  return (
    <div
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(durationS)}
      aria-valuenow={Math.round(currentTime)}
      tabIndex={0}
      onClick={seekFromEvent}
      // Arrow keys nudge, because a strip you can only click is unusable
      // without a mouse and this is the only seek control these rows have.
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const step = e.key === "ArrowLeft" ? -1 : 1;
        onSeek(Math.min(durationS, Math.max(0, currentTime + step)));
      }}
      className={cn(
        "focus-visible:ring-ring/50 relative cursor-pointer overflow-hidden rounded-sm outline-none focus-visible:ring-2",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="text-muted-foreground/50 h-full w-full"
      >
        {peaks.map((p, i) => {
          const h = 2 + Math.min(1, Math.max(0, p)) * 16;
          return (
            <rect
              key={i}
              x={(i / Math.max(1, peaks.length)) * 100}
              y={10 - h / 2}
              width={Math.max(0.6, 100 / Math.max(1, peaks.length) - 0.4)}
              height={h}
              rx={0.4}
              className="fill-current"
            />
          );
        })}
      </svg>
      {/* The played portion, drawn over the bars rather than as a second copy
          of them — one SVG, and the fill can never drift out of step with it. */}
      <div
        aria-hidden="true"
        className="bg-primary/25 pointer-events-none absolute inset-y-0 left-0"
        style={{ width: `${fraction * 100}%` }}
      />
      <div
        aria-hidden="true"
        className="bg-primary pointer-events-none absolute inset-y-0 w-px"
        style={{ left: `${fraction * 100}%` }}
      />
    </div>
  );
}
