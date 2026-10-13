/**
 * Turning a voice or a sound into an image prompt.
 *
 * Deliberately deterministic string-building rather than a round trip through
 * the prompt assistant: artwork has to work with `llm_mode: "off"`, which is
 * the default, and a cover that renders the same way twice for the same track
 * is a feature — the alternative is a "regenerate" button that changes the
 * subject rather than the take.
 *
 * The house style is fixed rather than exposed as a setting. A library where
 * every cover shares a visual language reads as a library; one where each
 * cover argues with its neighbours reads as a folder of images.
 */

import type { Sound, Voice } from "../schemas.js";

/**
 * What every render should avoid.
 *
 * Text first and at length because it is the failure that ruins a cover:
 * diffusion models reliably try to write an album title and reliably produce
 * garbled glyphs. The rest are the usual small-model artefacts.
 */
export const NEGATIVE_PROMPT =
  "text, words, letters, title, typography, watermark, signature, logo, caption, " +
  "subtitles, ui, frame, border, jpeg artifacts, blurry, lowres, deformed, extra limbs";

/** Trims a free-text field to something a CLIP text encoder will actually
 *  read. Both encoders in these checkpoints truncate hard at 77 tokens, so
 *  sending a whole lyric sheet just means the end of it is silently ignored. */
function clamp(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * A portrait prompt for a saved voice.
 *
 * The voice's `notes` field is the actual description — accent, age,
 * character, where the clip came from — so it leads, with the name as a weak
 * fallback for a voice nobody annotated. Rendered as an illustrated portrait
 * rather than a photographic one on purpose: a photoreal face implies a real
 * person who consented to be the face of a cloned voice, and none exists.
 */
export function voiceAvatarPrompt(voice: Pick<Voice, "name" | "notes">): string {
  const description = clamp(voice.notes?.trim() || voice.name, 180);
  return (
    `stylised character portrait of ${description}, ` +
    `head and shoulders, centred, expressive, painterly digital illustration, ` +
    `soft rim lighting, muted colour palette, plain background`
  );
}

/**
 * An EP-cover prompt for a music sound.
 *
 * Built from what the track actually is, in descending order of usefulness:
 * the generation prompt (genre, instrumentation, mood — already a rich visual
 * description), then the track name, then tags. Lyrics are deliberately *not*
 * included: they are the words being sung, and feeding words to a model that
 * is already inclined to draw text is asking for the failure `NEGATIVE_PROMPT`
 * exists to suppress.
 */
export function coverArtPrompt(
  sound: Pick<Sound, "prompt" | "track_name" | "name" | "tags">,
): string {
  const parts: string[] = [];
  const subject = clamp(sound.prompt?.trim() || sound.track_name || sound.name, 200);
  if (subject) parts.push(subject);
  const tags = (sound.tags ?? []).slice(0, 4).join(", ");
  if (tags) parts.push(tags);
  return (
    `album cover artwork for ${parts.join(", ")}, ` +
    `bold graphic composition, square format, striking colour palette, ` +
    `screen-printed poster art, no text`
  );
}

/** A prompt for one separated stem, used only when a stem name falls outside
 *  the built-in icon set — see `app/src/lib/instrument-icons.tsx`, which
 *  covers the names htdemucs actually emits without rendering anything. */
export function instrumentPrompt(stemName: string): string {
  return (
    `minimal flat vector icon of a ${clamp(stemName, 40)}, ` +
    `single centred subject, solid background, high contrast, no text`
  );
}
