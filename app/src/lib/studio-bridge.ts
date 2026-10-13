/**
 * How the chat reaches a studio that is open beside it.
 *
 * The studio owns its timeline: which lanes exist, what is selected, where
 * the playhead is, and — more to the point — the handlers that change any
 * of it, every one of which is optimistic, invalidates the right queries and
 * lands on the undo stack. The assistant must not grow a second set. So the
 * studio *lends* the two things the command bar already uses (a context
 * snapshot and an apply function) to this store while it is mounted, and the
 * chat borrows them for the turns that turn out to be edits.
 *
 * Null when no studio is open, which is how the chat knows "rename track 1"
 * is a question about nothing rather than an instruction.
 */

import { create } from "zustand";
import type { StudioAction, StudioContext } from "./studio-command";

export interface StudioBridge {
  storyId: string;
  /** Built fresh on each call, never cached — the selection and the playhead
   *  move constantly. */
  context: () => StudioContext;
  apply: (actions: StudioAction[], summary: string) => void;
  /** Bring one of the studio's panels forward — how the chat shows its work,
   *  and how a card in the thread gets back to what it changed. */
  showPanel: (id: string) => void;
}

interface StudioBridgeState {
  bridge: StudioBridge | null;
  lend: (bridge: StudioBridge) => void;
  /** Only the lender may take it back: a second studio mounting and
   *  unmounting must not clear the first one's loan. */
  reclaim: (storyId: string) => void;
}

export const useStudioBridge = create<StudioBridgeState>((set) => ({
  bridge: null,
  lend: (bridge) => set({ bridge }),
  reclaim: (storyId) =>
    set((s) => (s.bridge?.storyId === storyId ? { bridge: null } : {})),
}));
