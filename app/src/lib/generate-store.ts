/**
 * Cross-screen handoff for "reuse prompt": the Library drops a prefill here and
 * navigates to Generate, which applies it once and clears it.
 */

import { create } from "zustand";
import type { Sound } from "./api";

export interface GeneratePrefill {
  model: string;
  prompt: string;
  negative_prompt: string;
  lyrics: string;
  track_name: string;
  duration_s: number;
  seed: number | null;
  steps: number | null;
  cfg: number | null;
  tags: string[];
}

interface PrefillState {
  prefill: GeneratePrefill | null;
  setPrefill: (p: GeneratePrefill | null) => void;
}

export const usePrefillStore = create<PrefillState>((set) => ({
  prefill: null,
  setPrefill: (prefill) => set({ prefill }),
}));

export function prefillFromSound(sound: Sound): GeneratePrefill {
  return {
    model: sound.model,
    prompt: sound.prompt,
    negative_prompt: sound.negative_prompt ?? "",
    lyrics: sound.lyrics ?? "",
    track_name: sound.track_name ?? "",
    duration_s: sound.duration_s,
    seed: sound.seed ?? null,
    steps: sound.steps ?? null,
    cfg: sound.cfg ?? null,
    tags: sound.tags,
  };
}
