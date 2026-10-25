/**
 * A sound's recipe: the settings that made it, as one line for a list row
 * and as a list of facts for the detail page, from one source so the two
 * never disagree about what counts.
 *
 * Only what was actually set is included. A sound made without a seed has
 * no "seed" in its recipe, rather than "seed —".
 */

import { formatDuration } from "@/lib/format";
import type { Sound } from "@/lib/api";

export interface RecipeFact {
  label: string;
  value: string;
}

const EDIT_LABEL: Record<string, string> = {
  extend: "extended",
  cover: "covered",
  repaint: "repainted",
};

/** The facts, in the order they are read: what made it, how long, then the
 *  sampler settings, then where it came from. */
export function recipeFacts(sound: Sound, modelName?: string | null): RecipeFact[] {
  const facts: RecipeFact[] = [];
  facts.push({ label: "Model", value: modelName ?? sound.model });
  if (sound.duration_s) facts.push({ label: "Length", value: formatDuration(sound.duration_s) });
  if (sound.seed !== null && sound.seed !== undefined) {
    facts.push({ label: "Seed", value: String(sound.seed) });
  }
  if (sound.steps !== null && sound.steps !== undefined) {
    facts.push({ label: "Steps", value: String(sound.steps) });
  }
  if (sound.cfg !== null && sound.cfg !== undefined) {
    facts.push({ label: "CFG", value: String(sound.cfg) });
  }
  if (sound.lyrics?.trim()) facts.push({ label: "Lyrics", value: "sung" });
  if (sound.edit && sound.parent_id) {
    facts.push({ label: "Edit", value: EDIT_LABEL[sound.edit] ?? sound.edit });
  }
  if (sound.source === "mcp") facts.push({ label: "By", value: sound.client ?? "an agent" });
  return facts;
}

/** "Stable Audio Open Small · 5.0s · seed 1000 · 8 steps · CFG 3". */
export function recipeLine(sound: Sound, modelName?: string | null): string {
  return recipeFacts(sound, modelName)
    .map((f) => {
      switch (f.label) {
        case "Model":
        case "Length":
          return f.value;
        case "Seed":
          return `seed ${f.value}`;
        case "Steps":
          return `${f.value} steps`;
        case "CFG":
          return `CFG ${f.value}`;
        case "Lyrics":
          return "with lyrics";
        case "Edit":
          return f.value;
        case "By":
          return `by ${f.value}`;
        default:
          return `${f.label} ${f.value}`;
      }
    })
    .join(" · ");
}

/** The block "Copy recipe" puts on the clipboard: the prompt and every
 *  fact, one per line, so it pastes into a note, an issue or a chat and
 *  reads as what to type to get this again. */
export function recipeText(sound: Sound, modelName?: string | null): string {
  const lines = [`Prompt: ${sound.prompt}`];
  if (sound.negative_prompt?.trim()) lines.push(`Negative prompt: ${sound.negative_prompt}`);
  for (const f of recipeFacts(sound, modelName)) lines.push(`${f.label}: ${f.value}`);
  if (sound.lyrics?.trim()) lines.push("", "Lyrics:", sound.lyrics.trim());
  return lines.join("\n");
}
