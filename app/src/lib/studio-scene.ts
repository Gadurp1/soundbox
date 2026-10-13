/**
 * The made-up arrangement behind the marketing site's studio visuals.
 *
 * Pulled out of `components/timeline-banner.tsx` so the scroll-reveal
 * sections (`components/reveal-studio.tsx`) can build the same scene up
 * piece by piece instead of only ever showing it finished. One arrangement,
 * one set of waveforms, two different ways of presenting it — rather than a
 * second invented scene that would have to be kept looking equally
 * deliberate by hand.
 *
 * Everything here is pure data and pure functions: no DOM, no React, safe to
 * import from a component that renders during SSR.
 */

/**
 * How a clip's waveform is shaped.
 *
 * Bars drawn from flat noise look like flat noise on every lane, which makes
 * four lanes of "some audio" rather than an ambience bed under three hits. The
 * envelope is what carries the difference, so each clip declares which kind of
 * sound it is and the peaks are shaped to match.
 */
export type ClipShape = "impact" | "steady" | "swell";

export interface StudioClip {
  id: string;
  label: string;
  lane: number;
  startS: number;
  durationS: number;
  shape: ClipShape;
}

/** Seconds of arrangement shown, and therefore the loop period for the
 *  finished-scene banner. Long enough to read as a composed scene rather than
 *  a stutter, short enough that a visitor sees the whole thing without
 *  deciding to wait for it. */
export const LOOP_S = 12;

export const STUDIO_LANES = ["Ambience", "Foley", "Impacts", "Design"];

/**
 * The arrangement.
 *
 * Written by hand rather than generated: it has to look like something a
 * person built, which means an ambience bed running most of the length,
 * footsteps in a regular-but-not-perfect rhythm over it, and the impacts
 * landing on their own lane where they can be moved without disturbing
 * anything. Prompts are the sort the docs teach — material, action and space,
 * not mood labels.
 */
export const STUDIO_CLIPS: StudioClip[] = [
  { id: "rain", label: "rain on a tin roof", lane: 0, startS: 0, durationS: 11.4, shape: "steady" },

  { id: "step-1", label: "boots on gravel", lane: 1, startS: 1.2, durationS: 0.7, shape: "impact" },
  { id: "step-2", label: "boots on gravel", lane: 1, startS: 2.3, durationS: 0.7, shape: "impact" },
  { id: "step-3", label: "boots on gravel", lane: 1, startS: 3.3, durationS: 0.7, shape: "impact" },
  { id: "latch", label: "iron latch lifting", lane: 1, startS: 5.1, durationS: 1.3, shape: "impact" },

  { id: "door", label: "heavy door slam, stone corridor", lane: 2, startS: 6.0, durationS: 2.6, shape: "impact" },
  { id: "glass", label: "glass breaking on concrete", lane: 2, startS: 9.2, durationS: 2.1, shape: "impact" },

  { id: "riser", label: "low metallic riser", lane: 3, startS: 3.6, durationS: 2.6, shape: "swell" },
  { id: "hull", label: "ship's hull under pressure", lane: 3, startS: 7.4, durationS: 3.4, shape: "swell" },
];

/** Bars per second of clip. Dense enough to read as a waveform, sparse enough
 *  that the shortest clip here is still a handful of bars rather than a smear. */
const BARS_PER_S = 26;

/** Shortest clip that gets its prompt written on it. Anything briefer is a hit
 *  rather than a phrase, and its label would be two characters and an ellipsis. */
export const STUDIO_MIN_LABEL_S = 1.6;

/**
 * A small deterministic PRNG (mulberry32), seeded from the clip's id.
 *
 * `Math.random()` cannot be used here: these visuals are prerendered by
 * `vite-react-ssg` and then hydrated in the browser, so peaks generated at
 * build time and peaks generated on the client have to be identical or React
 * throws a hydration mismatch and the whole thing gets replaced. Seeding from
 * the id makes the same clip produce the same waveform everywhere, forever.
 */
function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Snap a generated value to four decimal places.
 *
 * Every generator below MUST pass its output through this before returning.
 * "Deterministic" turned out not to survive the SSR boundary on its own:
 * these values flow through `Math.sin`/`Math.exp`/`Math.pow`, which the spec
 * does not require to be correctly rounded — and the prerender runs in Node's
 * V8 while the page hydrates in the browser's, which can be a different V8
 * version disagreeing in the last ulp. React then sees `r="0.18577217533332294"`
 * from the server and `0.1857721753333229` from the client and reports a
 * hydration mismatch on a page that is, to any human, pixel-identical.
 * Four decimals is far below anything visible and far above ulp noise.
 */
function quantize(v: number): number {
  return Math.round(v * 1e4) / 1e4;
}

/** The envelope a shape imposes, as a multiplier at position `p` (0..1). */
function envelope(shape: ClipShape, p: number): number {
  switch (shape) {
    // Immediate attack, exponential tail — a hit.
    case "impact":
      return Math.exp(-4.2 * p) * 0.92 + 0.08;
    // Slow rise to a late peak, short fall — a riser.
    case "swell":
      return Math.min(1, Math.pow(p, 1.6) * 1.5) * (1 - Math.pow(p, 12)) * 0.9 + 0.1;
    // Flat with a gentle fade at each end — a bed.
    case "steady":
      return (0.42 + 0.18 * Math.sin(p * Math.PI * 7)) * Math.min(1, p * 14, (1 - p) * 14);
  }
}

/** Peak heights (0..1) for one clip, stable across SSR and hydration. */
export function studioPeaksFor(clip: StudioClip): number[] {
  const rand = seeded(clip.id);
  const count = Math.max(6, Math.round(clip.durationS * BARS_PER_S));
  return Array.from({ length: count }, (_, i) => {
    const p = count === 1 ? 0 : i / (count - 1);
    // A little jitter over the envelope, floored so no bar disappears entirely
    // — a zero-height bar reads as a gap in the audio, which is a lie.
    return quantize(Math.max(0.08, envelope(clip.shape, p) * (0.55 + rand() * 0.65)));
  });
}

/**
 * A long, seamlessly tiling waveform for the background texture behind the
 * landing page's sections (`components/wave-backdrop.tsx`).
 *
 * Two properties the clip generator above cannot give it:
 *
 * **It has no envelope.** A clip's peaks rise and decay because a clip is a
 * sound with a beginning and an end. A texture that did that would read as a
 * row of identical blobs once it repeats.
 *
 * **It is periodic**, so the last bar meets the first. Every harmonic is an
 * integer multiple of the tile width, which means two copies laid end to end
 * join without a seam — and that is what lets the drift animation loop by
 * translating exactly half its width, forever, with nothing to hide.
 *
 * Amplitude falls as `1/k` over a fractal-ish harmonic series rather than one
 * or two sines: a couple of sines is a smooth blob, and it is the small fast
 * terms that make it read as audio rather than as decoration.
 */
export function ambientPeaks(seed: string, count: number): number[] {
  const rand = seeded(seed);
  const harmonics = [1, 2, 3, 5, 8, 13, 21].map((k) => ({
    k,
    amp: (0.6 + rand() * 0.8) / k,
    phase: rand() * Math.PI * 2,
  }));
  const raw = Array.from({ length: count }, (_, i) => {
    const t = i / count;
    let v = 0;
    for (const h of harmonics) v += h.amp * Math.sin(2 * Math.PI * h.k * t + h.phase);
    return Math.abs(v);
  });
  const peak = Math.max(...raw) || 1;
  // Floored so the quiet stretches still show a line of texture rather than
  // a gap, which at this opacity would read as the pattern having failed.
  return raw.map((v) => quantize(Math.max(0.12, v / peak)));
}

/**
 * A dot field for the `halftone` backdrop variant, as radii in 0..1.
 *
 * Same periodicity contract as `ambientPeaks` and for the same reason: the
 * field drifts sideways under two copies of itself, so every harmonic in `x`
 * is an integer multiple of `cols` and the last column meets the first. The
 * `y` term is deliberately *not* constrained that way — nothing ever tiles
 * vertically here, and free frequencies in `y` are what stop the grid reading
 * as stripes.
 *
 * Returned row-major (`rows` arrays of `cols` radii) rather than flat, because
 * the caller has to place each dot on its own row anyway and a flat array only
 * moves the index arithmetic somewhere less obvious.
 */
export function halftoneField(seed: string, cols: number, rows: number): number[][] {
  const rand = seeded(seed);
  // Three terms, not seven: a halftone reads as a slow swell of density, and
  // the fast harmonics that make `ambientPeaks` look like audio just make this
  // look like noise.
  const waves = [1, 2, 3].map((k) => ({
    k,
    amp: (0.7 + rand() * 0.6) / k,
    phase: rand() * Math.PI * 2,
    // Cycles down the field's height. Fractional on purpose — see above.
    ky: 0.6 + rand() * 1.7,
  }));
  return Array.from({ length: rows }, (_, r) => {
    const y = rows === 1 ? 0.5 : r / (rows - 1);
    const raw = Array.from({ length: cols }, (_, c) => {
      const t = c / cols;
      let v = 0;
      for (const w of waves) {
        v += w.amp * Math.sin(2 * Math.PI * w.k * t + w.phase) * Math.cos(Math.PI * w.ky * y + w.phase);
      }
      return Math.abs(v);
    });
    return raw;
  }).map((row) => {
    // Normalised per row so every row carries some density. Normalising over
    // the whole field instead left the rows near a node of the `y` term as an
    // empty band, which reads as a rendering failure rather than as texture.
    const peak = Math.max(...row) || 1;
    return row.map((v) => quantize(0.18 + 0.82 * (v / peak)));
  });
}

export interface EqColumn {
  /** Resting height of the column, 0..1 of the band. */
  level: number;
  /** Seconds for one breath of this column. */
  duration: number;
  /** Seconds of offset, so the columns are never in step. */
  delay: number;
}

/**
 * Columns for the `eq` backdrop variant.
 *
 * This one does not drift, so it has no tiling constraint — its loop is per
 * column, in CSS. What it does need is for no two neighbours to share a phase:
 * a spectrum analyser where the whole row rises and falls together is a
 * progress bar. Hence a duration and a delay per column, both seeded so SSR
 * and hydration agree, and a shaped resting level so the field slopes off
 * towards the top end the way a real spectrum does.
 */
export function eqColumns(seed: string, count: number): EqColumn[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const p = count === 1 ? 0 : i / (count - 1);
    // Loosely 1/f: loud at the bottom of the spectrum, quiet at the top, with
    // enough jitter that the slope is not a straight line.
    const tilt = Math.pow(1 - p, 0.75) * 0.7 + 0.2;
    return {
      level: quantize(Math.max(0.12, Math.min(1, tilt * (0.6 + rand() * 0.7)))),
      // Slow, and slower than it looks — these are seconds per half-cycle
      // under `alternate`, so the visible period is double this.
      duration: quantize(5.5 + rand() * 7),
      delay: quantize(-rand() * 12),
    };
  });
}

/** Peaks for a single result clip — the shape `reveal-prompt-to-sample.tsx`
 *  shows once its mock generation finishes. Same generator, same determinism,
 *  a scene of its own rather than borrowing one of the arrangement's clips out
 *  of context. */
export function resultPeaksFor(seed: string, shape: ClipShape, durationS: number): number[] {
  return studioPeaksFor({ id: seed, label: "", lane: 0, startS: 0, durationS, shape });
}
