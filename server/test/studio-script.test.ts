/**
 * Writing script: the planner that turns "write me a scene" into spoken
 * lines, and the casting rules that keep it from inventing a voice.
 */

import { describe, expect, it } from "vitest";

import {
  buildIntentMessages,
  buildScriptMessages,
  parseIntent,
  validateActions,
} from "../src/llm/studio.js";
import type { StudioContext } from "../src/llm/studio.js";

const ctx: StudioContext = {
  tracks: [
    { track_index: 0, name: "Narration", muted: false, soloed: false },
    { track_index: 1, name: null, muted: false, soloed: false },
  ],
  clips: [{ id: "c1", track_index: 0, start_s: 0, duration_s: 3, label: "the old lighthouse" }],
  playhead_s: 0,
  selected_ids: [],
  voices: [
    { id: "v-narrator", name: "Narrator", kind: "builtin", notes: "warm, unhurried" },
    { id: "v-mara", name: "Mara", kind: "clone", notes: null },
  ],
};

const noVoices: StudioContext = { ...ctx, voices: [] };

describe("buildScriptMessages", () => {
  it("lists the voices it may cast, by id", () => {
    const [system] = buildScriptMessages("write an intro", ctx);
    expect(system!.content).toMatch(/v-narrator — Narrator \(builtin\): warm, unhurried/);
    expect(system!.content).toMatch(/v-mara — Mara \(clone\)/);
  });

  it("says what to do when nothing has been saved", () => {
    const [system] = buildScriptMessages("write an intro", noVoices);
    expect(system!.content).toMatch(/none saved/);
    expect(system!.content).toMatch(/model's default voice/);
  });

  // The failure this prompt is written against: a model asked for dialogue
  // returns "Narrator: (softly) hello", which is then read aloud verbatim,
  // stage direction and all.
  it("forbids stage directions and speaker prefixes in the words", () => {
    const [system] = buildScriptMessages("a scene", ctx);
    expect(system!.content).toMatch(/No stage directions/);
    expect(system!.content).toMatch(/speaker goes in its own field/);
  });

  it("tells it not to place lines itself", () => {
    const [system] = buildScriptMessages("a scene", ctx);
    expect(system!.content).toMatch(/Do not set start_s or position/);
  });
});

describe("the script intent", () => {
  it("is offered to the classifier as words to be spoken", () => {
    const [system] = buildIntentMessages("write a line for the narrator");
    expect(system!.content).toMatch(/WRITING WORDS FOR SOMEONE TO/);
  });

  // Both of these were observed going to the wrong planner. "create a script
  // about poo" toggled the Script *panel*, because the panel entry used to
  // say "open the script" and so owned the word; "create 2 characters talking
  // to one another" rendered a man breathing, because people talking sounded
  // like a sound to make. The prompt cannot be tested against a model here,
  // so what is pinned is the guidance that fixes them — if someone rewrites
  // these lines away, the collisions come back.
  it("does not let the panel intent claim the word 'script'", () => {
    const [system] = buildIntentMessages("create a script about poo");
    expect(system!.content).not.toMatch(/'open the script'/);
    expect(system!.content).toMatch(/'create a script about X' -> script/);
  });

  it("routes people talking to writing, not to sound-making", () => {
    const [system] = buildIntentMessages("create 2 characters talking to one another");
    expect(system!.content).toMatch(/People talking are WORDS, not audio texture/);
    expect(system!.content).toMatch(/-> script, never generate_clip/);
  });

  // The over-correction: told that people talking are words, the classifier
  // read "a short theme song with vocals" as people talking and wrote four
  // spoken lines for a narrator. Sung vocals are an instrument.
  it("keeps sung vocals out of the script planner", () => {
    const [system] = buildIntentMessages("a short theme song with vocals");
    expect(system!.content).toMatch(/SUNG is not SPOKEN/);
    expect(system!.content).toMatch(/'a short theme song with vocals' -> compose/);
    expect(system!.content).toMatch(/Never script/);
  });

  it("says in the intent list itself that script is never sung", () => {
    const [system] = buildIntentMessages("anything");
    expect(system!.content).toMatch(/WORDS FOR SOMEONE TO \*SAY\*, never to sing/);
  });

  it("tells the classifier the verb does not decide", () => {
    const [system] = buildIntentMessages("make me a scene");
    expect(system!.content).toMatch(/'create', 'make' and 'generate' say nothing/);
  });

  it("parses back out of a reply", () => {
    expect(parseIntent('{"intent":"script"}')).toBe("script");
  });

  // The fallback is deliberate — the edit planner validates every id it
  // produces — but it must not swallow a real intent, which is what an
  // unregistered name would do silently.
  it("still falls back to edit for a name it does not know", () => {
    expect(parseIntent('{"intent":"interpretive-dance"}')).toBe("edit");
  });
});

describe("add_lines", () => {
  it("keeps well-formed lines with their casting", () => {
    const { actions } = validateActions(
      [
        {
          type: "add_lines",
          lines: [
            { text: "The lamp went out in ninety-two.", speaker: "Narrator", voice_id: "v-narrator" },
            { kind: "pause", duration_s: 0.8 },
            { text: "Nobody came to fix it.", speaker: "Mara", voice_id: "v-mara" },
          ],
        },
      ],
      ctx,
    );
    expect(actions).toHaveLength(1);
    const lines = actions[0]!.type === "add_lines" ? actions[0]!.lines : [];
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({ speaker: "Narrator", voice_id: "v-narrator", kind: "line" });
    expect(lines[1]).toMatchObject({ kind: "pause", duration_s: 0.8 });
  });

  // Same rule as a hallucinated clip id, with a softer landing: the line is
  // worth keeping, the casting is not.
  it("strips an invented voice but keeps the line", () => {
    const { actions } = validateActions(
      [{ type: "add_lines", lines: [{ text: "Hello.", voice_id: "v-nope", speaker: "Ghost" }] }],
      ctx,
    );
    const lines = actions[0]!.type === "add_lines" ? actions[0]!.lines : [];
    expect(lines[0]).toMatchObject({ text: "Hello.", speaker: "Ghost" });
    expect(lines[0]).not.toHaveProperty("voice_id");
  });

  it("drops a spoken line with no words", () => {
    const { actions } = validateActions(
      [{ type: "add_lines", lines: [{ text: "   " }, { text: "Real." }] }],
      ctx,
    );
    const lines = actions[0]!.type === "add_lines" ? actions[0]!.lines : [];
    expect(lines).toHaveLength(1);
    expect(lines[0]!.text).toBe("Real.");
  });

  it("gives a pause a length even when none was written", () => {
    const { actions } = validateActions(
      [{ type: "add_lines", lines: [{ kind: "pause" }] }],
      ctx,
    );
    const lines = actions[0]!.type === "add_lines" ? actions[0]!.lines : [];
    expect(lines[0]).toMatchObject({ kind: "pause", duration_s: 0.5 });
  });

  it("drops a lane the timeline does not have, keeping the line", () => {
    const { actions } = validateActions(
      [{ type: "add_lines", lines: [{ text: "Hi.", track_index: 40 }] }],
      ctx,
    );
    const lines = actions[0]!.type === "add_lines" ? actions[0]!.lines : [];
    expect(lines[0]).not.toHaveProperty("track_index");
  });

  it("drops the whole action when nothing survives", () => {
    const { actions, dropped } = validateActions(
      [{ type: "add_lines", lines: [{ text: "" }] }],
      ctx,
    );
    expect(actions).toHaveLength(0);
    expect(dropped).toBe(1);
  });
});

describe("recasting an existing line", () => {
  it("sets speaker and a known voice", () => {
    const { actions } = validateActions(
      [{ type: "set_clip", clip_id: "c1", speaker: "Mara", voice_id: "v-mara" }],
      ctx,
    );
    expect(actions[0]).toMatchObject({ speaker: "Mara", voice_id: "v-mara" });
  });

  it("refuses a voice that does not exist", () => {
    const { actions } = validateActions(
      [{ type: "set_clip", clip_id: "c1", speaker: "X", voice_id: "v-nope" }],
      ctx,
    );
    expect(actions[0]).not.toHaveProperty("voice_id");
    expect(actions[0]).toMatchObject({ speaker: "X" });
  });

  // "Put the whole scene in Mara's voice" is genuinely a bulk operation,
  // unlike rewriting words.
  it("recasts across a selection", () => {
    const many: StudioContext = {
      ...ctx,
      clips: [
        { id: "c1", track_index: 0, start_s: 0, duration_s: 1, label: "one" },
        { id: "c2", track_index: 0, start_s: 1, duration_s: 1, label: "two" },
      ],
    };
    const { actions } = validateActions(
      [{ type: "set_clip", select: { scope: "all" }, voice_id: "v-mara" }],
      many,
    );
    expect(actions).toHaveLength(2);
  });
});

describe("speak_lines", () => {
  it("resolves a selector into the lines to read", () => {
    const { actions } = validateActions(
      [{ type: "speak_lines", select: { scope: "all" } }],
      ctx,
    );
    expect(actions[0]).toMatchObject({ type: "speak_lines", clip_ids: ["c1"] });
  });

  it("drops a read of nothing", () => {
    const { actions, dropped } = validateActions(
      [{ type: "speak_lines", select: { matching: "nothing here" } }],
      ctx,
    );
    expect(actions).toHaveLength(0);
    expect(dropped).toBe(1);
  });
});
