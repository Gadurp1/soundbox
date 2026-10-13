import { describe, expect, it } from "vitest";

import {
  REST_STEM_NAME,
  selectStems,
  selectionSatisfied,
  stemKey,
} from "../src/stems.js";

/**
 * Choosing stems out of a split (`src/stems.ts`).
 *
 * The matching is the part worth pinning down: a stem is named by whatever
 * the loader family writes to disk, a user picks from a checkbox list, and
 * the two only ever meet through these rules.
 */

const FULL = [
  { stemName: "vocals" },
  { stemName: "drums" },
  { stemName: "bass" },
  { stemName: "other" },
];

describe("stemKey", () => {
  it("ignores case, spacing and punctuation", () => {
    expect(stemKey("Vocals")).toBe(stemKey("vocals"));
    expect(stemKey("no_vocals")).toBe(stemKey("No Vocals"));
  });
});

describe("selectStems", () => {
  it("keeps everything when nothing was chosen", () => {
    for (const selection of [null, undefined, { keep: [], rest: "discard" as const }]) {
      const { kept, rest } = selectStems(FULL, selection);
      expect(kept).toHaveLength(4);
      expect(rest).toHaveLength(0);
    }
  });

  it("keeps the named stems, in the order they were asked for", () => {
    const { kept, rest } = selectStems(FULL, { keep: ["drums", "Vocals"], rest: "discard" });
    expect(kept.map((s) => s.stemName)).toEqual(["drums", "vocals"]);
    expect(rest.map((s) => s.stemName)).toEqual(["bass", "other"]);
  });

  it("reports names no stem answered to", () => {
    const { kept, missing } = selectStems(FULL, { keep: ["vocals", "kazoo"], rest: "discard" });
    expect(kept.map((s) => s.stemName)).toEqual(["vocals"]);
    expect(missing).toEqual(["kazoo"]);
  });

  it("does not call a repeated name missing", () => {
    const { kept, missing } = selectStems(FULL, { keep: ["vocals", "vocals"], rest: "discard" });
    expect(kept).toHaveLength(1);
    expect(missing).toEqual([]);
  });
});

describe("selectionSatisfied", () => {
  const available = ["vocals", "drums", "bass", "other"];

  it("is satisfied by anything when nothing was chosen", () => {
    expect(selectionSatisfied([], null)).toBe(true);
  });

  it("needs every named stem to be there already", () => {
    expect(selectionSatisfied(available, { keep: ["vocals"], rest: "discard" })).toBe(true);
    expect(selectionSatisfied(["drums"], { keep: ["vocals"], rest: "discard" })).toBe(false);
  });

  it("needs a previous merge before it can reuse one", () => {
    expect(selectionSatisfied(available, { keep: ["vocals"], rest: "merge" })).toBe(false);
    expect(
      selectionSatisfied([...available, REST_STEM_NAME], { keep: ["vocals"], rest: "merge" }),
    ).toBe(true);
  });
});
