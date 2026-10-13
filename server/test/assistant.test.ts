/**
 * The guide: what it is shown, what it is forbidden, and what it is allowed
 * to hand back.
 *
 * It used to build generation requests, and most of this file used to check
 * that a proposal named a real model. It does no CRUD now — the tests that
 * went with that went with it — so what is left is the documentation it
 * quotes from, the routes it may point at, and the promises the prompt makes
 * about not doing things.
 */

import { describe, expect, it } from "vitest";

import {
  MAX_HISTORY_TURNS,
  SITE_MAP,
  buildAssistantMessages,
  buildOpenerMessages,
  parseAssistantReply,
  parseOpeners,
  FALLBACK_OPENERS,
  validateLinks,
} from "../src/llm/assistant.js";
import type {
  AssistantContext,
  AssistantModelCard,
  AssistantStudio,
  AssistantTurn,
} from "../src/llm/assistant.js";
import { findSections, formatSections, splitSections, terms } from "../src/llm/docs.js";

const card = (over: Partial<AssistantModelCard>): AssistantModelCard => ({
  id: "stable-audio-open",
  name: "Stable Audio Open",
  vendor: "Stability AI",
  category: "sfx",
  family: "stable_audio",
  license: { name: "Stability AI Community", commercial: "conditional" },
  max_duration_s: 47,
  ready: true,
  supports: { lyrics: false, negative_prompt: true, extend: false, cover: false },
  defaults: { duration_s: 10, steps: 100, cfg: 7 },
  description: "General sound effects and short music.",
  ...over,
});

const singer = card({
  id: "ace-step",
  name: "ACE-Step",
  vendor: "ACE Studio",
  category: "music",
  family: "ace_step",
  license: { name: "Apache-2.0", commercial: "yes" },
  max_duration_s: 240,
  supports: { lyrics: true, negative_prompt: false, extend: true, cover: true },
  defaults: { duration_s: 60 },
  description: "Lyrics-conditioned vocal music.",
});
const missing = card({ id: "moss", name: "MOSS", ready: false });

const ctx: AssistantContext = { models: [card({}), singer, missing] };

/** A studio open beside the chat — the state in which the guide must stop
 *  behaving like a signpost. */
const openStudio: AssistantStudio = {
  tracks: [{ track_index: 0, name: "Kick", muted: false, soloed: false }],
  clips: [],
  playhead_s: 0,
  selected_ids: [],
};
const ask = (q: string): AssistantTurn[] => [{ role: "user", content: q }];

/* ------------------------------------------------------------------ docs */

describe("splitSections", () => {
  it("splits on headings and keeps where each came from", () => {
    const sections = splitSections("docs/X.md", "# Title\nintro\n\n## Models\nabout models");
    expect(sections.map((s) => s.heading)).toEqual(["Title", "Models"]);
    expect(sections[1]).toMatchObject({ source: "docs/X.md", level: 2, body: "about models" });
  });

  // `# install this` inside a shell block is a comment, and splitting there
  // produces a section whose title is a line of bash.
  it("does not split on a hash inside fenced code", () => {
    const sections = splitSections("docs/X.md", "## Real\n```bash\n# not a heading\nls\n```\n");
    expect(sections).toHaveLength(1);
    expect(sections[0]!.heading).toBe("Real");
  });

  it("drops sections with no body rather than keeping empty headings", () => {
    const sections = splitSections("docs/X.md", "## Empty\n\n## Full\ntext");
    expect(sections.map((s) => s.heading)).toEqual(["Full"]);
  });
});

describe("terms", () => {
  it("drops words too common here to tell two sections apart", () => {
    expect(terms("How do I pick a model for my sound?")).not.toContain("model");
    expect(terms("How do I pick a model for my sound?")).toContain("pick");
  });
});

describe("findSections", () => {
  // Reads the real README and docs/ — the retrieval is only worth anything
  // if it works on the corpus that ships.
  it("finds the licence documentation from a question about licences", () => {
    const hits = findSections("which models can I use commercially?");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /licen[cs]/i.test(`${h.heading} ${h.body}`))).toBe(true);
  });

  it("finds MCP documentation from a question about agents", () => {
    const hits = findSections("how do I connect an MCP client?");
    expect(hits.some((h) => /mcp/i.test(`${h.source} ${h.heading} ${h.body}`))).toBe(true);
  });

  it("returns nothing for a question with no real words in it", () => {
    expect(findSections("the a of to")).toEqual([]);
  });

  it("says so plainly when nothing matched", () => {
    expect(formatSections([])).toMatch(/nothing in the documentation matched/);
  });
});

/* ----------------------------------------------------------------- links */

describe("validateLinks", () => {
  it("keeps a route that exists", () => {
    expect(validateLinks([{ to: "/models", label: "Models" }])).toEqual([
      { to: "/models", label: "Models" },
    ]);
  });

  // Same rule as an invented clip id: a path the guide made up is a 404
  // dressed as an answer.
  it("drops a route that does not exist", () => {
    expect(validateLinks([{ to: "/nope" }, { to: "/models" }])).toEqual([
      { to: "/models", label: "Models" },
    ]);
  });

  it("falls back to the route's own label when none was given", () => {
    expect(validateLinks([{ to: "/agents" }])[0]!.label).toBe("Agents");
  });

  it("de-duplicates and caps the list", () => {
    const many = SITE_MAP.map((r) => ({ to: r.to }));
    expect(validateLinks([...many, { to: "/models" }]).length).toBeLessThanOrEqual(3);
    expect(validateLinks([{ to: "/models" }, { to: "/models" }])).toHaveLength(1);
  });

  it("survives rubbish", () => {
    expect(validateLinks("nope")).toEqual([]);
    expect(validateLinks([null, 3, {}])).toEqual([]);
  });
});

/* ---------------------------------------------------------------- prompt */

describe("buildAssistantMessages", () => {
  it("puts the matching documentation in front of the model", () => {
    const [system] = buildAssistantMessages(ask("how do I connect an MCP client?"), ctx);
    expect(system!.content).toMatch(/THE DOCUMENTATION/);
    expect(system!.content).toMatch(/docs\/MCP\.md/);
  });

  it("still carries the model cards, licence and all", () => {
    const [system] = buildAssistantMessages(ask("what can I ship?"), ctx);
    expect(system!.content).toMatch(/ace-step — ACE-Step/);
    expect(system!.content).toMatch(/commercial use conditional/);
    expect(system!.content).toMatch(/moss — MOSS.*NOT INSTALLED/);
  });

  it("lists the routes it may send people to", () => {
    const [system] = buildAssistantMessages(ask("where are my voices?"), ctx);
    expect(system!.content).toMatch(/WHERE THINGS ARE/);
    expect(system!.content).toMatch(/\/voice\/lab — Voice Lab/);
  });

  // The whole point of the rewrite: it explains, it does not act. A guide
  // that offers to generate something writes a cheque the endpoint cannot
  // honour, because there is no action in its vocabulary at all.
  it("forbids doing anything", () => {
    const [system] = buildAssistantMessages(ask("make me a door slam"), ctx);
    expect(system!.content).toMatch(/WHAT YOU DO, AND DO NOT/);
    expect(system!.content).toMatch(/You do NOT make, change, delete or arrange anything/);
    expect(system!.content).toMatch(/never say you are doing one/);
  });

  it("keeps the two anti-refusal rules that were about the model, not the job", () => {
    const [system] = buildAssistantMessages(ask("anything"), ctx);
    expect(system!.content).toMatch(/Never say you lack context/);
    expect(system!.content).toMatch(/Never refuse a brief/);
  });

  it("still shows an open timeline", () => {
    const studio: AssistantStudio = {
      tracks: [{ track_index: 0, name: "Kick", muted: false, soloed: false }],
      clips: [],
      playhead_s: 0,
      selected_ids: [],
    };
    const messages = buildAssistantMessages(ask("how many tracks?"), { ...ctx, studio });
    expect(messages.some((m) => m.content.includes("open beside this chat"))).toBe(true);
  });

  /*
   * The redirect, and when it must not fire.
   *
   * These lock in the worst answer this app has given: someone sitting in a
   * studio, asking for music, told to go to a studio and handed a docs link.
   * The instruction that produced it was unconditional; it is now the `else`
   * of a branch, and both halves are worth a test because losing either one
   * brings back a different bad answer.
   */
  it("sends them to a studio when they are not in one", () => {
    const [system] = buildAssistantMessages(ask("make me a bassline"), ctx);
    expect(system!.content).toMatch(/making and editing audio happens in a studio/);
  });

  it("never sends them to a studio they are already sitting in", () => {
    const messages = buildAssistantMessages(ask("make me a bassline"), {
      ...ctx,
      studio: openStudio,
    });
    const system = messages.map((m) => m.content).join("\n");
    expect(system).not.toMatch(/happens in a studio/);
    expect(system).toMatch(/already have a studio open/);
    expect(system).toMatch(/never tell them to go to one/);
  });

  it("asks the guide to take the brief rather than refuse it", () => {
    const messages = buildAssistantMessages(ask("make me a bassline"), {
      ...ctx,
      studio: openStudio,
    });
    const all = messages.map((m) => m.content).join("\n");
    // Generation was missing from the studio note, so it fell through to the
    // blanket "you make nothing" rule and came back as a refusal.
    expect(all).toMatch(/new audio \(music, sound effects, speech\)/);
    expect(all).toMatch(/say it is on its way rather than refusing/);
  });

  it("replays the thread in order", () => {
    const messages = buildAssistantMessages(
      [
        { role: "user", content: "what is a stem?" },
        { role: "assistant", content: "A separated part." },
        { role: "user", content: "how do I make one?" },
      ],
      ctx,
    );
    expect(messages.slice(-3).map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  });

  it("trims a long thread to the newest turns", () => {
    const turns: AssistantTurn[] = Array.from({ length: MAX_HISTORY_TURNS + 10 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `turn ${i}`,
    }));
    const messages = buildAssistantMessages(turns, ctx);
    expect(messages.filter((m) => m.role !== "system")).toHaveLength(MAX_HISTORY_TURNS);
  });
});

/* ----------------------------------------------------------------- parse */

describe("parseAssistantReply", () => {
  it("reads a reply and its links", () => {
    const r = parseAssistantReply(
      JSON.stringify({ reply: "Licences are on the Models page.", links: [{ to: "/models" }] }),
      ask("where are licences?"),
    );
    expect(r.reply).toBe("Licences are on the Models page.");
    expect(r.links).toEqual([{ to: "/models", label: "Models" }]);
  });

  it("reports which documentation the answer was drawn from", () => {
    const r = parseAssistantReply(
      JSON.stringify({ reply: "See the docs.", links: [] }),
      ask("how do I connect an MCP client?"),
    );
    expect(r.sources.some((s) => /MCP/.test(s))).toBe(true);
  });

  it("strips a thinking block and a code fence", () => {
    const r = parseAssistantReply(
      '<think>hmm</think>```json\n{"reply":"ok","links":[]}\n```',
      ask("hi"),
    );
    expect(r.reply).toBe("ok");
  });

  // An external endpoint that ignores response_format answers in prose.
  it("falls back to the raw text when the reply is not JSON", () => {
    const r = parseAssistantReply("The Models page lists every licence.", ask("licences?"));
    expect(r.reply).toBe("The Models page lists every licence.");
    expect(r.links).toEqual([]);
  });
});

/* --------------------------------------------------------------- openers */

describe("parseOpeners", () => {
  it("keeps up to four well-formed chips", () => {
    const openers = parseOpeners(
      JSON.stringify({
        openers: [
          { label: "Which model?", text: "Which of my models can I ship?" },
          { label: "Name tracks", text: "Name the unnamed tracks on this timeline" },
          { label: "Door slam", text: "I need a horror door slam for track 2" },
          { label: "Lo-fi bed", text: "Write a lo-fi loop that belongs under this mix" },
          { label: "Extra", text: "should be dropped" },
        ],
      }),
    );
    expect(openers).toHaveLength(4);
    expect(openers[0]).toEqual({
      label: "Which model?",
      text: "Which of my models can I ship?",
    });
    expect(openers[3]!.label).toBe("Lo-fi bed");
  });

  it("falls back when the payload is garbage or too thin", () => {
    expect(parseOpeners("not json")).toEqual(FALLBACK_OPENERS);
    expect(parseOpeners(JSON.stringify({ openers: [{ label: "only" }] }))).toEqual(
      FALLBACK_OPENERS,
    );
    expect(parseOpeners(JSON.stringify({ openers: [] }))).toEqual(FALLBACK_OPENERS);
  });
});

describe("buildOpenerMessages", () => {
  it("includes a ready model id in the system prompt", () => {
    const [system] = buildOpenerMessages(ctx);
    expect(system!.content).toMatch(/ace-step — ACE-Step/);
    expect(system!.content).toMatch(/stable-audio-open/);
  });

  it("names a real track when a studio is open", () => {
    const studio: AssistantStudio = {
      tracks: [{ track_index: 0, name: "Kick", muted: false, soloed: false }],
      clips: [],
      playhead_s: 0,
      selected_ids: [],
    };
    const messages = buildOpenerMessages({ ...ctx, studio });
    expect(messages.some((m) => m.content.includes("Kick"))).toBe(true);
    expect(messages.some((m) => m.content.includes("THIS ARRANGEMENT"))).toBe(true);
  });
});
