/**
 * Plumbing for the `/music` page: the manifest fetch and the content-entry →
 * `Sound` adapter, mirroring `lib/sfx-sample.ts`.
 *
 * Same two decisions as that file, for the same reasons. The peaks are fetched
 * rather than bundled (thirty-six tracks × 256 floats is ~60 KB of JSON that only
 * the player needs), and a catalogue track is adapted into a real `Sound`
 * rather than given its own simpler player — one playback behaviour, one
 * global player store that every surface respects.
 */

import { useEffect, useState } from "react";

import type { Sound } from "@/lib/api";
import { assetUrl } from "@/lib/asset-url";
import type { MusicTrack } from "@/content/music/types";

export interface MusicTrackMeta {
  durationS: number;
  sampleRate: number;
  sizeBytes: number;
  peaks: number[];
}

export type MusicManifest = Record<string, MusicTrackMeta>;

/** The served URL of a catalogue track's MP3, base path included. */
export function trackAudioUrl(slug: string): string {
  return assetUrl(`/music/${slug}.mp3`);
}

/** The served URL of a roster act's signature-track MP3, base path included. */
export function artistAudioUrl(slug: string): string {
  return assetUrl(`/music/artists/${slug}.mp3`);
}

/** Present a catalogue track as the `Sound` the player expects. Fields the
 *  player does not read get the honest inert value — these are files in
 *  `site/public/`, not rows in a database, so there is no id beyond the slug. */
export function trackToSound(track: MusicTrack, meta: MusicTrackMeta): Sound {
  return {
    id: `music-${track.slug}`,
    created_at: "",
    model: track.model,
    prompt: track.prompt,
    source: "app",
    duration_s: meta.durationS,
    sample_rate: meta.sampleRate,
    channels: 2,
    file: trackAudioUrl(track.slug),
    peaks: meta.peaks,
    favorite: false,
    tags: [],
    name: track.title,
    size_bytes: meta.sizeBytes,
  };
}

/** Fetches `site/public/music/manifest.json`, written by
 *  `scripts/gen-music-tracks.mjs` alongside the MP3s. */
export function useMusicManifest(): { manifest: MusicManifest | null; failed: boolean } {
  const [manifest, setManifest] = useState<MusicManifest | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(assetUrl("/music/manifest.json"))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: MusicManifest) => live && setManifest(m))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  return { manifest, failed };
}

/* -------------------------------------------------------------- artists */

/** Present a roster act's signature track as the `Sound` the player expects —
 *  same honesty rule as `trackToSound`: inert values for fields that have no
 *  real source, an id derived from the slug because these are files in
 *  `site/public/`, not rows in a database. */
export function artistToSound(
  artist: { slug: string; name: string; signaturePrompt: string },
  meta: MusicTrackMeta,
): Sound {
  return {
    id: `artist-${artist.slug}`,
    created_at: "",
    model: "",
    prompt: artist.signaturePrompt,
    source: "app",
    duration_s: meta.durationS,
    sample_rate: meta.sampleRate,
    channels: 2,
    file: artistAudioUrl(artist.slug),
    peaks: meta.peaks,
    favorite: false,
    tags: [],
    name: artist.name,
    size_bytes: meta.sizeBytes,
  };
}

/** Fetches `site/public/music/artists/manifest.json`, written by
 *  `scripts/gen-artist-tracks.mjs` beside the MP3s and covers. */
export function useArtistManifest(): { manifest: MusicManifest | null; failed: boolean } {
  const [manifest, setManifest] = useState<MusicManifest | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(assetUrl("/music/artists/manifest.json"))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: MusicManifest) => live && setManifest(m))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  return { manifest, failed };
}

/* --------------------------------------------------------------- script */

export interface ScriptLine {
  text: string;
  /** `[verse]` / `[chorus]` markers: shown, but not given a slice of time. */
  isTag: boolean;
  /** Index among sung lines, or -1 for tags. Drives the highlight. */
  sungIndex: number;
}

/**
 * A lyrics block, split into lines a playhead can be matched against.
 *
 * **These positions are evenly divided, not measured.** Neither music model
 * returns per-line timings and there is no forced aligner in this build, so
 * the only honest thing to do is divide the rendered duration by the number
 * of sung lines — and say so wherever it is shown, which the track page does.
 * It tracks a short repeated chorus well enough to read along with and would
 * be wrong about a dense verse; presenting it as real transcript alignment
 * would be a lie about the one thing these pages exist to be straight about.
 */
export function parseScript(lyrics: string): ScriptLine[] {
  let sung = 0;
  return lyrics
    .split("\n")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((text) => {
      const isTag = /^\[.*\]$/.test(text);
      return { text, isTag, sungIndex: isTag ? -1 : sung++ };
    });
}

export function sungCount(lines: ScriptLine[]): number {
  return lines.filter((l) => !l.isTag).length;
}

/** Which sung line a playhead position falls in. -1 before playback starts. */
export function lineAt(seconds: number, total: number, lines: number): number {
  if (!total || !lines || seconds <= 0) return -1;
  return Math.min(lines - 1, Math.floor((seconds / total) * lines));
}
