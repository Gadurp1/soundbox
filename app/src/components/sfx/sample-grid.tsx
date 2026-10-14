/**
 * The listen-and-download block on a `/sfx/<category>` page.
 *
 * Two things worth knowing:
 *
 * 1. It reuses `WaveformPlayer` unchanged. That component wants a `Sound` — the
 *    library's record type — so this adapts a static catalogue entry into one.
 *    The alternative was a second, simpler player, and a second player is how a
 *    codebase ends up with two playback behaviours and one global player store
 *    that only half of them respect.
 *
 * 2. The peaks are fetched, not imported. 256 floats per sample is ~10 KB per
 *    category; bundling every category's peaks into the JS would make the
 *    marketing build heavier than the app. They live next to the MP3s in
 *    `site/public/sfx/<slug>/manifest.json`, produced by the render script
 *    scripts/gen-sfx-samples.ts.
 *
 * Placeholder samples are labelled as placeholders, on the page, in the markup.
 * A category is not publishable while any of them remain — see `SampleSource`.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DownloadIcon, FlaskConicalIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/docs-primitives";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WaveformPlayer } from "@/components/waveform-player";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sampleAudioUrl, sampleToSound, useSampleManifest } from "@/lib/sfx-sample";
import type { SfxSample } from "@/content/sfx/types";

export function SampleGrid({
  categorySlug,
  samples,
}: {
  categorySlug: string;
  samples: SfxSample[];
}) {
  const { manifest, failed } = useSampleManifest(categorySlug);
  const [query, setQuery] = useState("");

  // The grids used to be six rows and needed no help. Several of them are now
  // twenty, which is past the point where scanning beats searching — but only
  // just, so the filter appears when it earns its place and stays out of the
  // way otherwise.
  const needle = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      needle
        ? samples.filter((s) =>
            `${s.title} ${s.prompt}`.toLowerCase().includes(needle),
          )
        : samples,
    [samples, needle],
  );

  if (failed) {
    return (
      <p className="text-muted-foreground text-sm">
        The sample previews for this collection could not be loaded.
      </p>
    );
  }

  return (
    <>
      {samples.length > 8 && (
        <div className="relative mb-4">
          <SearchIcon
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${samples.length} samples`}
            aria-label="Filter samples"
            className="pl-9"
          />
        </div>
      )}

      {shown.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No sample in this collection matches that. Every prompt on the page is a
          starting point — change a word and generate the one you actually need.
        </p>
      )}

    <ul className="divide-border/60 divide-y">
      {shown.map((sample) => {
        const meta = manifest?.[sample.slug];
        return (
          <li key={sample.slug} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="text-sm font-semibold tracking-tight">
                <Link
                  to={`/sfx/${categorySlug}/${sample.slug}`}
                  className="hover:text-primary underline-offset-4 hover:underline"
                >
                  {sample.title}
                </Link>
              </h3>
              {sample.source === "placeholder" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1 text-[11px] font-normal">
                      <FlaskConicalIcon className="size-3" aria-hidden="true" />
                      Placeholder
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {sample.placeholderNote ?? "Not an model render."}
                  </TooltipContent>
                </Tooltip>
              )}
              {sample.model && (
                <span className="text-muted-foreground text-xs">via {sample.model}</span>
              )}
            </div>

            <div className="mt-1 flex items-start justify-between gap-2">
              <p className="text-muted-foreground min-w-0 font-mono text-xs leading-relaxed">
                {sample.prompt}
              </p>
              <CopyButton
                value={sample.prompt}
                label="Copy prompt"
                className="-mt-1 -mr-1 shrink-0"
              />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                {meta ? (
                  <WaveformPlayer
                    compact
                    sound={sampleToSound(categorySlug, sample, meta)}
                  />
                ) : (
                  <Skeleton className="h-8 w-full rounded-lg" />
                )}
              </div>
              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={sampleAudioUrl(categorySlug, sample.slug)}
                  download
                  aria-label={`Download ${sample.title}`}
                >
                  <DownloadIcon />
                </a>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
    </>
  );
}
