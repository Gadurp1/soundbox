/**
 * Which stems come out of a separation, and what happens to the ones you
 * didn't ask for.
 *
 * Separation always produces the whole set — the model has no idea you only
 * wanted the vocal — so choosing is something that happens *after* it runs,
 * on the way to the library. Two answers are useful for the rest, and they
 * are genuinely different edits rather than a preference:
 *
 *  - **discard** — you wanted the drums out and nothing else kept. The other
 *    stems are never written, so the library doesn't fill with three files
 *    per split that nobody asked for.
 *  - **merge** — you wanted the vocal *off* the track. The rest is summed
 *    back into one sound, which is the original minus what you took out, and
 *    the two together still play as the take you started from.
 *
 * Pure and free of any audio or database work so the matching rules — which
 * are the fiddly part, because a stem is named by whatever the loader family
 * writes to disk — are testable on their own.
 */

/** What htdemucs and its siblings produce. Used only to offer a sensible
 *  default set in a picker before anything has actually run; the real names
 *  come from the separator's own output. */
export const COMMON_STEM_NAMES = ["vocals", "drums", "bass", "other"] as const;

/** The merged leftovers, as a stem name. Reads as a lane label without
 *  further work — "Take 3 (rest)" is what is left of the take. */
export const REST_STEM_NAME = "rest";

export interface StemSelection {
  /** Stem names to keep, matched loosely (see `stemKey`). Empty means keep
   *  everything, which is what a caller that never asked sends. */
  keep: string[];
  /** What becomes of the stems not named: thrown away, or summed into one
   *  `rest` stem. */
  rest: "discard" | "merge";
}

/** Loose match: case, spacing and punctuation vary between loader families
 *  ("Vocals", "vocals", "no_vocals"), and none of that is a different stem. */
export function stemKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export interface StemSplit<T> {
  /** In the order they were asked for, so lanes come out in the order the
   *  user listed them rather than in the separator's own. */
  kept: T[];
  rest: T[];
  /** Names in `keep` that no stem answered to — a picker offering "vocals" to
   *  a separator that calls it something else, or a plain typo. Reported
   *  rather than swallowed: it is the difference between "there was no vocal"
   *  and "we didn't look for one". */
  missing: string[];
}

/**
 * Split a separator's output into what was asked for and what was not.
 *
 * A selection with no names is not "keep nothing" — it is the absence of a
 * choice, which is every caller that predates this and means the whole set.
 */
export function selectStems<T extends { stemName: string }>(
  stems: T[],
  selection: StemSelection | null | undefined,
): StemSplit<T> {
  const keep = (selection?.keep ?? []).filter((n) => n.trim() !== "");
  if (keep.length === 0) return { kept: [...stems], rest: [], missing: [] };

  const kept: T[] = [];
  const missing: string[] = [];
  const taken = new Set<T>();
  for (const wanted of keep) {
    const key = stemKey(wanted);
    const found = stems.find((s) => stemKey(s.stemName) === key && !taken.has(s));
    if (found === undefined) {
      // Already matched by an earlier duplicate entry rather than absent —
      // "vocals, vocals" is a sloppy request, not a missing stem.
      if (!stems.some((s) => stemKey(s.stemName) === key)) missing.push(wanted);
      continue;
    }
    taken.add(found);
    kept.push(found);
  }
  return { kept, rest: stems.filter((s) => !taken.has(s)), missing };
}

/** Whether a set of stems that already exists can answer this selection, so a
 *  second split of the same sound can be skipped. Names are the sound's own
 *  ("Take 3 (vocals)" → matched on the suffix by the caller). */
export function selectionSatisfied(available: string[], selection: StemSelection | null | undefined): boolean {
  const keep = (selection?.keep ?? []).filter((n) => n.trim() !== "");
  if (keep.length === 0) return true;
  const have = new Set(available.map(stemKey));
  if (!keep.every((n) => have.has(stemKey(n)))) return false;
  // A merge asks for a stem that only exists if the same merge ran before.
  return selection?.rest !== "merge" || have.has(REST_STEM_NAME);
}
