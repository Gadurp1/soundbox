/**
 * Where the studio's playhead is, sixty times a second while it plays.
 *
 * A store rather than studio state because of how often it changes. Held in
 * the studio, every frame of playback re-rendered the whole page — script,
 * library, chat and all — to move a clock in one header. Here only the few
 * things that draw the position subscribe to it, and everything that merely
 * needs to *know* it at a moment (where to drop a take, what to tell the
 * assistant) reads it with `getState()` without subscribing at all.
 */

import { create } from "zustand";

interface TransportState {
  /** Seconds from the top of the story. */
  at: number;
  /** The story's length in seconds. */
  total: number;
  setProgress: (at: number, total: number) => void;
}

export const useTransportStore = create<TransportState>((set) => ({
  at: 0,
  total: 0,
  setProgress: (at, total) =>
    set((s) => (s.at === at && s.total === total ? s : { at, total })),
}));
