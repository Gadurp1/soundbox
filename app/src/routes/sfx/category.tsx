/**
 * `/sfx/:slug` — the programmatic landing-page template.
 *
 * One component renders every category; everything that differs between pages
 * lives in `@/content/sfx/categories.ts`. That split is the point: a new page
 * is a content commit, and the template can be improved for all of them at
 * once.
 *
 * It renders outside the app shell (see App.tsx) for the same reason /welcome
 * does — a marketing page has no business carrying the app's sidebar.
 *
 * Section order is chosen for the reader, not the crawler: the samples are the
 * first thing on the page because "let me hear one" is the actual reason
 * somebody searched. Everything argumentative comes after they have heard it.
 */

import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowRightIcon,
  BotIcon,
  ScaleIcon,
  TerminalIcon,
  WifiOffIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/docs-primitives";
import { SampleGrid } from "@/components/sfx/sample-grid";
import { MarketingLink } from "@/components/marketing-link";
import { SeoHead, breadcrumbJsonLd, faqJsonLd } from "@/components/seo-head";
import { getCategory } from "@/content/sfx/categories";
import { isPublished } from "@/content/sfx/types";
import type { PublishedCategory } from "@/content/sfx/types";
import { GENERATOR_HREF, REPO_URL, WELCOME_HREF } from "@/lib/marketing-links";
import { cn } from "@/lib/utils";
import { assetUrl } from "@/lib/asset-url";


const MCP_SNIPPET = `claude mcp add --transport http soundbox http://127.0.0.1:17494/mcp`;

const CURL_SNIPPET = `curl -X POST http://127.0.0.1:17494/api/generate \\
  -H 'Content-Type: application/json' \\
  -d '{"model":"audiocpp-stable-audio-3-sfx","prompt":"8-bit coin pickup blip","duration_s":1}'`;

/* ------------------------------------------------------------ primitives */

function Section({
  id,
  title,
  lede,
  children,
  className,
}: {
  id: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("border-border/60 border-t py-12", className)}>
      <h2
        id={id}
        className="font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl"
      >
        {title}
      </h2>
      {lede && <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">{lede}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Code({ label, children }: { label: string; children: string }) {
  return (
    <div className="bg-muted/50 ring-border min-w-0 overflow-hidden rounded-xl ring-1 ring-inset">
      <div className="text-muted-foreground border-border/60 flex items-center gap-2 border-b px-3 py-1.5 text-xs font-medium">
        <TerminalIcon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-xs leading-relaxed">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

function CategoryBody({ category }: { category: PublishedCategory }) {
  const { content } = category;
  const related = content.related
    .map((slug) => getCategory(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <>
      <SeoHead
        title={category.metaTitle}
        description={category.metaDescription}
        path={`/sfx/${category.slug}`}
        jsonLd={[
          faqJsonLd(content.faqs),
          breadcrumbJsonLd([
            { name: "Sound effects", path: "/sfx" },
            { name: category.name, path: `/sfx/${category.slug}` },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-muted-foreground pt-8 text-sm">
        <Link to="/sfx" className="hover:text-foreground underline-offset-4 hover:underline">
          Sound effects
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <header className="py-8">
        {category.coverImage && (
          <img
            src={assetUrl(category.coverImage)}
            alt=""
            className="ring-border/70 mb-6 aspect-video w-full rounded-2xl object-cover ring-1"
          />
        )}
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {category.h1}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
          {category.intro}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <MarketingLink href={GENERATOR_HREF}>Open the generator</MarketingLink>
          </Button>
          <Button variant="outline" asChild>
            <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
              Install Soundbox
            </a>
          </Button>
        </div>
      </header>

      <Section
        id="samples"
        // Phrased around the collection rather than the sound because half the
        // names are now plural or compound — "10 trailer hits & braams samples"
        // is what the obvious template produces.
        title={`Listen: ${content.samples.length} samples from the ${category.name.toLowerCase()} collection`}
        lede="Every clip shows the exact prompt that produced it — the render script reads these prompts from the same file this page does, so what you hear is what the words made. Copy one, change a word, and you have your own."
      >
        <SampleGrid categorySlug={category.slug} samples={content.samples} />
      </Section>

      <Section
        id="recipes"
        title="Prompts that work"
        lede="These models answer to physical description, not mood labels. Name the material, the action and the space."
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {content.recipes.map((r) => (
            <li key={r.label} className="bg-card ring-border/70 rounded-2xl p-4 ring-1">
              <h3 className="text-sm font-semibold tracking-tight">{r.label}</h3>
              <div className="mt-2 flex items-start justify-between gap-2">
                <p className="text-muted-foreground min-w-0 font-mono text-xs leading-relaxed">
                  {r.prompt}
                </p>
                <CopyButton value={r.prompt} label="Copy prompt" className="-mt-1 -mr-1 shrink-0" />
              </div>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{r.why}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="craft" title={`Making ${category.name.toLowerCase()} sounds that fit`}>
        <div className="max-w-2xl space-y-6">
          {content.craft.map((c) => (
            <div key={c.heading}>
              <h3 className="text-sm font-semibold tracking-tight">{c.heading}</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="why-local"
        title="Why generate locally"
        lede="The differentiators here are structural, not marketing: the models run on your machine, so the cost, the privacy and the automation story all change."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: WifiOffIcon,
              title: "Offline after download",
              body: "Weights are fetched once. After that, generation, the library and the API all work with the network off. Everything lives in one SQLite file and one folder of WAVs under ~/.soundbox — nothing is uploaded.",
            },
            {
              icon: BotIcon,
              title: "Your agent can use it",
              body: "Soundbox runs an MCP server inside the same process, with tools for generating and listing sounds. Generated files come back as absolute paths, so an agent can pipe them straight into a project.",
            },
            {
              icon: ScaleIcon,
              title: "Licences stated up front",
              body: "Every model's terms are shown before you download it, and non-commercial weights need an explicit confirmation. Soundbox is MIT; the model that made a sound governs what you may do with that sound.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card ring-border/70 rounded-2xl p-5 ring-1">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <Icon className="size-4.5" aria-hidden="true" />
              </div>
              <h3 className="mt-3.5 text-sm font-semibold tracking-tight">{title}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Code label="Connect a coding agent">{MCP_SNIPPET}</Code>
          <Code label="Generate over HTTP">{CURL_SNIPPET}</Code>
        </div>
      </Section>

      <Section id="faq" title="Frequently asked questions">
        <dl className="max-w-2xl space-y-6">
          {content.faqs.map((f) => (
            <div key={f.question}>
              <dt className="text-sm font-semibold tracking-tight">{f.question}</dt>
              <dd className="text-muted-foreground mt-2 leading-relaxed">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {related.length > 0 && (
        <Section id="related" title="Related collections">
          <ul className="flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.slug}>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/sfx/${c.slug}`}>{c.name}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Separator />
      <footer className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 py-8 text-sm">
        <Link to="/sfx" className="hover:text-foreground inline-flex items-center gap-1">
          All sound effect collections
          <ArrowRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-foreground"
        >
          GitHub
        </a>
        <MarketingLink href={WELCOME_HREF} className="hover:text-foreground">
          What Soundbox is
        </MarketingLink>
      </footer>
    </>
  );
}

export function SfxCategoryPage() {
  const { slug } = useParams();
  const category = getCategory(slug);

  // An unwritten category must not render an empty template. Sending it to the
  // hub is both the right user outcome and the right crawler signal: there is
  // no thin page to index because there is no page.
  if (!category || !isPublished(category)) {
    return <Navigate to="/sfx" replace />;
  }

  return (
    <div className="bg-background text-foreground min-h-svh">
      <div className="mx-auto w-full max-w-3xl px-4">
        <CategoryBody category={category} />
      </div>
    </div>
  );
}
