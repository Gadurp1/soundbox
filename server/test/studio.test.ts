import { describe, expect, it } from "vitest";

import {
  buildStudioMessages,
  isDestructive,
  parseStudioPlan,
  validateActions,
} from "../src/llm/studio.js";
import type { StudioContext } from "../src/llm/studio.js";

const ctx: StudioContext = {
  tracks: [
    { track_index: 0, name: null, muted: false, soloed: false },
    { track_index: 1, name: "Bass", muted: false, soloed: false },
  ],
  clips: [
    { id: "c1", track_index: 0, start_s: 0, duration_s: 4, label: "kick loop" },
    { id: "c2", track_index: 1, start_s: 4, duration_s: 2, label: "bass hit" },
  ],
  playhead_s: 3,
  selected_ids: ["c2"],
};

describe("buildStudioMessages", () => {
  it("lists every id and lane the model is allowed to name", () => {
    const [, user] = buildStudioMessages("mute 1", ctx);
    expect(user!.content).toMatch(/c1 — track 0/);
    expect(user!.content).toMatch(/track 1: Bass/);
  });

  it("carries the playhead and the selection, which only the page knows", () => {
    const [, user] = buildStudioMessages("move it here", ctx);
    expect(user!.content).toMatch(/Playhead: 3\.00s/);
    expect(user!.content).toMatch(/Selected clips: c2/);
  });

  // A small model read "mute 1 and 3" as list positions and returned tracks 0
  // and 2 — the numbers are printed on the lanes, so they are already the
  // indices and must never be shifted.
  it("states that track numbers are literal", () => {
    const [system] = buildStudioMessages("mute 1 and 3", ctx);
    expect(system!.content).toMatch(/TRACK NUMBERS ARE LITERAL/);
  });
});

describe("validateActions", () => {
  it("keeps well-formed actions", () => {
    const { actions, dropped } = validateActions(
      [
        { type: "set_track", track_index: 1, muted: true },
        { type: "rename_track", track_index: 0, name: "Kick" },
        { type: "move_clip", clip_id: "c1", start_s: 2 },
      ],
      ctx,
    );
    expect(actions).toHaveLength(3);
    expect(dropped).toBe(0);
  });

  // The whole point of validating rather than trusting: an id the model made
  // up must never reach the API as a request against something real.
  it("drops actions naming a clip or track that does not exist", () => {
    const { actions, dropped } = validateActions(
      [
        { type: "delete_clip", clip_id: "does-not-exist" },
        { type: "set_track", track_index: 47, muted: true },
        { type: "rename_track", track_index: 0, name: "Kick" },
      ],
      ctx,
    );
    expect(actions).toEqual([{ type: "rename_track", track_index: 0, name: "Kick" }]);
    expect(dropped).toBe(2);
  });

  it("drops actions that would change nothing", () => {
    const { actions } = validateActions(
      [
        { type: "set_track", track_index: 0 },
        { type: "set_clip", clip_id: "c1" },
        { type: "rename_track", track_index: 0, name: "   " },
      ],
      ctx,
    );
    expect(actions).toEqual([]);
  });

  it("refuses an unknown action type and non-objects", () => {
    const { actions, dropped } = validateActions(
      [{ type: "drop_database" }, "rm -rf", null, 42],
      ctx,
    );
    expect(actions).toEqual([]);
    expect(dropped).toBe(4);
  });

  it("never lets a clip land before zero", () => {
    const { actions } = validateActions([{ type: "move_clip", clip_id: "c1", start_s: -99 }], ctx);
    expect(actions).toEqual([{ type: "move_clip", clip_id: "c1", start_s: 0 }]);
  });

  // Adding may name the next lane down — "put it on a new track" is a real
  // instruction — but not an arbitrary one.
  it("allows add_clip onto the next lane but no further", () => {
    const next = validateActions(
      [{ type: "add_clip", track_index: 2, start_s: 1, text: "hi" }],
      ctx,
    );
    expect(next.actions).toHaveLength(1);
    const far = validateActions(
      [{ type: "add_clip", track_index: 9, start_s: 1, text: "hi" }],
      ctx,
    );
    expect(far.actions).toEqual([]);
  });

  it("falls back to the playhead when add_clip gives no time", () => {
    const { actions } = validateActions(
      [{ type: "add_clip", track_index: 0, text: "hi" }],
      ctx,
    );
    expect(actions).toEqual([{ type: "add_clip", track_index: 0, start_s: 3, text: "hi" }]);
  });
});

describe("parseStudioPlan", () => {
  it("reads a plan out of a fenced, reasoning-prefixed response", () => {
    const text =
      "<think>working it out</think>\n```json\n" +
      '{"summary":"Muted the bass.","actions":[{"type":"set_track","track_index":1,"muted":true}]}' +
      "\n```";
    const plan = parseStudioPlan(text, ctx);
    expect(plan.summary).toBe("Muted the bass.");
    expect(plan.actions).toHaveLength(1);
  });

  it("returns nothing rather than throwing on junk", () => {
    expect(parseStudioPlan("no json here", ctx).actions).toEqual([]);
  });
});

describe("isDestructive", () => {
  it("flags deletion and nothing else", () => {
    expect(isDestructive({ type: "delete_clip", clip_id: "c1" })).toBe(true);
    expect(isDestructive({ type: "set_track", track_index: 0, muted: true })).toBe(false);
  });
});
