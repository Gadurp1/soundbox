/**
 * Why Generate cannot run right now, as one sentence.
 *
 * The composer used to answer this twice: a `disabled` attribute on the
 * button (which says nothing) and an amber notice that only covered model
 * status. Everything that stops a submit now goes through this one function,
 * ordered most-fundamental first, so the composer shows a single reason with
 * the link that resolves it and the hotkey path refuses for the same reason.
 *
 * Returns null when a submit would go through.
 */

import type { EditKind, Model } from "@/lib/api";
import { isNotReady, notReadyReason } from "@/lib/model-ready";

export interface ComposerBlocker {
  /** What stops the run and what to do about it. One sentence. */
  sentence: string;
  /** Where the fix lives, when it is a page rather than the prompt box. */
  link?: { to: string; label: string };
  /** The prompt box is the fix: the button focuses it instead of submitting. */
  focusPrompt?: boolean;
}

const EDIT_VERB: Record<EditKind, string> = {
  extend: "extend",
  cover: "cover",
  repaint: "repaint",
};

export function composerBlocker(input: {
  prompt: string;
  modelId: string;
  model: Model | undefined;
  modelsLoading: boolean;
  edit: EditKind | null;
  duration: number;
  sourceDurationS: number | null;
}): ComposerBlocker | null {
  const { prompt, modelId, model, modelsLoading, edit } = input;

  if (!modelId || !model) {
    if (modelsLoading) return { sentence: "Loading the model list." };
    return {
      sentence: "No model chosen yet.",
      link: { to: "/models", label: "Choose one in Models" },
    };
  }

  switch (model.status) {
    case "not_installed":
      return {
        sentence: `${model.name} isn't installed: its weights need downloading before it can run.`,
        link: { to: "/models", label: "Download it in Models" },
      };
    case "needs_runtime":
      return {
        sentence: model.extras.length
          ? `${model.name} is downloaded, but this server has no runtime for it (needs ${model.extras.join(", ")}).`
          : `${model.name} is downloaded, but this server has no runtime for it.`,
        link: { to: "/models", label: "See the install command in Models" },
      };
    case "downloading":
      return {
        sentence: `${model.name} is still downloading. Generate unlocks when it finishes.`,
        link: { to: "/models", label: "Watch progress in Models" },
      };
    case "incomplete":
      return {
        sentence: `${model.name}'s download did not finish, so its weights can't be used yet. What is already there is kept.`,
        link: { to: "/models", label: "Repair it in Models" },
      };
    case "error":
      return {
        sentence:
          model.error || `${model.name} is in an error state and can't generate right now.`,
        link: { to: "/models", label: "Open Models" },
      };
    default:
      // A status this switch does not name yet (a new one added to the
      // model) still blocks if the shared ready-check says so, with its
      // sentence, rather than leaving the button live to fail as a turn.
      if (isNotReady(model)) {
        return { sentence: notReadyReason(model), link: { to: "/models", label: "Open Models" } };
      }
      break;
  }

  if (edit) {
    if (!model.supports[edit]) {
      return {
        sentence: `${model.name} can't ${EDIT_VERB[edit]} a sound. Pick a model that can.`,
        link: { to: "/models", label: "Compare models" },
      };
    }
    if (edit === "extend") {
      const source = input.sourceDurationS ?? 0;
      if (input.duration <= source) {
        return {
          sentence: `Extending needs a duration longer than the source's ${source.toFixed(1)}s.`,
        };
      }
    }
  }

  if (!prompt.trim()) {
    return {
      sentence:
        model.task === "tts"
          ? "Type what the voice should say."
          : "Describe the sound to make.",
      focusPrompt: true,
    };
  }

  return null;
}
