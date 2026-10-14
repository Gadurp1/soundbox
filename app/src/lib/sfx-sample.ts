/**
 * Shared plumbing between the category sample grid and the per-sample page:
 * the manifest fetch and the static-catalogue-entry → `Sound` adapter.
 *
 * Pulled out of `sample-grid.tsx` once a second consumer (the sample detail
 * page) needed the exact same `toSound` shape — see that file's header for
 * why a real `Sound` is worth adapting into rather than a second player.
 */

import { useEffect, useState } from "react";

import type { Sound } from "@/lib/api";
import { assetUrl } from "@/lib/asset-url";
import type { SfxSample } from "@/content/sfx/types";

export interface SampleMeta {
  durationS: number;
  sampleRate: number;
  sizeBytes: number;
  peaks: number[];
}

export type SampleManifest = Record<string, SampleMeta>;

/** The served URL of a catalogue sample's MP3, base path included. */
export function sampleAudioUrl(categorySlug: string, sampleSlug: string): string {
  return assetUrl(`/sfx/${categorySlug}/${sampleSlug}.mp3`);
}

/**
 * Present a catalogue sample as the library `Sound` the player expects.
 *
 * Every field the player does not read is filled with the honest inert value
 * rather than something invented: these are files on disk in `site/public/`, not
 * rows in anybody's database, so there is no id beyond the slug.
 */
export function sampleToSound(
  categorySlug: string,
  sample: SfxSample,
  meta: SampleMeta,
): Sound {
  return {
    id: `sfx-${categorySlug}-${sample.slug}`,
    created_at: "",
    model: sample.model ?? "",
    prompt: sample.prompt,
    source: "app",
    duration_s: meta.durationS,
    sample_rate: meta.sampleRate,
    channels: 1,
    file: sampleAudioUrl(categorySlug, sample.slug),
    peaks: meta.peaks,
    favorite: false,
    tags: [],
    name: sample.title,
    size_bytes: meta.sizeBytes,
  };
}

/** Fetches `site/public/sfx/<categorySlug>/manifest.json`, the peaks/duration data
 *  too large to bundle into the JS — see `sample-grid.tsx`. */
export function useSampleManifest(categorySlug: string): {
  manifest: SampleManifest | null;
  failed: boolean;
} {
  const [manifest, setManifest] = useState<SampleManifest | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setManifest(null);
    setFailed(false);
    fetch(assetUrl(`/sfx/${categorySlug}/manifest.json`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: SampleManifest) => live && setManifest(m))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [categorySlug]);

  return { manifest, failed };
}
