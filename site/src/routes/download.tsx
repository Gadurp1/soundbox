/**
 * `/download` — the installers, the launch film and the repo's numbers, on the site.
 *
 * The installer filenames carry the version (`Soundbox_0.4.1_x64-setup.exe`),
 * so a link to one file would go stale on every release. The page therefore
 * renders with links to `releases/latest` (which GitHub redirects to the newest
 * release) and, once mounted, asks the GitHub API for that release and for the
 * repository, then swaps in the direct asset links, version and sizes and fills
 * in the star, fork and download counts. If either request fails or is rate
 * limited, the fallback links still work and the counts stay hidden.
 */

import { DownloadIcon, GitForkIcon, StarIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteVideo } from "@/components/site-video";
import { SeoHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { REPO_URL } from "@/lib/marketing-links";

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

interface Platform {
  label: string;
  detail: string;
  match: (name: string) => boolean;
}

const PLATFORMS: Platform[] = [
  {
    label: "Windows",
    detail: "Windows 10 and 11, x64",
    match: (n) => /x64-setup\.exe$/i.test(n),
  },
  {
    label: "macOS, Apple silicon",
    detail: "M1 and later",
    match: (n) => /aarch64\.dmg$/i.test(n),
  },
  {
    label: "macOS, Intel",
    detail: "x64",
    match: (n) => /x64\.dmg$/i.test(n),
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

export function DownloadPage() {
  const [release, setRelease] = useState<Release | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void github<Release>("/releases/latest", controller.signal).then((d) => d && setRelease(d));
    void github<Repo>("", controller.signal).then((d) => d && setRepo(d));
    return () => controller.abort();
  }, []);

  const downloads = release?.assets.reduce((sum, a) => sum + a.download_count, 0) ?? 0;

  return (
    <div className="bg-background text-foreground min-h-svh">
      <SeoHead
        title="Download Soundbox for Windows and macOS | Soundbox"
        description="Download the Soundbox desktop app for Windows 10/11 or macOS. Free, open source, no account. Models download from inside the app."
        path="/download"
      />

      <div className="mx-auto w-full max-w-3xl px-4">
        <header className="pt-12 pb-8">
          <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
            Download
          </p>
          <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Get Soundbox
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed text-pretty sm:text-lg">
            Free and open source. The installers carry their own runtime, so nothing else needs
            installing. Models download from inside the app the first time you use them.
            {release ? (
              <>
                {" "}
                Latest release:{" "}
                <a className="underline underline-offset-4" href={release.html_url}>
                  {release.tag_name}
                </a>
                , {new Date(release.published_at).toLocaleDateString("en", { dateStyle: "long" })}.
              </>
            ) : null}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
                <StarIcon aria-hidden="true" />
                Star on GitHub
                {repo ? (
                  <span className="text-muted-foreground tabular-nums">
                    {compact.format(repo.stargazers_count)}
                  </span>
                ) : null}
              </a>
            </Button>
            {repo ? (
              <p className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <GitForkIcon className="size-4" aria-hidden="true" />
                  {compact.format(repo.forks_count)} forks
                </span>
                {downloads > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <DownloadIcon className="size-4" aria-hidden="true" />
                    {compact.format(downloads)} downloads of {release?.tag_name}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        </header>

        <SiteVideo
          src="/media/launch.mp4"
          poster="/media/posters/launch.jpg"
          label="The Soundbox launch film: the app making sound effects, music and speech on a local machine"
          caption="The launch film. Press play for sound."
        />

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {PLATFORMS.map((platform) => {
            const asset = release?.assets.find((a) => platform.match(a.name));
            return (
              <li key={platform.label} className="border-border rounded-xl border p-5">
                <h2 className="font-heading text-lg font-semibold">{platform.label}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{platform.detail}</p>
                <Button asChild className="mt-4 w-full">
                  <a href={asset?.browser_download_url ?? LATEST_URL}>
                    {asset ? `Download (${megabytes(asset.size)})` : "Download"}
                  </a>
                </Button>
                {asset ? (
                  <p className="text-muted-foreground mt-2 text-xs break-all">{asset.name}</p>
                ) : null}
              </li>
            );
          })}
        </ul>

        <section className="py-10">
          <h2 className="font-heading text-xl font-semibold">First launch</h2>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            The builds are not signed yet, so Windows SmartScreen and macOS Gatekeeper ask you to
            confirm the first launch.{" "}
            <a
              className="underline underline-offset-4"
              href={`${REPO_URL}/blob/main/docs/DESKTOP.md#installing`}
            >
              The install notes
            </a>{" "}
            show where.
          </p>
          <h2 className="font-heading mt-8 text-xl font-semibold">Linux, from source, or GitHub</h2>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            There is no Linux installer. Follow{" "}
            <a className="underline underline-offset-4" href={`${REPO_URL}#run-from-source`}>
              Run from source
            </a>{" "}
            instead. The code, the issues and older versions are on{" "}
            <a className="underline underline-offset-4" href={REPO_URL}>
              GitHub
            </a>
            , with every build on the{" "}
            <a className="underline underline-offset-4" href={`${REPO_URL}/releases`}>
              releases page
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
