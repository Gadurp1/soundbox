/**
 * The clip placements the shelf draws each story's thumbnail from.
 *
 * Worth its own test because the preview has to agree with the studio it
 * previews: a line that has not been spoken yet is drawn at an estimated
 * width in both places, and a thumbnail that disagreed would be a picture of
 * a timeline that does not exist.
 */

import { describe, expect, it } from "vitest";

import { Database } from "../src/db.js";

function storyWith(lines: { text?: string; track?: number; start?: number; dur?: number }[]) {
  const db = new Database(":memory:");
  const now = new Date().toISOString();
  db.createStory("story-1", "A story", now);
  lines.forEach((line, i) =>
    db.createSegment(`seg-${i}`, "story-1", now, {
      text: line.text ?? "",
      track_index: line.track ?? 0,
      start_s: line.start ?? 0,
      durationS: line.dur ?? null,
      sound_id: null,
    }),
  );
  return db;
}

describe("a story's timeline preview", () => {
  it("carries a lane, a start and a length per clip", () => {
    const db = storyWith([{ text: "one", track: 2, start: 1.5, dur: 3 }]);
    const [story] = db.listStories(50, true);
    expect(story!.timeline).toEqual([{ t: 2, s: 1.5, d: 3 }]);
  });

  it("is left out unless asked for", () => {
    const db = storyWith([{ text: "one", dur: 1 }]);
    expect(db.listStories(50)[0]!.timeline).toBeUndefined();
  });

  it("gives an unspoken line the width the studio would draw it at", () => {
    // Four words at 0.4s each — the same estimate `story-timeline.tsx` uses,
    // and the reason the two are tested together.
    const db = storyWith([{ text: "one two three four" }]);
    expect(db.listStories(50, true)[0]!.timeline![0]!.d).toBe(1.6);
  });

  it("floors that estimate, so a one-word line is still a clip", () => {
    const db = storyWith([{ text: "hi" }]);
    expect(db.listStories(50, true)[0]!.timeline![0]!.d).toBe(0.8);
  });

  it("leaves written silence out — a pause has nothing to draw", () => {
    const db = storyWith([{ text: "spoken", dur: 1 }]);
    const now = new Date().toISOString();
    db.createSegment("seg-pause", "story-1", now, { kind: "pause", start_s: 2, durationS: 1 });
    expect(db.listStories(50, true)[0]!.timeline).toHaveLength(1);
  });

  it("caps a long story at its opening, in timeline order", () => {
    const db = storyWith(
      Array.from({ length: 80 }, (_, i) => ({ text: "line", start: 80 - i, dur: 0.5 })),
    );
    const timeline = db.listStories(50, true)[0]!.timeline!;
    expect(timeline).toHaveLength(64);
    expect(timeline[0]!.s).toBe(1);
    expect(timeline.at(-1)!.s).toBe(64);
  });

  it("previews every story in the list from one query", () => {
    const db = storyWith([{ text: "one", dur: 1 }]);
    const now = new Date().toISOString();
    db.createStory("story-2", "Another", now);
    db.createSegment("seg-b", "story-2", now, { text: "two", start_s: 0, durationS: 2 });
    const timelines = new Map(db.listStories(50, true).map((s) => [s.id, s.timeline]));
    expect(timelines.get("story-1")).toEqual([{ t: 0, s: 0, d: 1 }]);
    expect(timelines.get("story-2")).toEqual([{ t: 0, s: 0, d: 2 }]);
  });

  it("has an empty timeline for a story with no lines, not a missing one", () => {
    const db = new Database(":memory:");
    db.createStory("empty", "Nothing yet", new Date().toISOString());
    expect(db.listStories(50, true)[0]!.timeline).toEqual([]);
  });
});
