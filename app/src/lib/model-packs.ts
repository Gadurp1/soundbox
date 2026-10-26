/**
 * Intent packs: one click that installs a sensible model for each of sound
 * effects, music and voice, at a chosen point on the speed/quality line.
 *
 * Built on the same ranker first-run setup uses (`recommendModels`), so a
 * pack never recommends a model the wizard would not. Balanced *is* the
 * wizard's pick; Fast takes the lightest model that qualifies, Quality the
 * heaviest that fits the GPU, Max the heaviest there is. Only models whose
 * licence allows commercial use qualify, because a pack installs without
 * the per-model licence stop the list below has; the rest stay a click away.
 */

import type { AudioCppCatalogEntry, HealthStatus, Model } from "@/lib/api";
import { INTENTS, recommendModels, vramBudgetMb, type Intent } from "@/lib/onboarding";

export type PackTier = "fast" | "balanced" | "quality" | "max";

export interface PackPick {
  intent: Intent;
  model: Model;
}

export interface ModelPack {
  tier: PackTier;
  name: string;
  blurb: string;
  picks: PackPick[];
  /** Picks whose weights are not on this machine yet. */
  toInstall: Model[];
  /** A rough size for `toInstall`, from the VRAM estimates: a GGUF is close
   *  to the memory it takes. Rounded to whole gigabytes; "about". */
  downloadGb: number;
  /** True when a pick would not fit the GPU's budget (or there is none). */
  overBudget: boolean;
}

export const INTENT_LABEL: Record<Intent, string> = {
  sfx: "Sound effects",
  music: "Music",
  voice: "Voice",
};

const TIERS: { tier: PackTier; name: string; blurb: string }[] = [
  { tier: "fast", name: "Fast", blurb: "The lightest model for each: quick renders, runs on small GPUs and on the CPU." },
  { tier: "balanced", name: "Balanced", blurb: "What first-run setup would pick for this machine." },
  { tier: "quality", name: "Quality", blurb: "The heaviest model for each that still fits your GPU." },
  { tier: "max", name: "Max", blurb: "The heaviest model for each, whether or not it fits. For a bigger card, or patience." },
];

const ON_DISK = new Set<Model["status"]>(["installed", "loaded", "needs_runtime"]);

export function buildPacks(
  models: Model[] | undefined,
  health: HealthStatus | undefined,
  catalog: AudioCppCatalogEntry[] | undefined,
  hfTokenSet: boolean,
): ModelPack[] {
  if (!models?.length) return [];
  const recs = recommendModels(models, health, [...INTENTS], "commercial", { catalog, hfTokenSet });
  const budget = vramBudgetMb(health);

  return TIERS.map(({ tier, name, blurb }) => {
    const picks: PackPick[] = [];
    for (const rec of recs) {
      const pool = [rec.model, ...rec.alternatives];
      const byVram = [...pool].sort((a, b) => a.vram_estimate_mb - b.vram_estimate_mb);
      let model: Model | undefined;
      switch (tier) {
        case "fast":
          model = byVram[0];
          break;
        case "balanced":
          model = rec.model;
          break;
        case "quality":
          model = budget === null
            ? rec.model
            : ([...byVram].reverse().find((m) => m.vram_estimate_mb <= budget) ?? rec.model);
          break;
        case "max":
          model = byVram[byVram.length - 1];
          break;
      }
      if (model) picks.push({ intent: rec.intent, model });
    }
    const toInstall = picks.map((p) => p.model).filter((m) => !ON_DISK.has(m.status));
    const mb = toInstall.reduce((sum, m) => sum + (m.vram_estimate_mb || 0), 0);
    const overBudget = picks.some(
      (p) => budget !== null && p.model.vram_estimate_mb > budget,
    );
    return {
      tier,
      name,
      blurb,
      picks,
      toInstall,
      downloadGb: Math.max(1, Math.round(mb / 1000)),
      overBudget,
    };
  }).filter((p) => p.picks.length > 0);
}
