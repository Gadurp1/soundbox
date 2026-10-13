import { describe, expect, it } from "vitest";

import { paramsFor, withRequirements } from "../src/models/params.js";

describe("paramsFor", () => {
  it("gives Chatterbox exactly the four knobs audio.cpp lists for it", () => {
    // Measured against the binary: `exaggeration` and `temperature` change the
    // audio; `--instruct`, `--emotion`, `--speaking-rate` and `cfg_weight` —
    // none of which appear here — do nothing. This test is the guard on that
    // agreement, so a bad merge from upstream shows up as a failure rather
    // than as sliders that quietly do nothing.
    expect(paramsFor("chatterbox").map((p) => p.name)).toEqual([
      "exaggeration",
      "guidance_scale",
      "temperature",
      "repetition_penalty",
    ]);
  });

  it("carries the range a slider needs, from upstream rather than invented", () => {
    const exaggeration = paramsFor("chatterbox").find((p) => p.name === "exaggeration")!;
    expect(exaggeration).toMatchObject({
      type: "slider",
      default: 0.5,
      minimum: 0,
      maximum: 2,
      step: 0.05,
    });
  });

  it("puts the knobs that change delivery in front of the ones that don't", () => {
    const byName = Object.fromEntries(paramsFor("index_tts2").map((p) => [p.name, p.group]));
    expect(byName["emotion_text"]).toBe("delivery");
    expect(byName["emotion_alpha"]).toBe("delivery");
    expect(byName["duration_factor"]).toBe("delivery");
    expect(byName["interval_silence_ms"]).toBe("phrasing");
    expect(paramsFor("chatterbox").find((p) => p.name === "temperature")!.group).toBe("sampling");
  });

  it("never surfaces a label the reader cannot read", () => {
    // Upstream labels are partly Chinese; anything untranslated falls back to
    // the param's own name rather than being shown as-is.
    for (const family of ["index_tts2", "chatterbox", "vibevoice", "ace_step"]) {
      for (const param of paramsFor(family)) {
        expect(param.label).toMatch(/^[\x00-\x7F]*$/);
        expect(param.label.trim()).not.toBe("");
      }
    }
  });

  it("says nothing rather than guessing for a family with no entry", () => {
    // Fish Audio and Higgs have no upstream row: the words and the voice are
    // the only controls, and an empty list is how the UI says so.
    expect(paramsFor("fish_audio")).toEqual([]);
    expect(paramsFor("higgs_audio_tts")).toEqual([]);
    expect(paramsFor("no_such_family")).toEqual([]);
    expect(paramsFor(null)).toEqual([]);
  });
});

describe("withRequirements", () => {
  it("turns sampling on when a VibeVoice temperature is set", () => {
    // Measured: with do_sample at its default of false, VibeVoice returns
    // byte-identical audio at temperature 0.8 and 1.4.
    expect(withRequirements("vibevoice", { temperature: "1.4" })).toEqual({
      temperature: "1.4",
      do_sample: "true",
    });
  });

  it("leaves an explicit choice alone", () => {
    expect(withRequirements("vibevoice", { temperature: "1.4", do_sample: "false" })).toEqual({
      temperature: "1.4",
      do_sample: "false",
    });
  });

  it("adds nothing for a family whose knobs stand on their own", () => {
    expect(withRequirements("chatterbox", { exaggeration: "1.6" })).toEqual({
      exaggeration: "1.6",
    });
  });

  it("adds nothing when the dependent knob was not set", () => {
    expect(withRequirements("vibevoice", { guidance_scale: "2.5" })).toEqual({
      guidance_scale: "2.5",
    });
  });
});
