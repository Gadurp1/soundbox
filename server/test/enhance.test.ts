import { describe, expect, it } from "vitest";

import {
  buildEnhanceMessages,
  buildLyricsMessages,
  parseEnhanceResponse,
  parseLyrics,
  parseVariations,
  parseBrief,
  briefSummary,
  promptViolations,
  buildRepairMessages,
  buildDraftMessages,
} from "../src/llm/enhance.js";
import type { EnhanceInput } from "../src/llm/enhance.js";

describe("buildEnhanceMessages", () => {
  it("uses SFX guidance by default", () => {
    const [system, user] = buildEnhanceMessages({ prompt: "scary sound", n: 1 });
    expect(system!.role).toBe("system");
    expect(system!.content).toMatch(/material.*action.*space/i);
    expect(user!.content).toBe("scary sound");
  });

  it("uses music guidance for category=music", () => {
    const [system] = buildEnhanceMessages({ prompt: "scary music", n: 1, category: "music" });
    expect(system!.content).toMatch(/genre/i);
    // `instrument` rather than `instrumentation`: the guidance asks for "the
    // instruments and how they are played", which is the same requirement in
    // a better sentence, and the narrower pattern was only ever matching the
    // longer word by accident.
    expect(system!.content).toMatch(/instrument/i);
  });

  it("uses lyrics-mode guidance when lyrics=true, regardless of category", () => {
    const [system] = buildEnhanceMessages({ prompt: "upbeat", n: 1, lyrics: true });
    expect(system!.content).toMatch(/caption\/style field, not a scene description/i);
  });

  it("asks for N distinct variations when n>1", () => {
    const [system] = buildEnhanceMessages({ prompt: "scary sound", n: 3 });
    expect(system!.content).toMatch(/3 distinct variations/i);
  });

  it("adds Stable Audio's own tempo/instrumentation guidance for that family", () => {
    const [system] = buildEnhanceMessages({
      prompt: "scary music",
      n: 1,
      category: "music",
      model: { family: "stable_audio" },
    });
    expect(system!.content).toMatch(/Stable Audio/);
    expect(system!.content).toMatch(/BPM/);
  });

  it("adds ACE-Step's caption guidance for that family, without steering the prompt to BPM", () => {
    const [system] = buildEnhanceMessages({
      prompt: "upbeat",
      n: 1,
      lyrics: true,
      model: { family: "ace_step" },
    });
    expect(system!.content).toMatch(/ACE-Step/);
    expect(system!.content).toMatch(/Do not write tempo, BPM/);
  });

  it("never lets the prompt itself be a bare comma-separated list, even for ACE-Step", () => {
    // The prompt field must stay a phrase; a tag-list instinct (which
    // ACE-Step's own captions do accept) gets redirected to `tags` instead —
    // see the "not for the prompt" product decision this guards.
    const [system] = buildEnhanceMessages({ prompt: "x", n: 1, model: { family: "ace_step" } });
    // Matched on the rule's meaning rather than one phrasing of it: the
    // wording of `WRITE_A_SENTENCE` has been rewritten once already (see its
    // own comment) and left this assertion failing against a sentence that
    // still said exactly the right thing.
    expect(system!.content).toMatch(/Do NOT write a string of comma-separated fragments/);
    expect(system!.content).toMatch(/tags list/);
  });

  it("adds few-step guidance when the model's own defaults report a low step count", () => {
    const [system] = buildEnhanceMessages({
      prompt: "door slam",
      n: 1,
      model: { family: "stable_audio", defaultSteps: 8, maxCfg: 3.0 },
    });
    expect(system!.content).toMatch(/8 steps/);
    expect(system!.content).toMatch(/guidance scale capped at 3/);
  });

  it("omits few-step guidance for a model with a normal step count", () => {
    const [system] = buildEnhanceMessages({
      prompt: "door slam",
      n: 1,
      model: { family: null, defaultSteps: 50 },
    });
    expect(system!.content).not.toMatch(/little room to creatively/);
  });

  it("falls back to generic guidance for an unrecognised family", () => {
    const [system] = buildEnhanceMessages({
      prompt: "door slam",
      n: 1,
      model: { family: "some_future_family" },
    });
    expect(system!.content).toMatch(/material.*action.*space/i);
  });

  it("adds no model-specific guidance when no model context is given", () => {
    const [system] = buildEnhanceMessages({ prompt: "door slam", n: 1 });
    expect(system!.content).not.toMatch(/Stable Audio|ACE-Step|little room to creatively/);
  });
});

describe("parseVariations", () => {
  it("parses a clean JSON object", () => {
    const text = '{"variations": ["a", "b", "c"]}';
    expect(parseVariations(text, 3)).toEqual(["a", "b", "c"]);
  });

  it("parses a bare JSON array", () => {
    expect(parseVariations('["a", "b"]', 2)).toEqual(["a", "b"]);
  });

  it("strips a <think> block before parsing", () => {
    const text = "<think>reasoning about the prompt</think>\n" + '{"variations": ["a"]}';
    expect(parseVariations(text, 1)).toEqual(["a"]);
  });

  it("unwraps a JSON code fence", () => {
    const text = '```json\n{"variations": ["a", "b"]}\n```';
    expect(parseVariations(text, 2)).toEqual(["a", "b"]);
  });

  it("falls back to a numbered list when JSON parsing fails", () => {
    const text = "1. heavy wooden door slamming\n2. glass shattering on concrete";
    expect(parseVariations(text, 2)).toEqual([
      "heavy wooden door slamming",
      "glass shattering on concrete",
    ]);
  });

  it("falls back to a plain newline list", () => {
    const text = "heavy wooden door slamming\nglass shattering on concrete";
    expect(parseVariations(text, 2)).toEqual([
      "heavy wooden door slamming",
      "glass shattering on concrete",
    ]);
  });

  it("truncates to n even if more come back", () => {
    expect(parseVariations('{"variations": ["a", "b", "c"]}', 2)).toEqual(["a", "b"]);
  });

  it("falls back to the raw trimmed text on total garbage", () => {
    expect(parseVariations("  just plain prose  ", 1)).toEqual(["just plain prose"]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseVariations("   ", 1)).toEqual([]);
  });
});

describe("parseEnhanceResponse tags", () => {
  it("extracts suggested tags alongside variations", () => {
    const text = '{"variations": ["a door slam"], "tags": ["door", "impact", "wood"]}';
    expect(parseEnhanceResponse(text, 1)).toEqual({
      variations: ["a door slam"],
      tags: ["door", "impact", "wood"],
    });
  });

  it("caps tags at 6 even if more come back", () => {
    const distinct = Array.from({ length: 10 }, (_, i) => `"t${i}"`).join(", ");
    const text = `{"variations": ["x"], "tags": [${distinct}]}`;
    expect(parseEnhanceResponse(text, 1).tags).toHaveLength(6);
  });

  it("returns no tags when the field is absent", () => {
    expect(parseEnhanceResponse('{"variations": ["x"]}', 1).tags).toEqual([]);
  });

  it("returns no tags for the prose fallback path", () => {
    expect(parseEnhanceResponse("just plain prose", 1).tags).toEqual([]);
  });

  it("drops category names a weak model echoes back instead of real tags", () => {
    // Observed live from Qwen3 1.7B: it returned the category words verbatim.
    const text = '{"variations": ["x"], "tags": ["metal", "mood", "instrument", "material"]}';
    expect(parseEnhanceResponse(text, 1).tags).toEqual(["metal"]);
  });

  it("dedupes tags case-insensitively and strips stray quotes", () => {
    const text = '{"variations": ["x"], "tags": ["Wood", "wood", "\\"slam\\""]}';
    expect(parseEnhanceResponse(text, 1).tags).toEqual(["Wood", "slam"]);
  });
});

describe("buildLyricsMessages", () => {
  it("teaches structure tags, syllable balance and no-stacking", () => {
    const [system, user] = buildLyricsMessages({ theme: "a villain's rise to power" });
    expect(system!.content).toMatch(/\[Chorus\]/);
    expect(system!.content).toMatch(/6-10 syllables/);
    expect(system!.content).toMatch(/Never stack several/);
    expect(user!.content).toBe("a villain's rise to power");
  });

  it("asks for caption/tag consistency when a style is given", () => {
    const [system] = buildLyricsMessages({
      theme: "a quiet goodbye",
      style: "sad piano ballad, breathy female vocal",
    });
    expect(system!.content).toMatch(/sad piano ballad, breathy female vocal/);
    expect(system!.content).toMatch(/consistent/);
  });

  it("omits the consistency clause with no style", () => {
    const [system] = buildLyricsMessages({ theme: "a quiet goodbye" });
    expect(system!.content).not.toMatch(/consistent with it/);
  });
});

describe("parseLyrics", () => {
  it("trims and strips a <think> block", () => {
    const text = "<think>planning the song</think>\n[Verse]\nWalking through the empty streets";
    expect(parseLyrics(text)).toBe("[Verse]\nWalking through the empty streets");
  });

  it("unwraps a code fence", () => {
    const text = "```\n[Verse]\nWalking through the empty streets\n```";
    expect(parseLyrics(text)).toBe("[Verse]\nWalking through the empty streets");
  });

  it("preserves blank-line section separation", () => {
    const text = "[Verse]\nLine one\nLine two\n\n[Chorus]\nLine three";
    expect(parseLyrics(text)).toBe(text);
  });
});

/* --------------------------------------------------- the agentic music path */

describe("parseBrief", () => {
  const ok = JSON.stringify({
    genre: "lo-fi hip hop",
    era: "90s",
    instrumentation: ["Rhodes", "brushed kit"],
    vocal: "instrumental",
    rhythm: "slow shuffle",
    production: "tape saturation",
    mood: "wistful",
  });

  it("reads a full brief", () => {
    const brief = parseBrief(ok)!;
    expect(brief.genre).toBe("lo-fi hip hop");
    expect(brief.instrumentation).toEqual(["Rhodes", "brushed kit"]);
  });

  it("strips a leaked reasoning block first", () => {
    expect(parseBrief(`<think>deciding</think>${ok}`)?.genre).toBe("lo-fi hip hop");
  });

  it("unwraps a code fence", () => {
    expect(parseBrief("```json\n" + ok + "\n```")?.genre).toBe("lo-fi hip hop");
  });

  // A brief this empty decided nothing, and drafting from it would just be the
  // one-shot rewrite with two extra round trips — the caller falls back.
  it("rejects a brief that committed to nothing", () => {
    expect(parseBrief(JSON.stringify({ mood: "sad" }))).toBeNull();
    expect(parseBrief("not json at all")).toBeNull();
  });
});

describe("the song's arc", () => {
  const full = {
    genre: "lo-fi hip hop",
    era: "90s",
    instrumentation: ["Rhodes"],
    vocal: "instrumental",
    rhythm: "slow shuffle",
    production: "tape",
    mood: "wistful",
    arc: "sparse verses opening into a full chorus",
  };

  it("survives the round trip into the brief", () => {
    expect(parseBrief(JSON.stringify(full))?.arc).toBe("sparse verses opening into a full chorus");
  });

  // Both vendors close their own worked captions on how the song develops —
  // it is the field that separates a song from a loop of its ingredients.
  it("reaches the drafting pass", () => {
    expect(briefSummary(full)).toMatch(/How it develops: sparse verses/);
    const [system, user] = buildDraftMessages(
      { prompt: "x", n: 1, category: "music", model: { family: "ace_step" } },
      full,
    );
    expect(user!.content).toMatch(/sparse verses opening into a full chorus/);
    expect(system!.content).toMatch(/arc|develops/i);
  });

  it("is simply absent when the brief did not decide one", () => {
    expect(briefSummary({ ...full, arc: "" })).not.toMatch(/How it develops/);
  });
});

describe("briefSummary", () => {
  it("drops empty fields rather than writing them out as blanks", () => {
    const summary = briefSummary({
      genre: "ambient",
      era: "",
      instrumentation: ["pads"],
      vocal: "",
      rhythm: "",
      production: "",
      mood: "still",
    });
    expect(summary).toMatch(/Genre: ambient/);
    expect(summary).not.toMatch(/Vocal/);
    expect(summary).not.toMatch(/Era/);
  });
});

describe("promptViolations", () => {
  const ace: EnhanceInput = { prompt: "x", n: 1, category: "music", model: { family: "ace_step" } };
  const stable: EnhanceInput = {
    prompt: "x",
    n: 1,
    category: "music",
    model: { family: "stable_audio" },
  };
  const good = "a hazy lo-fi beat with brushed drums under a breathy female vocal";

  it("passes a well-formed caption", () => {
    expect(promptViolations(good, ace)).toEqual([]);
  });

  it("catches a tag dump with no connecting words", () => {
    expect(promptViolations("lo-fi, hip hop, vinyl, rhodes, mellow, jazzy", ace)).toEqual([
      expect.stringMatching(/comma-separated/),
    ]);
  });

  it("allows commas in an actual sentence", () => {
    expect(promptViolations("warm rhodes, brushed kit, and tape hiss over a shuffle", ace)).toEqual(
      [],
    );
  });

  // Tempo is a separate parameter on ACE-Step and documented prompt advice on
  // Stable Audio, so the same sentence is wrong for one and right for the other.
  it("flags a BPM only for the family that treats it as a setting", () => {
    const withBpm = "a lo-fi beat at 82 bpm with warm rhodes over brushed drums";
    expect(promptViolations(withBpm, ace)).toEqual([expect.stringMatching(/BPM/)]);
    expect(promptViolations(withBpm, stable)).toEqual([]);
  });

  it("flags a named key", () => {
    expect(promptViolations("a slow ballad in A minor with piano", ace)).toEqual([
      expect.stringMatching(/key/),
    ]);
  });

  // The regex that catches "in A minor" must not catch the article in "a
  // minor chord" — a false flag sends a good caption back for a pointless
  // repair, which is worse than not checking at all.
  it("does not mistake the article in 'a minor chord' for a key", () => {
    expect(promptViolations("a minor chord piano loop over brushed drums", ace)).toEqual([]);
    expect(promptViolations("a major lift in the chorus with warm strings", ace)).toEqual([]);
  });

  it("catches quotes, preambles, length and emptiness", () => {
    expect(promptViolations(`"${good}"`, ace)).toEqual([expect.stringMatching(/quotation/)]);
    expect(promptViolations(`Sure! ${good}`, ace)).toEqual([expect.stringMatching(/preamble/)]);
    expect(promptViolations(Array(50).fill("word").join(" "), ace)).toEqual([
      expect.stringMatching(/50 words/),
    ]);
    expect(promptViolations("   ", ace)).toEqual([expect.stringMatching(/empty/)]);
  });
});

describe("the word ceiling", () => {
  const forty = Array(40).fill("word").join(" ");
  const sfx: EnhanceInput = { prompt: "x", n: 1 };
  const music: EnhanceInput = { prompt: "x", n: 1, category: "music" };

  // A sound effect is one event and stays terse; a song has to name genre,
  // instruments, vocal, production *and* its arc, and Stability's own worked
  // music prompt is already about forty words long.
  it("is tighter for a sound effect than for a song", () => {
    expect(promptViolations(forty, sfx)).toEqual([expect.stringMatching(/under 30/)]);
    expect(promptViolations(forty, music)).toEqual([]);
  });

  it("applies the song ceiling to a lyrics caption too", () => {
    expect(promptViolations(forty, { prompt: "x", n: 1, lyrics: true })).toEqual([]);
  });
});

describe("buildRepairMessages", () => {
  it("carries the model's own constraint so the fix cannot reintroduce it", () => {
    const [system] = buildRepairMessages(
      { prompt: "x", n: 1, category: "music", model: { family: "ace_step" } },
      [{ text: "a beat at 82 bpm", problems: ["it names a BPM"] }],
    );
    expect(system!.content).toMatch(/BPM/);
  });

  it("lists each fault with its problems, numbered for the response order", () => {
    const [, user] = buildRepairMessages({ prompt: "x", n: 2, category: "music" }, [
      { text: "one", problems: ["too long"] },
      { text: "two", problems: ["quoted"] },
    ]);
    expect(user!.content).toMatch(/1\. "one"/);
    expect(user!.content).toMatch(/2\. "two"/);
  });
});
