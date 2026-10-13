/**
 * Stable Audio's clipped-render retry.
 *
 * audio.cpp's stable_audio returns rail-to-rail noise at some requested
 * durations (0.8s, 1.2s, 1.6s, 3.7s… measured, seed-independent). The adapter
 * re-renders a little longer and cuts back; these pin that down against a stub
 * runtime that is broken at whichever durations a test chooses.
 */

import { WaveFile } from "wavefile";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AudioCppModel,
  catalogById,
  railFraction,
  type PackageInstaller,
} from "../src/models/audiocpp.js";

const SR = 44100;

/** `seconds` of stereo audio: a quiet sine, or a square wave at full scale. */
function wav(seconds: number, saturated: boolean): string {
  const n = Math.round(seconds * SR);
  const ch = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    ch[i] = saturated ? (i % 2 ? 32767 : -32768) : Math.round(3000 * Math.sin(i / 10));
  }
  const w = new WaveFile();
  w.fromScratch(2, SR, "16", [Array.from(ch), Array.from(ch)]);
  return Buffer.from(w.toBuffer()).toString("base64");
}

/** A runtime that clips at every duration in `bad`. */
function host(bad: number[]): PackageInstaller & { asked: number[] } {
  const asked: number[] = [];
  return {
    asked,
    async installPackage() {
      return true;
    },
    async deletePackage() {
      return true;
    },
    async loadModel() {
      return true;
    },
    async unloadModel() {},
    async runTask(body: Record<string, unknown>) {
      const d = body["duration_seconds"] as number;
      asked.push(d);
      return { audio: wav(d, bad.includes(d)), sample_rate: SR, channels: 2 } as never;
    },
  } as PackageInstaller & { asked: number[] };
}

function model(id: string, h: PackageInstaller): AudioCppModel {
  const spec = catalogById().get(id)!;
  const m = new AudioCppModel(spec, "/models", null, "/models/audiocpp", h);
  vi.spyOn(m, "weightsFile").mockResolvedValue("/models/audiocpp/fake/weights.gguf");
  vi.spyOn(m, "depsInstalled").mockResolvedValue(true);
  vi.spyOn(m, "requireDeps").mockResolvedValue(undefined);
  return m;
}

beforeEach(() => vi.restoreAllMocks());

describe("clipped Stable Audio renders", () => {
  it("re-renders longer and cuts back to the requested length", async () => {
    const h = host([0.8, 0.9]);
    const m = model("audiocpp-stable-audio-3-sfx", h);

    const { audio, sampleRate } = await m.generate("dog yelp", 0.8, { seed: 1 });

    expect(h.asked).toEqual([0.8, 0.9, 1]);
    expect(audio[0].length).toBe(Math.round(0.8 * sampleRate));
    expect(railFraction(audio)).toBe(0);
  });

  it("leaves a clean render alone", async () => {
    const h = host([]);
    const m = model("audiocpp-stable-audio-3-sfx", h);
    await m.generate("dog yelp", 2, {});
    expect(h.asked).toEqual([2]);
  });

  it("fails rather than hand back noise when nothing nearby renders", async () => {
    const all = Array.from({ length: 12 }, (_, i) => Math.round((0.8 + i * 0.1) * 1000) / 1000);
    const m = model("audiocpp-stable-audio-3-sfx", host(all));
    await expect(m.generate("dog yelp", 0.8, {})).rejects.toThrow(/clipped noise/);
  });

  it("does not second-guess other families", async () => {
    const h = host([5]);
    const m = model("audiocpp-ace-step", h);
    await m.generate("lofi loop", 5, {});
    expect(h.asked).toEqual([5]);
  });
});
