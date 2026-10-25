/**
 * Turning pasted text into script lines, locally and deterministically.
 *
 * Two jobs. `splitIntoLines` cuts prose into lines by sentence, paragraph or
 * chapter, with a ceiling on characters per line so a text-to-speech model
 * never gets a paragraph it will rush. `autoCast` reads a screenplay or a
 * passage with dialogue and works out who says what: a speaker per line
 * where the text names one, and no speaker (the narrator) elsewhere.
 *
 * No model is involved. The rules are the ones a person would apply reading
 * the same page, and when the text has no cues at all the result is simply
 * the sentence split with nobody cast, which is still a script.
 */

import type { Voice } from "@/lib/api";

export type SplitMode = "sentence" | "paragraph" | "chapter";

export interface ParsedLine {
  /** The character's name as written, or null for narration. */
  speaker: string | null;
  text: string;
}

export interface AutoCastResult {
  lines: ParsedLine[];
  /** Distinct speakers, in order of first appearance. */
  characters: string[];
}

/** Characters per line past which a sentence-split line is cut again at a
 *  clause boundary. Long enough for a full sentence, short enough that no
 *  one line becomes a paragraph. */
export const DEFAULT_MAX_CHARS = 280;

const CHAPTER_HEADING = /^\s*(chapter|part|act|scene)\b[^\n]*$/im;

/** Prose into sentences. Abbreviations and decimals are left alone; a
 *  sentence ends at . ! ? or … followed by whitespace and a capital, a
 *  quote, or the end. */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  const re = /[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)/g;
  const normalised = text.replace(/\s+/g, " ").trim();
  if (!normalised) return out;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalised)) !== null) {
    const s = m[0].trim();
    if (!s) continue;
    // "Dr. Who" and "3.14": glue a piece that ended on an abbreviation or a
    // digit onto the next one. Likewise a quote that closed on ? or ! with
    // the attribution still to come ("Did you hear that?" asked Theo.): a
    // piece starting in lower case belongs to the sentence before it.
    const last = out[out.length - 1];
    if (
      last &&
      (/\b(?:[A-Z][a-z]?|Mr|Mrs|Ms|Dr|St|No|vs|etc)\.$/.test(last) ||
        /\d\.$/.test(last) ||
        (/["”’']$/.test(last) &&
          (/^[a-z]/.test(s) || /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\s(?:said|asked|replied|whispered|shouted|muttered|called|answered|cried|added|went on)\b/.test(s))))
    ) {
      out[out.length - 1] = `${last} ${s}`;
    } else {
      out.push(s);
    }
  }
  return out;
}

/** Cut a line longer than `maxChars` at the clause boundary (comma,
 *  semicolon, dash) nearest the middle, repeatedly, so a long sentence
 *  becomes two readable breaths rather than one truncated one. */
export function limitLength(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) return [line];
  const cut = /[,;:—–-]\s/g;
  let best = -1;
  let m: RegExpExecArray | null;
  const target = line.length / 2;
  while ((m = cut.exec(line)) !== null) {
    const at = m.index + 1;
    if (best === -1 || Math.abs(at - target) < Math.abs(best - target)) best = at;
  }
  if (best <= 0) {
    // No clause boundary: fall back to the space nearest the middle.
    const space = line.lastIndexOf(" ", Math.floor(target));
    if (space <= 0) return [line];
    best = space;
  }
  const head = line.slice(0, best).trim();
  const tail = line.slice(best).trim();
  if (!head || !tail) return [line];
  return [...limitLength(head, maxChars), ...limitLength(tail, maxChars)];
}

/** Prose into lines. Paragraphs are blank-line separated; chapters start at a
 *  "Chapter", "Part", "Act" or "Scene" heading (the heading becomes its own
 *  line, so it can be read or deleted). */
export function splitIntoLines(
  text: string,
  mode: SplitMode,
  maxChars = DEFAULT_MAX_CHARS,
): string[] {
  const cleaned = text.replace(/\r\n?/g, "\n").trim();
  if (!cleaned) return [];
  let units: string[];
  if (mode === "sentence") {
    units = splitSentences(cleaned);
  } else if (mode === "paragraph") {
    units = cleaned
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  } else {
    units = [];
    let current: string[] = [];
    for (const raw of cleaned.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (CHAPTER_HEADING.test(line)) {
        if (current.length) units.push(current.join(" "));
        current = [];
        units.push(line);
      } else {
        current.push(line);
      }
    }
    if (current.length) units.push(current.join(" "));
  }
  return units.flatMap((u) => limitLength(u, maxChars));
}

/* --------------------------------------------------------------- casting */

/** "MARA:" / "Mara:" / "MARA (whispering):" / "[Mara]" at the start of a
 *  line, with the text on the same line. */
const CUE_INLINE = /^\s*(?:\[([^\]]{1,40})\]|([A-Z][A-Za-z.' -]{0,39}?)(?:\s*\([^)]*\))?\s*:)\s*(.+)$/;
/** A screenplay cue on a line of its own: all caps, short, no sentence
 *  punctuation. The dialogue follows on the next lines. */
const CUE_ALONE = /^\s*([A-Z][A-Z0-9.' -]{1,30})(?:\s*\([^)]*\))?\s*$/;
/** Stage directions and parentheticals are not spoken. */
const DIRECTION = /^\s*[([].*[)\]]\s*$/;
/** "…," said Mara. / Mara said, "…" / "…" Mara asked. */
const ATTRIB_AFTER = /^[“"']([^”"']+)[”"'],?\s+(?:said|asked|replied|whispered|shouted|muttered|called|answered|cried|added|went on)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)[^“"']*$/;
const ATTRIB_BEFORE = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:said|asked|replied|whispered|shouted|muttered|called|answered|cried|added|went on),?\s*[“"']([^”"']+)[”"']/;
const ATTRIB_AFTER_INVERTED = /^[“"']([^”"']+)[”"'],?\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:said|asked|replied|whispered|shouted|muttered|called|answered|cried|added|went on)[^“"']*$/;

function titleCase(name: string): string {
  const trimmed = name.trim();
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((w) => (w.length ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join("");
}

/**
 * Who says what. Screenplay cues win where they are present (a name and a
 * colon, or a name alone on its line in capitals); otherwise dialogue in
 * quotes with a "said X" attribution is cast to X and everything else is
 * narration. Long lines are still cut at `maxChars`.
 */
export function autoCast(text: string, maxChars = DEFAULT_MAX_CHARS): AutoCastResult {
  const cleaned = text.replace(/\r\n?/g, "\n").trim();
  const lines: ParsedLine[] = [];
  const characters: string[] = [];
  const note = (speaker: string | null) => {
    if (speaker && !characters.includes(speaker)) characters.push(speaker);
  };
  const push = (speaker: string | null, body: string) => {
    const t = body.replace(/\s+/g, " ").trim();
    if (!t) return;
    note(speaker);
    for (const piece of limitLength(t, maxChars)) lines.push({ speaker, text: piece });
  };

  if (!cleaned) return { lines, characters };

  const rows = cleaned.split("\n");
  let pendingCue: string | null = null;
  let cueLines = 0;
  for (const raw of rows) {
    const row = raw.trim();
    if (!row) {
      pendingCue = null;
      continue;
    }
    if (DIRECTION.test(row)) continue;
    const inline = CUE_INLINE.exec(row);
    if (inline) {
      push(titleCase(inline[1] ?? inline[2] ?? ""), inline[3] ?? "");
      cueLines++;
      pendingCue = null;
      continue;
    }
    const alone = CUE_ALONE.exec(row);
    if (alone && row.length <= 32) {
      pendingCue = titleCase(alone[1] ?? "");
      cueLines++;
      continue;
    }
    if (pendingCue) {
      push(pendingCue, row);
      continue;
    }
    // Prose: split into sentences, cast the attributed quotes.
    for (const sentence of splitSentences(row)) {
      const after = ATTRIB_AFTER.exec(sentence) ?? ATTRIB_AFTER_INVERTED.exec(sentence);
      if (after) {
        push(after[2] ?? null, after[1] ?? "");
        continue;
      }
      const before = ATTRIB_BEFORE.exec(sentence);
      if (before) {
        push(before[1] ?? null, before[2] ?? "");
        continue;
      }
      push(null, sentence);
    }
  }

  // A text with cues on nearly every line is a screenplay; one with none is
  // prose. Either way the result stands. `cueLines` is kept for callers that
  // want to say which it was.
  void cueLines;
  return { lines, characters };
}

/**
 * A voice per character. A character whose name matches a voice (case
 * insensitive, on the whole name or its first word) gets that voice; the rest
 * are dealt distinct voices in order, wrapping only when there are more
 * characters than voices. Narration (null) gets no voice: the story's
 * default reads it.
 */
export function castVoices(
  characters: string[],
  voices: Pick<Voice, "id" | "name">[],
): Map<string, string | null> {
  const out = new Map<string, string | null>();
  if (voices.length === 0) {
    for (const c of characters) out.set(c, null);
    return out;
  }
  const taken = new Set<string>();
  const byName = (c: string) =>
    voices.find((v) => v.name.toLowerCase() === c.toLowerCase()) ??
    voices.find((v) => v.name.toLowerCase().split(/\s+/)[0] === c.toLowerCase().split(/\s+/)[0]);
  for (const c of characters) {
    const hit = byName(c);
    if (hit) {
      out.set(c, hit.id);
      taken.add(hit.id);
    }
  }
  let next = 0;
  for (const c of characters) {
    if (out.has(c)) continue;
    const free = voices.filter((v) => !taken.has(v.id));
    const pool = free.length ? free : voices;
    const v = pool[next % pool.length]!;
    next++;
    taken.add(v.id);
    out.set(c, v.id);
  }
  return out;
}

/** A short scene for an empty script: two speakers and a narrator, so the
 *  voice chips, the pause and the read-all flow all have something to do. */
export const SAMPLE_SCRIPT = `Mara: You said the door would be open.
Theo: I said it might be. There is a difference.
(pause)
Mara: Give me the key, then.
Narrator: Somewhere behind them, a lock turned on its own.`;
