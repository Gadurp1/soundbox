/**
 * A sound's own mark: its peaks folded down to a handful of mirrored bars.
 *
 * This is what stands in for cover art when a sound has none. It used to be
 * the same waveform icon on every row, which said "a sound is here" and
 * nothing else; a glyph drawn from the sound's own envelope tells a door slam
 * from a rain bed at a glance, and no two tiles on a page look alike. It is
 * the brand's one illustration, and it costs nothing — the peaks are already
 * on the sound for the waveform.
 */

import { useMemo } from "react";

import { cn } from "@/lib/utils";

/** Fold `peaks` into `bars` buckets, keeping each bucket's loudest sample —
 *  a mean would flatten the transient that makes an impact look like one. */
export function foldPeaks(peaks: readonly number[] | null | undefined, bars: number): number[] {
  if (!peaks || peaks.length === 0) return [];
  const out: number[] = [];
  const step = peaks.length / bars;
  let max = 0;
  for (let i = 0; i < bars; i++) {
    let m = 0;
    const end = Math.min(peaks.length, Math.max(Math.floor((i + 1) * step), Math.floor(i * step) + 1));
    for (let j = Math.floor(i * step); j < end; j++) m = Math.max(m, Math.abs(peaks[j] ?? 0));
    out.push(m);
    max = Math.max(max, m);
  }
  // Normalised, with a floor so a silent stretch still draws a dot rather
  // than leaving a hole in the glyph.
  return out.map((v) => Math.max(0.08, max > 0 ? v / max : 0));
}

export function PeakGlyph({
  peaks,
  bars = 9,
  className,
}: {
  peaks: readonly number[] | null | undefined;
  bars?: number;
  className?: string;
}) {
  const heights = useMemo(() => foldPeaks(peaks, bars), [peaks, bars]);
  if (heights.length === 0) return null;
  const w = bars * 3 - 1;
  return (
    <svg
      viewBox={`0 0 ${w} 20`}
      className={cn("h-5 w-auto", className)}
      aria-hidden="true"
      focusable="false"
    >
      {heights.map((h, i) => {
        const len = Math.max(2, h * 20);
        return (
          <rect
            key={i}
            x={i * 3}
            y={(20 - len) / 2}
            width={2}
            height={len}
            rx={1}
            fill="currentColor"
            // The loudest bars carry the signal colour; the rest stay
            // graphite, so the glyph's shape is the sound's shape.
            className={h > 0.82 ? "text-primary" : undefined}
          />
        );
      })}
    </svg>
  );
}
