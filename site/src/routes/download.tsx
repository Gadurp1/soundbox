/**
 * `/download` — the installers, the launch film and the repo's numbers, on the site.
 *
 * The installer filenames carry the version (`Soundbox_0.4.1_x64-setup.exe`),
 * so a link to one file would go stale on every release. The page therefore
 * renders with links to `releases/latest` (which GitHub redirects to the newest
 * release) and, once mounted, asks the GitHub API for that release and for the
 * repository, then swaps in the direct asset links, version and sizes and fills
 * in the star, fork and download counts. If either request fails or is rate
 * limited, the fallback links still work and the counts show a dash.
 *
 * The visitor's OS is guessed after mount too, so the prerendered HTML is the
 * same for everyone and the big button only changes once the browser says what
 * it is running on.
 */

import {
  ArrowDownIcon,
  BotIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GitForkIcon,
  LaptopIcon,
  MonitorIcon,
  StarIcon,
  WifiOffIcon,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { SiteVideo } from "@/components/site-video";
import { SeoHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { REPO_URL } from "@/lib/marketing-links";
import { cn } from "@/lib/utils";

const LATEST_URL = `${REPO_URL}/releases/latest`;
const API_BASE = REPO_URL.replace("https://github.com/", "https://api.github.com/repos/");

interface Asset {
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  html_url: string;
  published_at: string;
  assets: Asset[];
}

interface Repo {
  stargazers_count: number;
  forks_count: number;
}

type PlatformId = "windows" | "mac-arm" | "mac-intel";

interface Platform {
  id: PlatformId;
  label: string;
  short: string;
  detail: string;
  icon: LucideIcon;
  match: (name: string) => boolean;
}

const PLATFORMS: Platform[] = [
  {
    id: "windows",
    label: "Windows",
    short: "Windows",
    detail: "Windows 10 and 11, x64",
    icon: MonitorIcon,
    match: (n) => /x64-setup\.exe$/i.test(n),
  },
  {
    id: "mac-arm",
    label: "macOS, Apple silicon",
    short: "Mac",
    detail: "M1 and later",
    icon: LaptopIcon,
    match: (n) => /aarch64\.dmg$/i.test(n),
  },
  {
    id: "mac-intel",
    label: "macOS, Intel",
    short: "Intel Mac",
    detail: "x64",
    icon: LaptopIcon,
    match: (n) => /x64\.dmg$/i.test(n),
  },
];

const PERKS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: WifiOffIcon,
    title: "Runs offline",
    body: "Models run on your own GPU. No account, no credits, nothing sent anywhere.",
  },
  {
    icon: DownloadIcon,
    title: "One installer",
    body: "The runtime ships inside. Models download from the app when you first use them.",
  },
  {
    icon: BotIcon,
    title: "Agents included",
    body: "An MCP server for Claude Code and Cursor starts with the app.",
  },
];

function megabytes(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** `GET` a GitHub API path and hand back the JSON, or null on any failure. */
async function github<T>(path: string, signal: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal,
      headers: { Accept: "application/vnd.github+json" },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * A best guess at the visitor's installer. Browsers on Apple silicon still
 * report "Intel" in the user agent, so a Mac defaults to the Apple silicon
 * build, which is what every Mac sold since 2020 needs.
 */
function detectPlatform(): PlatformId | null {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return "mac-arm";
  return null;
}

/** Five bars that bounce beside the version pill. Still for reduced motion. */
function Equalizer() {
  return (
    <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
      {[0.9, 0.5, 1, 0.65, 0.8].map((h, i) => (
        <span
          key={i}
          className="bg-primary w-[2px] origin-bottom rounded-full motion-safe:animate-[eq_1.1s_ease-in-out_infinite]"
          style={{ height: `${h * 100}%`, animationDelay: `${i * -0.18}s` }}
        />
      ))}
    </span>
  );
}

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="bg-card/60 ring-foreground/10 rounded-2xl px-5 py-4 text-left ring-1">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </p>
      <p className="font-heading mt-1 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function DownloadPage() {
  const [release, setRelease] = useState<Release | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [mine, setMine] = useState<PlatformId | null>(null);

  useEffect(() => {
    setMine(detectPlatform());
    const controller = new AbortController();
    void github<Release>("/releases/latest", controller.signal).then((d) => d && setRelease(d));
    void github<Repo>("", controller.signal).then((d) => d && setRepo(d));
    return () => controller.abort();
  }, []);

  const assetFor = (p: Platform) => release?.assets.find((a) => p.match(a.name));
  const primary = PLATFORMS.find((p) => p.id === mine);
  const primaryAsset = primary && assetFor(primary);
  const downloads = release?.assets.reduce((sum, a) => sum + a.download_count, 0);

  return (
    <div className="bg-background text-foreground min-h-svh overflow-x-clip">
      <SeoHead
        title="Download Soundbox for Windows and macOS | Soundbox"
        description="Download the Soundbox desktop app for Windows 10/11 or macOS. Free, open source, no account. Models download from inside the app."
        path="/download"
      />
      <style>{`@keyframes eq { 0%,100% { transform: scaleY(.35) } 50% { transform: scaleY(1) } }`}</style>

      <section aria-labelledby="download-heading" className="relative px-4">
        {/* Decorative: the landing page's teal wash, doubled up for a page
            whose whole job is one button. */}
        <div
          aria-hidden="true"
          className="bg-primary/15 pointer-events-none absolute -top-56 left-1/2 size-[40rem] -translate-x-1/2 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_center,var(--color-foreground)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent)] bg-[size:22px_22px] opacity-[0.06]"
        />

        <div className="relative mx-auto w-full max-w-3xl pt-16 pb-12 text-center sm:pt-24">
          <a
            href={release?.html_url ?? LATEST_URL}
            className="text-muted-foreground ring-border bg-card hover:text-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors"
          >
            <Equalizer />
            {release
              ? `${release.tag_name} · out ${new Date(release.published_at).toLocaleDateString("en", { month: "short", day: "numeric" })}`
              : "Latest release"}
            <span className="text-primary">Release notes →</span>
          </a>

          <h1
            id="download-heading"
            className="font-heading mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-7xl"
          >
            Your studio.{" "}
            <span className="from-primary bg-gradient-to-r to-emerald-300 bg-clip-text text-transparent">
              Your GPU.
            </span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
            Sound effects, music and voices from open models, made on your own machine. Free and
            open source, no account.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              asChild
              className="shadow-primary/30 h-12 rounded-full px-7 text-base shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
            >
              <a href={primaryAsset?.browser_download_url ?? "#platforms"}>
                <DownloadIcon aria-hidden="true" />
                {primary ? `Download for ${primary.short}` : "Choose your download"}
                {primaryAsset ? (
                  <span className="opacity-70">· {megabytes(primaryAsset.size)}</span>
                ) : null}
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 rounded-full px-6 text-base"
            >
              <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
                <StarIcon aria-hidden="true" className="text-amber-400" />
                Star on GitHub
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs tabular-nums">
                  {repo ? compact.format(repo.stargazers_count) : "—"}
                </span>
              </a>
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            {primary ? (
              <>
                Not on {primary.short}?{" "}
                <a href="#platforms" className="underline underline-offset-4">
                  Every installer is below
                </a>
                .
              </>
            ) : (
              "Windows 10/11 and macOS. Linux runs from source."
            )}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-5xl">
          <div
            aria-hidden="true"
            className="from-primary/40 absolute -inset-px rounded-2xl bg-gradient-to-b via-transparent to-transparent blur-xl"
          />
          <div className="ring-primary/30 relative rounded-2xl p-1.5 ring-1 backdrop-blur">
            <SiteVideo
              src="/media/launch.mp4"
              poster="/media/posters/launch.jpg"
              label="The Soundbox launch film: the app making sound effects, music and speech on a local machine"
            />
          </div>
          <p className="text-muted-foreground mt-3 text-center text-xs">
            The launch film. Turn your sound on.
          </p>
        </div>
      </section>

      <section aria-label="Project numbers" className="px-4 pt-14">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            icon={StarIcon}
            label="GitHub stars"
            value={repo ? compact.format(repo.stargazers_count) : "—"}
          />
          <Stat
            icon={DownloadIcon}
            label={release ? `Downloads of ${release.tag_name}` : "Downloads"}
            value={downloads !== undefined ? compact.format(downloads) : "—"}
          />
          <Stat icon={GitForkIcon} label="Forks" value={repo ? compact.format(repo.forks_count) : "—"} />
        </div>
      </section>

      <section id="platforms" aria-labelledby="platforms-heading" className="scroll-mt-20 px-4 pt-20">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
            Installers
          </p>
          <h2
            id="platforms-heading"
            className="font-heading mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Pick your machine
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {PLATFORMS.map((platform) => {
              const asset = assetFor(platform);
              const isMine = platform.id === mine;
              const Icon = platform.icon;
              return (
                <li
                  key={platform.id}
                  className={cn(
                    "bg-card relative flex flex-col rounded-2xl p-5 ring-1 transition-shadow",
                    isMine
                      ? "ring-primary/60 shadow-primary/10 shadow-xl"
                      : "ring-foreground/10 hover:ring-foreground/20",
                  )}
                >
                  {isMine ? (
                    <span className="bg-primary text-primary-foreground absolute -top-2.5 right-4 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                      Your system
                    </span>
                  ) : null}
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading mt-4 text-lg font-semibold">{platform.label}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{platform.detail}</p>
                  <Button
                    asChild
                    variant={isMine ? "default" : "outline"}
                    className="mt-5 w-full rounded-full"
                  >
                    <a href={asset?.browser_download_url ?? LATEST_URL}>
                      <ArrowDownIcon aria-hidden="true" />
                      {asset ? `Download · ${megabytes(asset.size)}` : "Download"}
                    </a>
                  </Button>
                  {asset ? (
                    <p className="text-muted-foreground mt-2 font-mono text-[11px] break-all">
                      {asset.name}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <ul className="mt-12 grid gap-6 sm:grid-cols-3">
            {PERKS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="first-launch-heading" className="px-4 pt-20">
        <div className="mx-auto w-full max-w-5xl">
          <div>
            <h2 id="first-launch-heading" className="font-heading text-xl font-semibold">
              Linux, or from source
            </h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              There is no Linux installer yet. Follow{" "}
              <a
                className="text-foreground underline underline-offset-4"
                href={`${REPO_URL}#run-from-source`}
              >
                Run from source
              </a>{" "}
              instead. Older versions are on the{" "}
              <a className="text-foreground underline underline-offset-4" href={`${REPO_URL}/releases`}>
                releases page
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="github-heading" className="px-4 py-20">
        <div className="bg-card ring-foreground/10 relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl px-6 py-12 text-center ring-1 sm:px-12">
          <div
            aria-hidden="true"
            className="bg-primary/20 pointer-events-none absolute -bottom-40 left-1/2 size-[28rem] -translate-x-1/2 rounded-full blur-3xl"
          />
          <div className="relative">
            <h2
              id="github-heading"
              className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Built in the open
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-lg leading-relaxed">
              Read the code, file an issue, send a pull request. A star helps other people find
              it.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild className="rounded-full">
                <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
                  <StarIcon aria-hidden="true" />
                  Star Soundbox
                  {repo ? (
                    <span className="opacity-70 tabular-nums">
                      · {compact.format(repo.stargazers_count)}
                    </span>
                  ) : null}
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full">
                <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer noopener">
                  Issues
                  <ExternalLinkIcon aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
