/**
 * How long each clip fades at each end.
 *
 * Two sources, taking whichever is longer:
 *
 * - the clip's own `fade_in_s` / `fade_out_s`, which is what someone asked for
 *   by dragging its corner;
 * - a crossfade across any overlap with the next clip on the same lane, which
 *   nobody asks for because nobody overlaps two clips wanting them to sum. Two
 *   clips summing through an overlap is a lump in the level at best and a
 *   click at both edges at worst.
 *
 * **This function has a twin in `server/src/service.ts`, inside `exportStory`.**
 * They have to agree: one decides what you hear while arranging, the other
 * what the mixdown writes, and a story that sounds different once exported is
 * the bug this whole file exists to avoid. Both use equal-power curves for the
 * same reason — two linear ramps summed across an overlap dip by 3 dB in the
 * middle, exactly where the join is supposed to be seamless.
 */

export interface FadeSpan {
  in: number;
  out: number;
}

interface Clip {
  id: string;
  track_index: number;
  start_s: number;
  duration_s?: number | null;
  fade_in_s?: number;
  fade_out_s?: number;
}

export function computeFades(clips: Clip[], lengthOf: (clip: Clip) => number): Map<string, FadeSpan> {
  const fades = new Map<string, FadeSpan>();
  const lanes = new Map<number, Clip[]>();

  for (const clip of clips) {
    fades.set(clip.id, { in: clip.fade_in_s ?? 0, out: clip.fade_out_s ?? 0 });
    const lane = lanes.get(clip.track_index) ?? [];
    lane.push(clip);
    lanes.set(clip.track_index, lane);
  }

  for (const lane of lanes.values()) {
    const order = [...lane].sort((a, b) => a.start_s - b.start_s);
    for (let i = 0; i < order.length - 1; i += 1) {
      const first = order[i];
      const next = order[i + 1];
      const overlap = first.start_s + lengthOf(first) - next.start_s;
      if (overlap <= 0) continue;
      // Never longer than either clip: a short clip dropped on top of a long
      // one crossfades over its own length, not the overlap's.
      const span = Math.min(overlap, lengthOf(first), lengthOf(next));
      const a = fades.get(first.id)!;
      const b = fades.get(next.id)!;
      a.out = Math.max(a.out, span);
      b.in = Math.max(b.in, span);
    }
  }

  return fades;
}

/** Points on an equal-power curve, for `AudioParam.setValueCurveAtTime`. */
export function fadeCurve(peak: number, rising: boolean, points = 64): Float32Array {
  return Float32Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    return peak * (rising ? Math.sin((Math.PI / 2) * t) : Math.cos((Math.PI / 2) * t));
  });
}
