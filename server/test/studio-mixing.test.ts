/**
 * The mixing half of the studio vocabulary: selectors that stand in for a
 * list of clip ids, the clip mix parameters, and effect knobs.
 *
 * Kept apart from `studio.test.ts` because that file is about the planner
 * resolving *references* — which clip is "the vocal" — and this one is about
 * what may then be done to them.
 */

import { describe, expect, it } from "vitest";

import { buildStudioMessages, resolveClipIds, validateActions } from "../src/llm/studio.js";
import type { StudioContext } from "../src/llm/studio.js";

const ctx: StudioContext = {
  tracks: [
    { track_index: 0, name: "Drums", muted: false, soloed: false },
    { track_index: 1, name: "Bass", muted: false, soloed: false, devices: ["reverb"] },
    { track_index: 2, name: null, muted: false, soloed: false },
  ],
  clips: [
    { id: "c1", track_index: 0, start_s: 0, duration_s: 4, label: "kick loop" },
    { id: "c2", track_index: 1, start_s: 4, duration_s: 2, label: "bass hit" },
    { id: "c3", track_index: 2, start_s: 1, duration_s: 8, label: "breathy female VOCAL hook" },
    { id: "c4", track_index: 2, start_s: 9, duration_s: 3, label: "vocal ad lib" },
  ],
  playhead_s: 3,
  selected_ids: ["c2", "c3"],
};

describe("resolveClipIds", () => {
  it("takes an explicit id over any selector", () => {
    expect(resolveClipIds({ clip_id: "c1", select: { scope: "all" } }, ctx)).toEqual(["c1"]);
  });

  it("ignores an id the timeline does not have", () => {
    expect(resolveClipIds({ clip_id: "nope" }, ctx)).toEqual([]);
  });

  it("expands scope:all to every clip", () => {
    expect(resolveClipIds({ select: { scope: "all" } }, ctx)).toEqual(["c1", "c2", "c3", "c4"]);
  });

  it("expands scope:selected to the selection", () => {
    expect(resolveClipIds({ select: { scope: "selected" } }, ctx)).toEqual(["c2", "c3"]);
  });

  it("expands from_track to that lane only", () => {
    expect(resolveClipIds({ select: { from_track: 2 } }, ctx)).toEqual(["c3", "c4"]);
  });

  it("matches labels case-insensitively", () => {
    expect(resolveClipIds({ select: { matching: "vocal" } }, ctx)).toEqual(["c3", "c4"]);
  });

  it("combines selector fields with AND", () => {
    expect(
      resolveClipIds({ select: { scope: "selected", matching: "vocal" } }, ctx),
    ).toEqual(["c3"]);
  });

  // A blank selector is a model emitting an empty field, not a request to
  // touch every clip on the timeline.
  it("treats an empty selector as no match rather than everything", () => {
    expect(resolveClipIds({ select: {} }, ctx)).toEqual([]);
  });

  it("accepts a plural id list, which some models answer with anyway", () => {
    expect(resolveClipIds({ clip_ids: ["c1", "bogus", "c4"] }, ctx)).toEqual(["c1", "c4"]);
  });
});

describe("bulk expansion", () => {
  // The whole point: one action in, one action per clip out, so nothing
  // downstream of the validator has to know selectors exist.
  it("turns 'move everything to one track' into one action per clip", () => {
    const { actions } = validateActions(
      [{ type: "move_clip", select: { scope: "all" }, track_index: 1 }],
      ctx,
    );
    expect(actions).toHaveLength(4);
    expect(actions.every((a) => a.type === "move_clip" && a.track_index === 1)).toBe(true);
    expect(actions.map((a) => (a.type === "move_clip" ? a.clip_id : ""))).toEqual([
      "c1",
      "c2",
      "c3",
      "c4",
    ]);
  });

  it("applies a gain change across a whole lane", () => {
    const { actions } = validateActions(
      [{ type: "set_clip", select: { from_track: 2 }, gain_db: -3 }],
      ctx,
    );
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ type: "set_clip", clip_id: "c3", gain_db: -3 });
  });

  it("deletes a whole selection", () => {
    const { actions } = validateActions(
      [{ type: "delete_clip", select: { scope: "selected" } }],
      ctx,
    );
    expect(actions.map((a) => (a.type === "delete_clip" ? a.clip_id : ""))).toEqual(["c2", "c3"]);
  });

  it("drops an action whose selector matches nothing", () => {
    const { actions, dropped } = validateActions(
      [{ type: "set_clip", select: { matching: "trombone" }, gain_db: -3 }],
      ctx,
    );
    expect(actions).toHaveLength(0);
    expect(dropped).toBe(1);
  });

  // Rewriting words is about one clip; broadcast across a selection it would
  // overwrite every line with the same sentence.
  it("never broadcasts a text rewrite across a selection", () => {
    const { actions } = validateActions(
      [{ type: "set_clip", select: { scope: "all" }, text: "hello" }],
      ctx,
    );
    expect(actions).toHaveLength(1);
  });
});

describe("clip mix parameters", () => {
  it("carries gain, fades and trim through", () => {
    const { actions } = validateActions(
      [
        {
          type: "set_clip",
          clip_id: "c1",
          gain_db: -6,
          fade_in_s: 0.5,
          fade_out_s: 1.25,
          duration_s: 3,
          trim_start_s: 0.2,
        },
      ],
      ctx,
    );
    expect(actions[0]).toMatchObject({
      type: "set_clip",
      clip_id: "c1",
      gain_db: -6,
      fade_in_s: 0.5,
      fade_out_s: 1.25,
      duration_s: 3,
      trim_start_s: 0.2,
    });
  });

  it("clamps gain to the mixer's range instead of dropping it", () => {
    const { actions } = validateActions([{ type: "set_clip", clip_id: "c1", gain_db: 99 }], ctx);
    expect(actions[0]).toMatchObject({ gain_db: 24 });
  });

  it("refuses a negative fade", () => {
    const { actions } = validateActions(
      [{ type: "set_clip", clip_id: "c1", fade_in_s: -2 }],
      ctx,
    );
    expect(actions[0]).toMatchObject({ fade_in_s: 0 });
  });

  it("drops a set_clip that changes nothing", () => {
    const { actions, dropped } = validateActions([{ type: "set_clip", clip_id: "c1" }], ctx);
    expect(actions).toHaveLength(0);
    expect(dropped).toBe(1);
  });
});

describe("set_device", () => {
  it("passes numeric knobs through for a known kind", () => {
    const { actions } = validateActions(
      [{ type: "set_device", track_index: 1, kind: "reverb", params: { wet: 0.6, decay: 2 } }],
      ctx,
    );
    expect(actions[0]).toMatchObject({
      type: "set_device",
      track_index: 1,
      kind: "reverb",
      params: { wet: 0.6, decay: 2 },
    });
  });

  it("drops non-numeric knob values rather than passing them on", () => {
    const { actions } = validateActions(
      [
        {
          type: "set_device",
          track_index: 1,
          kind: "reverb",
          params: { wet: "loads", decay: 2 },
        },
      ],
      ctx,
    );
    expect(actions[0]).toMatchObject({ params: { decay: 2 } });
  });

  it("drops an invented device kind", () => {
    const { actions, dropped } = validateActions(
      [{ type: "set_device", track_index: 1, kind: "flanger", params: { wet: 1 } }],
      ctx,
    );
    expect(actions).toHaveLength(0);
    expect(dropped).toBe(1);
  });

  it("drops a set_device with no usable parameters", () => {
    const { actions, dropped } = validateActions(
      [{ type: "set_device", track_index: 1, kind: "reverb", params: {} }],
      ctx,
    );
    expect(actions).toHaveLength(0);
    expect(dropped).toBe(1);
  });
});

describe("the edit prompt", () => {
  it("teaches selectors as the way to reach many clips", () => {
    const [system] = buildStudioMessages("move all the samples to one track", ctx);
    expect(system!.content).toMatch(/MANY CLIPS AT ONCE/);
    expect(system!.content).toMatch(/Never list clip ids one by one/);
    expect(system!.content).toMatch(/move all the samples to one track/);
  });

  it("states the mixing vocabulary", () => {
    const [system] = buildStudioMessages("turn the drums down", ctx);
    expect(system!.content).toMatch(/MIXING/);
    expect(system!.content).toMatch(/gain_db/);
    expect(system!.content).toMatch(/set_device/);
  });
});
