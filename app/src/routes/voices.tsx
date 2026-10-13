/**
 * Voices — the marketing page for the speech side of Soundbox, at `/voices`.
 *
 * The site covered sound effects, music and the studio and said nothing about
 * voices, even though most of the catalog is voice models and the app has a
 * whole workflow for them: a one-off read (`speak`), scripts that persist as
 * stories with per-speaker lines on a timeline, and a Voice Lab where a cast
 * is built. This page closes that gap.
 *
 * The same two rules as `studio.tsx` apply:
 *
 * 1. **No query hooks.** Prerendered by vite-react-ssg, no backend, no
 *    `QueryClientProvider` above it — a hook from `@/lib/queries` would throw
 *    at render.
 * 2. **No overselling.** Every claim here traces to a source: the voice
 *    routes in `server/src/routes/voices.ts` (builtin vs clone, WAV upload),
 *    the story routes in `server/src/routes/stories.ts` (per-line generate,
 *    reorder, export, the SSE live view), the page docstrings in
 *    `routes/voice.tsx` / `routes/voice-lab.tsx` / `routes/story.tsx`, the
 *    delivery table in `docs/MCP.md`, and the catalog in
 *    `content/models/models.ts`. The model numbers below are *derived* from
 *    that file rather than written down, for the same reason `MODEL_STATS`
 *    is: a hand-maintained count is a lie waiting to happen.
 *
 * The licence section deliberately does not reproduce the licence table —
 * `/models` owns that, entry by entry with sources, and two copies would
 * drift. This page states the shape of the problem and links there.
 */

import { Link } from "react-router-dom";
import { ExternalLinkIcon, MicIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WindowChrome } from "@/components/window-chrome";
import { ModelParamsDemo } from "@/components/model-params-demo";
import { SeoHead } from "@/components/seo-head";
import { ambientPeaks } from "@/lib/studio-scene";
import { GENERATOR_HREF, MODELS_HUB_HREF } from "@/lib/marketing-links";
import { MODELS } from "@/content/models/models";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------- derived */

/**
 * Counted from the catalog, not asserted. `verified` means someone here ran
 * the model end-to-end through the adapter — see `ModelContent.verified` —
 * and for voice models that is currently almost none of them, which the copy
 * below says out loud instead of hiding.
 */
const VOICE_MODELS = MODELS.filter((m) => m.category === "voice");
const VOICE_STATS = {
  count: VOICE_MODELS.length,
  total: MODELS.length,
  optIn: VOICE_MODELS.filter((m) => m.tier === "extra").length,
  verified: VOICE_MODELS.filter((m) => m.verified).length,
  nonCommercial: VOICE_MODELS.filter((m) => m.license.commercial === "no").length,
  conditional: VOICE_MODELS.filter((m) => m.license.commercial === "conditional").length,
  unknown: VOICE_MODELS.filter((m) => m.license.commercial === "unknown").length,
};

/* ---------------------------------------------------------- primitives */

/** Same shape as the `Section` in `music/hub.tsx` — copied rather than
 *  extracted because two call sites do not justify a shared component, and
 *  the hubs are allowed to diverge in layout if they need to. */
function Section({
  id,
  title,
  lede,
  className,
  children,
}: {
  id: string;
  title: string;
  lede?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} data-section={id} className={cn("scroll-mt-20 pt-14", className)}>
      <h2
        id={id}
        className="font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl"
      >
        {title}
      </h2>
      {lede && (
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{lede}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------- visual */

/**
 * One spoken line as the timeline draws it: a labelled clip with a waveform.
 *
 * The bars come from `ambientPeaks`, which is seeded and quantised — the
 * server-rendered markup and the hydrated client must agree bar for bar, so
 * nothing here may touch Math.random or the clock. Purely decorative; the
 * text beside it carries the information.
 */
function LineClip({
  speaker,
  text,
  seed,
  widthPct,
  offsetPct,
  tone,
}: {
  speaker: string;
  text: string;
  seed: string;
  widthPct: number;
  offsetPct: number;
  tone: string;
}) {
  const peaks = ambientPeaks(seed, 26);
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground w-16 shrink-0 text-right font-mono text-[10px] tracking-tight">
        {speaker}
      </span>
      <div className="relative h-11 min-w-0 flex-1">
        <div
          className={cn("absolute inset-y-0 overflow-hidden rounded-md border", tone)}
          style={{ left: `${offsetPct}%`, width: `${widthPct}%` }}
        >
          <svg
            viewBox="0 0 104 24"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-x-1 top-1/2 h-6 w-[calc(100%-0.5rem)] -translate-y-1/2 opacity-70"
          >
            {peaks.map((p, i) => {
              const h = 3 + p * 18;
              return (
                <rect
                  key={i}
                  x={i * 4}
                  y={12 - h / 2}
                  width={2.4}
                  height={h}
                  rx={1}
                  className="fill-current"
                />
              );
            })}
          </svg>
          <span className="absolute bottom-0.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate text-[9px] leading-tight opacity-90">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The script-to-lanes picture: three lines, two speakers, each line a clip on
 * its speaker's lane. This is the story page's actual arrangement — the
 * script on the left of that page and the timeline on the right are the same
 * lines seen two ways — compressed into one frame.
 */
function StoryFigure() {
  return (
    <figure className="border-border/60 bg-card/80 overflow-hidden rounded-xl border shadow-sm">
      <WindowChrome label="Story — Night shift, scene 2" />
      <div className="space-y-2 p-4">
        <LineClip
          speaker="NARRATOR"
          text="The depot is empty by nine."
          seed="voices-narrator-1"
          widthPct={44}
          offsetPct={0}
          tone="border-primary/40 bg-primary/10 text-primary"
        />
        <LineClip
          speaker="MARA"
          text="Not tonight it isn't."
          seed="voices-mara-1"
          widthPct={26}
          offsetPct={40}
          tone="border-chart-2/40 bg-chart-2/10 text-chart-2"
        />
        <LineClip
          speaker="NARRATOR"
          text="She was right about that, too."
          seed="voices-narrator-2"
          widthPct={32}
          offsetPct={62}
          tone="border-primary/40 bg-primary/10 text-primary"
        />
      </div>
      <figcaption className="border-border/60 text-muted-foreground border-t px-4 py-2 text-[11px] leading-relaxed">
        Each line of the script is a clip on its speaker&apos;s lane. Drag one earlier and the
        script reorders to match — the timeline decides the reading order, not the other way
        around.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section aria-labelledby="voices-hero-heading" className="relative overflow-hidden px-4">
      {/* Same decorative wash as the studio and landing heroes, same token —
          this is a fourth page of one site, not a microsite. */}
      <div
        aria-hidden="true"
        className="bg-primary/12 pointer-events-none absolute -top-48 left-1/2 size-[34rem] -translate-x-1/2 rounded-full blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-3xl py-16 text-center sm:py-24">
        <span className="text-muted-foreground ring-border bg-card inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1">
          <MicIcon className="size-3.5" aria-hidden="true" />
          Text to speech · voice cloning · local
        </span>

        <h1
          id="voices-hero-heading"
          className="font-heading mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
        >
          Text to speech and voice cloning, out of the box
        </h1>

        <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
          Type a line and get it read as a clip in your library. Clone a voice from a WAV you
          upload or a sound you already made, and use it anywhere a built-in speaker would go.
          Write a whole script — speakers, pauses, deliveries — and the studio reads it line by
          line onto a timeline you can rearrange. All of it on your own machine, through
          open-weight models you choose and download yourself.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button size="lg" variant="outline" asChild>
            <a href={GENERATOR_HREF} target="_blank" rel="noreferrer noopener">
              Install guide
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link to={MODELS_HUB_HREF}>See the voice models</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- close */

function Close() {
  return (
    <section
      aria-labelledby="voices-close-heading"
      className="border-border/60 bg-muted/20 border-t px-4 py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="max-w-2xl">
          <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
            Running it
          </p>
          <h2
            id="voices-close-heading"
            className="font-heading mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            Voices ship with the app, like everything else
          </h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            The Voice Studio, the stories and the Voice Lab are all part of Soundbox — the same
            local server on <code className="font-mono text-xs">127.0.0.1:17494</code>, the same
            library, no account. What you need before your first read is a text-to-speech model,
            and which one is a decision worth ten minutes: the licences differ more here than
            anywhere else in the catalog.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild>
            <a href={GENERATOR_HREF} target="_blank" rel="noreferrer noopener">
              Install guide
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link to={MODELS_HUB_HREF}>Browse the models</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/studio">The studio</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */

export function VoicesPage() {
  return (
    <div className="bg-background text-foreground min-h-svh overflow-x-clip">
      <SeoHead
        title="Local AI Voices, Narration and Scripts | Soundbox"
        description={`Text-to-speech, voice cloning and multi-speaker scripts on your own machine. ${VOICE_STATS.count} open-weight voice models catalogued, each with its licence researched — several are non-commercial, and the page says which.`}
        path="/voices"
      />
      <a
        href="#main"
        className="bg-card ring-ring sr-only rounded-lg px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:ring-2"
      >
        Skip to content
      </a>
      <main id="main">
        <Hero />

        <div className="mx-auto w-full max-w-5xl px-4 pb-4">
          {/* The order is the order the workflow grows: one read, then a
              script that keeps its reads, then the cast behind them, then the
              agent surface, then the honest part about models and licences. */}

          <Section
            id="one-line"
            title="One line, one clip"
            lede="The smallest unit of the voice workflow is a single read."
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
                <p>
                  Type a line, pick a voice, press Speak. The result is an ordinary sound in your
                  library — taggable, searchable, exportable as WAV — not a preview that
                  evaporates when you navigate away.
                </p>
                <p>
                  How a line is <em>performed</em> is separate from what it says. Writing{" "}
                  <code className="font-mono text-xs">(whispering)</code> into the text makes the
                  model say the word &ldquo;whispering&rdquo; out loud; delivery is its own set of
                  controls instead, and Soundbox reads each model family&apos;s actual parameter
                  table so the knobs you see are the ones that model listens to. A model with no
                  delivery knobs shows none — its words and its voice are its only controls.
                </p>
              </div>
              <div className="border-border/60 bg-card/80 overflow-hidden rounded-xl border shadow-sm">
                <WindowChrome label="Voice Studio — Speak" />
                <div className="space-y-3 p-4 text-sm">
                  <p className="border-border/60 bg-background/60 rounded-md border px-3 py-2 leading-relaxed">
                    The depot is empty by nine. Most nights, anyway.
                  </p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                    <span className="border-border/60 rounded-full border px-2.5 py-1">
                      Voice: Narrator
                    </span>
                    <span className="border-border/60 rounded-full border px-2.5 py-1">
                      Pace: unhurried
                    </span>
                    <span className="bg-primary text-primary-foreground ml-auto rounded-full px-3 py-1 font-medium">
                      Speak
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section
            id="stories"
            title="A script that stays"
            lede="A story is a document, not a log: ordered lines that each know where they read in the script and where they sit in time."
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              <StoryFigure />
              <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
                <p>
                  Write lines, give each a speaker, and voice them one at a time. Generation is
                  per line on purpose: regenerating one read is the single most common thing you
                  do to a script — a word was mispronounced, a take was flat — and it should cost
                  seconds, not a re-render of the whole piece.
                </p>
                <p>
                  The lines live on a multi-track timeline. Clips can be moved, split at a point,
                  reordered, muted per lane; when you are done, the story exports as one mixed
                  WAV. Deleting a story leaves its audio in the library unless you say otherwise —
                  throwing away a draft and clearing out a finished piece are different acts, so
                  it is your call each time.
                </p>
                <p>
                  A story can also start from existing audio: hand it a library sound and it opens
                  as a story, optionally split into stems with each stem on its own lane.
                </p>
              </div>
            </div>
          </Section>

          <Section
            id="cast"
            title="The cast is yours to build"
            lede="Voices are objects in a library of their own, picked from a list or cloned from a clip."
          >
            <div className="text-muted-foreground grid gap-6 text-sm leading-relaxed sm:grid-cols-2">
              <div className="border-border/60 bg-card/80 rounded-xl border p-5">
                <h3 className="font-heading text-foreground text-sm font-semibold">
                  Built-in voices
                </h3>
                <p className="mt-2">
                  Many model families ship named speakers. Saving one as a voice gives it a name
                  and notes of your own, so &ldquo;the tired dispatcher&rdquo; stays the tired
                  dispatcher across every script that casts her.
                </p>
              </div>
              <div className="border-border/60 bg-card/80 rounded-xl border p-5">
                <h3 className="font-heading text-foreground text-sm font-semibold">
                  Cloned voices
                </h3>
                <p className="mt-2">
                  Models that support cloning take a reference clip — a sound already in your
                  library, or a WAV you upload — and read new text in that voice. The Voice Lab is
                  where you audition the result: a test read per voice, judged by listening before
                  it is committed to a script.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-5 max-w-3xl text-sm leading-relaxed">
              One thing to be clear-eyed about: almost none of these models&apos; licences require
              you to have a speaker&apos;s permission before cloning their voice. That makes
              consent your responsibility rather than nobody&apos;s. Get it.
            </p>
          </Section>

          <Section
            id="tuning"
            title="One composer, every model's own controls"
            lede="The parameter panel is generated from what each model actually accepts, so switching models rebuilds the knobs rather than showing a lowest common denominator."
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
              <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
                <p>
                  Soundbox ships parameter definitions for{" "}
                  <span className="text-foreground font-medium">29 model families</span> —{" "}
                  <span className="text-foreground font-medium">165 controls</span> in total,
                  across sliders, numbers, toggles, choices and text. They are not a guess at what
                  each model listens to: they are vendored from audio.cpp&apos;s own parameter
                  file and checked against its per-family source, then grouped so that &ldquo;how
                  should this line be said&rdquo; and &ldquo;how hard should the sampler
                  work&rdquo; are not the same list.
                </p>
                <p>
                  That matters because these are request options, not command-line flags, and
                  audio.cpp accepts unknown keys silently — a misspelled parameter is invisible
                  rather than an error. Generating the panel from the real definitions is what
                  stops a control existing for a model that will ignore it.
                </p>
                <p>
                  Two behaviours in the demo are the real ones. A parameter can be listed and
                  still do nothing until another is on, so dependent controls grey out until their
                  gate is set. And only values you actually change are sent — touch nothing and
                  the request carries nothing, leaving the model&apos;s own defaults standing.
                </p>
                <p className="text-muted-foreground/80">
                  The same panel drives sound effects and music. Voice models simply have the most
                  to tune, which is why it is shown here.
                </p>
              </div>

              <ModelParamsDemo />
            </div>
          </Section>

          <Section
            id="agents"
            title="Agents can write and voice scripts too"
            lede="The story tools are on the same MCP surface as everything else in Soundbox."
          >
            <div className="text-muted-foreground max-w-3xl space-y-4 text-sm leading-relaxed">
              <p>
                A connected agent can speak a one-off line, create a story, add lines with
                speakers and per-line delivery, revise them, and voice the result — the same
                endpoints the app itself uses. Every generated file comes back with an absolute
                path, so the agent can hand narration straight to ffmpeg or drop it into a video
                project.
              </p>
              <p>
                And you can watch it happen: the story page holds a live connection open, so a
                script an agent is writing appears line by line as it is written, not on the next
                refresh. Every call is attributed to the client that made it on the Agents page.
              </p>
            </div>
          </Section>

          <Section
            id="models"
            title={`${VOICE_STATS.count} voice models, verified status and licence stated per model`}
            lede={`Voice is the largest category in the catalog — ${VOICE_STATS.count} of ${VOICE_STATS.total} models are text-to-speech, voice conversion or cloning. It is also the least uniform.`}
          >
            <div className="text-muted-foreground max-w-3xl space-y-4 text-sm leading-relaxed">
              <p>
                Every voice model in the catalog is opt-in: none appears in the app&apos;s picker
                until it is enabled in Settings.{" "}
                {VOICE_STATS.verified === 1
                  ? "One of the " + VOICE_STATS.count + " has been verified end to end"
                  : VOICE_STATS.verified + " of the " + VOICE_STATS.count + " have been verified end to end"}
                ; the rest are catalogued from audio.cpp&apos;s shipped model list and are marked
                unverified. The model pages say which is which.
              </p>
              <p>
                The licences vary widely. Of the {VOICE_STATS.count}:{" "}
                {VOICE_STATS.nonCommercial} are non-commercial outright,{" "}
                {VOICE_STATS.conditional} permit commercial use only under conditions — revenue
                caps, attribution duties, per-speaker voice licences — and{" "}
                {VOICE_STATS.unknown} have no confirmed licence, which their model pages state
                plainly rather than defaulting to permissive. For commercial work, the entry for
                the specific model applies — read it before generating anything meant to ship.
              </p>
            </div>
            <div className="mt-6">
              <Button variant="outline" asChild>
                <Link to={MODELS_HUB_HREF}>Read the licence write-ups on /models</Link>
              </Button>
            </div>
          </Section>
        </div>

        <div className="mt-14">
          <Close />
        </div>
      </main>
    </div>
  );
}
