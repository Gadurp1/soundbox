/**
 * `/sfx/:slug/:sample` — one sample's own indexable page.
 *
 * Extends the category page rather than replacing it: a search for one exact
 * sound ("heavy wooden door slam sound effect") should land somewhere that
 * plays it back in one glance, with the prompt that made it and a way to
 * make a variation, before it ever asks the reader to read a whole category
 * guide. Same content model as `category.tsx` — no new data source, just a
 * deeper URL into `content.samples`.
 */

import { Link, Navigate, useParams } from "react-router-dom";
import { DownloadIcon, FlaskConicalIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/docs-primitives";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WaveformPlayer } from "@/components/waveform-player";
import { MarketingLink } from "@/components/marketing-link";
import { SeoHead, breadcrumbJsonLd } from "@/components/seo-head";
import { getCategory } from "@/content/sfx/categories";
import { isPublished } from "@/content/sfx/types";
import type { PublishedCategory, SfxSample } from "@/content/sfx/types";
import { sampleAudioUrl, sampleToSound, useSampleManifest } from "@/lib/sfx-sample";
import { GENERATOR_HREF } from "@/lib/marketing-links";

function SampleBody({
  category,
  sample,
}: {
  category: PublishedCategory;
  sample: SfxSample;
}) {
  const { manifest, failed } = useSampleManifest(category.slug);
  const meta = manifest?.[sample.slug];
  const others = category.content.samples.filter((s) => s.slug !== sample.slug);

  return (
    <>
      <SeoHead
        title={`${sample.title} Sound Effect — Free to Generate | Soundbox`}
        description={`Listen to "${sample.title}", a ${category.name.toLowerCase()} sound effect, and see the exact prompt that made it. Generate your own variation locally.`}
        path={`/sfx/${category.slug}/${sample.slug}`}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Sound effects", path: "/sfx" },
            { name: category.name, path: `/sfx/${category.slug}` },
            { name: sample.title, path: `/sfx/${category.slug}/${sample.slug}` },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-muted-foreground pt-8 text-sm">
        <Link to="/sfx" className="hover:text-foreground underline-offset-4 hover:underline">
          Sound effects
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          to={`/sfx/${category.slug}`}
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          {category.name}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{sample.title}</span>
      </nav>

      <header className="py-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {sample.title}
          </h1>
          {sample.source === "placeholder" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1 text-[11px] font-normal">
                  <FlaskConicalIcon className="size-3" aria-hidden="true" />
                  Placeholder
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{sample.placeholderNote ?? "Not an model render."}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          One of our {category.name.toLowerCase()} sound effects
          {sample.model ? `, generated with ${sample.model}` : ""}. The prompt below is the exact
          one that produced it — copy it, change a word, and generate your own take.
        </p>
      </header>

      {failed ? (
        <p className="text-muted-foreground text-sm">This sample could not be loaded.</p>
      ) : meta ? (
        <div className="bg-card ring-border/70 rounded-2xl p-4 ring-1">
          <WaveformPlayer sound={sampleToSound(category.slug, sample, meta)} />
        </div>
      ) : (
        <Skeleton className="h-14 w-full rounded-2xl" />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={sampleAudioUrl(category.slug, sample.slug)} download>
            <DownloadIcon />
            Download MP3
          </a>
        </Button>
        <Button asChild>
          <MarketingLink href={GENERATOR_HREF}>Generate a variation</MarketingLink>
        </Button>
      </div>

      <section aria-labelledby="prompt" className="border-border/60 mt-10 border-t py-10">
        <h2 id="prompt" className="font-heading text-xl font-semibold tracking-tight">
          The prompt
        </h2>
        <div className="bg-muted/50 ring-border mt-4 min-w-0 overflow-hidden rounded-xl ring-1 ring-inset">
          <div className="flex items-start justify-between gap-2 px-3 py-3">
            <p className="min-w-0 font-mono text-xs leading-relaxed">{sample.prompt}</p>
            <CopyButton value={sample.prompt} label="Copy prompt" className="shrink-0" />
          </div>
        </div>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Generated{sample.model ? ` with ${sample.model}` : ""}. These models respond to
          material, action and space — not mood labels — so the most useful edit is usually
          swapping one concrete noun for another.
        </p>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="more" className="border-border/60 border-t py-10">
          <h2 id="more" className="font-heading text-xl font-semibold tracking-tight">
            More {category.name.toLowerCase()} sounds
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.slice(0, 8).map((s) => (
              <li key={s.slug}>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/sfx/${category.slug}/${s.slug}`}>{s.title}</Link>
                </Button>
              </li>
            ))}
          </ul>
          <Link
            to={`/sfx/${category.slug}`}
            className="text-muted-foreground hover:text-foreground mt-4 inline-block text-sm underline-offset-4 hover:underline"
          >
            See the whole {category.name.toLowerCase()} collection
          </Link>
        </section>
      )}
    </>
  );
}

export function SfxSamplePage() {
  const { slug, sample: sampleSlug } = useParams();
  const category = getCategory(slug);
  const sample =
    category && isPublished(category)
      ? category.content.samples.find((s) => s.slug === sampleSlug)
      : undefined;

  // No thin pages: an unknown category, an unpublished one, or a sample slug
  // that doesn't exist in it all fall back to the nearest real page instead
  // of rendering an empty template.
  if (!category || !isPublished(category)) {
    return <Navigate to="/sfx" replace />;
  }
  if (!sample) {
    return <Navigate to={`/sfx/${category.slug}`} replace />;
  }

  return (
    <div className="bg-background text-foreground min-h-svh">
      <div className="mx-auto w-full max-w-3xl px-4">
        <SampleBody category={category} sample={sample} />
      </div>
    </div>
  );
}
