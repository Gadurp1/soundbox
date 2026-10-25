/**
 * Whether a model can generate right now, in one place.
 *
 * Two callers need the same answer and used to disagree: the composer's
 * Generate button (disabled when the model isn't ready) and `submitWith` in
 * `use-generate-session`, which the Ctrl/Cmd+Enter hotkey, the assistant's
 * "Generate" and the studio's `generate_clip` all go through. The hotkey had
 * no check at all, so a model that wasn't ready queued a job that came
 * straight back as a `ModelError` — the disabled button was easy to route
 * around by pressing the shortcut it advertises.
 */

import type { Model } from "@/lib/api";

/** Statuses that mean "not ready to generate" — the request would only reach
 *  the backend to bounce back as a `ModelError` toast. `downloading` and
 *  `error` are included; genuinely transient/unknown states are not (there
 *  are none today — every status is accounted for). */
export const NOT_READY: ReadonlySet<Model["status"]> = new Set([
  "not_installed",
  "needs_runtime",
  "incomplete",
  "downloading",
  "error",
]);

export function isNotReady(model: Model | undefined | null): boolean {
  return Boolean(model && NOT_READY.has(model.status));
}

/**
 * Why this model can't generate, as a sentence for a failed turn.
 *
 * The composer renders its own richer version of this with links to Models and
 * Settings; this is for the paths that have nowhere to put a Notice and would
 * otherwise fail silently or, worse, spend a job to be told the same thing.
 */
export function notReadyReason(model: Model): string {
  switch (model.status) {
    case "not_installed":
      return `${model.name} isn't installed yet. Download it from Models before generating.`;
    case "needs_runtime":
      return model.extras.length
        ? `${model.name} needs ${model.extras.join(", ")} installed. See Models for the install command.`
        : `${model.name} is missing its runtime. See Models for the install command.`;
    case "downloading":
      return `${model.name} is still downloading its weights. Generate will be available once that finishes.`;
    case "incomplete":
      return `${model.name}'s download did not finish, so its weights can't be used. Repair it from Models; what is already there is kept.`;
    case "error":
      return model.error || `${model.name} is in an error state and can't generate right now.`;
    default:
      return `${model.name} isn't ready to generate.`;
  }
}
