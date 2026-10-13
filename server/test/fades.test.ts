import { describe, expect, it } from "vitest";

import { applyFades, frameCount, type Audio } from "../src/audio/dsp.js";

const RATE = 1000;

function flat(frames: number, value = 1): Audio {
  return [new Float32Array(frames).fill(value)];
}

describe("applyFades", () => {
  it("ramps from silence and back to it, and leaves the middle alone", () => {
    const faded = applyFades(flat(1000), RATE, 0.25, 0.5);
    const at = (i: number) => faded[0][i];

    expect(at(0)).toBeCloseTo(0, 5);
    expect(at(249)).toBeGreaterThan(0.99);
    expect(at(375)).toBe(1); // between the two fades: untouched
    expect(at(999)).toBeCloseTo(0, 2);
    // Monotonic through the fade in, which a curve with the wrong sign or a
    // reversed index would not be.
    for (let i = 1; i < 250; i += 1) expect(at(i)).toBeGreaterThan(at(i - 1));
  });

  it("holds the level through a crossfade, which is why the curves are equal-power", () => {
    // The two halves of a join: one clip fading out under another fading in.
    const rising = applyFades(flat(500), RATE, 0.5, 0)[0];
    const falling = applyFades(flat(500), RATE, 0, 0.5)[0];

    let worst = 0;
    for (let i = 0; i < 500; i += 1) {
      // Uncorrelated material sums in power, not amplitude.
      const summed = Math.sqrt(rising[i] ** 2 + falling[i] ** 2);
      worst = Math.max(worst, Math.abs(summed - 1));
    }
    // Two linear ramps would dip to 0.707 here — a 3 dB hole in the middle of
    // every crossfade.
    expect(worst).toBeLessThan(0.001);
  });

  it("survives fades longer than the clip rather than reading off the end", () => {
    const faded = applyFades(flat(100), RATE, 5, 5);
    expect(frameCount(faded)).toBe(100);
    expect(faded[0].every((v) => v >= 0 && v <= 1)).toBe(true);
  });

  it("returns the clip untouched when both fades are zero", () => {
    const audio = flat(10);
    expect(applyFades(audio, RATE, 0, 0)).toBe(audio);
  });
});
