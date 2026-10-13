/**
 * Quizzy wait-words, the way a chat model names what it is doing.
 *
 * Real phase names ("Generating", "Loading model") are accurate and dull.
 * These are invented gerunds — music-adjacent, slightly wrong — so a long
 * render has something to read besides a spinner. They do not describe the
 * work. They just keep the wait company.
 */

import { useEffect, useState } from "react";

export const LOADING_VERBS = [
  "Jazzermathinging",
  "Amphiberating",
  "Syncopandering",
  "Timbrellating",
  "Glissandering",
  "Fermandering",
  "Arpeggiandering",
  "Mixolydiating",
  "Ostinatizing",
  "Harmolodizing",
  "Crescendizing",
  "Staccatizing",
  "Polyrhythming",
  "Vinylating",
  "Rubatoing",
  "Tritonating",
  "Offbeating",
  "Breakbeating",
  "Granulandering",
  "Stemsplitting",
  "Autotunandering",
  "Overdubbling",
  "Ditherandering",
  "Enharmonizing",
  "Leitmotiving",
  "Boombapperating",
  "Sidechaindling",
  "Wavetabling",
  "Spectrogramming",
  "Cuewaving",
  "Highhatting",
  "Ghostnoting",
  "Walkingbassing",
  "Pentatonicating",
  "Filterweeping",
  "Convolutioning",
] as const;

const TICK_MS = 2400;

function pickStart(): number {
  return Math.floor(Math.random() * LOADING_VERBS.length);
}

/** A verb that changes while `active` is true. Frozen when it is not. */
export function useLoadingVerb(active = true): string {
  const [index, setIndex] = useState(pickStart);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % LOADING_VERBS.length);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [active]);
  return LOADING_VERBS[index]!;
}

/** Phases that are a wait, not a queue. Queued stays "Queued". */
export function isBusyPhase(phase: string | null | undefined): boolean {
  return phase === "loading" || phase === "generating" || phase === "encoding";
}
