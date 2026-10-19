/**
 * `sitemap.xml`, listing exactly the pages the prerender wrote.
 *
 * Run from `ssgOptions.onFinished`, after every route is on disk, rather than
 * built from the route table: the table cannot say which dynamic paths were
 * emitted (that is `getStaticPaths` plus `includeAllRoutes: false`), but the
 * output directory can. Every `index.html` under `dist/` is a page; `404.html`
 * is not one, and Pagefind's directory has no `index.html` in it.
 *
 * URLs carry the trailing slash the host serves pages at, and no `<lastmod>`:
 * a build-clock date on every URL tells a crawler everything changed on every
 * deploy, which is worse than no date at all.
 *
 * A project site cannot serve the `robots.txt` crawlers read (that lives at
 * the host root), so the sitemap has to be submitted by hand in Search Console
 * and Bing Webmaster Tools until the site has a domain of its own.
 */

import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Directories (relative, "/"-separated, with a trailing slash) holding an index.html. */
function pageDirs(dir: string, rel = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(...pageDirs(path.join(dir, entry.name), `${rel}${entry.name}/`));
    } else if (entry.name === "index.html") {
      out.push(rel);
    }
  }
  return out;
}

/**
 * Write `<dir>/sitemap.xml`. `origin` is e.g. "https://gadurp1.github.io" and
 * `base` the build's base ("/" or "/soundbox/"). Without an origin it writes
 * nothing — a sitemap of relative URLs is invalid.
 */
export function writeSitemap(dir: string, origin: string, base: string): number {
  if (!origin) {
    console.warn("[sitemap] VITE_SITE_ORIGIN is unset; no sitemap.xml written.");
    return 0;
  }
  const root = `${origin.replace(/\/+$/, "")}${base}`;
  const urls = pageDirs(dir)
    .sort((a, b) => (a.length === b.length ? a.localeCompare(b) : a.length - b.length))
    .map((rel) => `  <url><loc>${escapeXml(`${root}${rel}`)}</loc></url>`);
  writeFileSync(
    path.join(dir, "sitemap.xml"),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      "</urlset>",
      "",
    ].join("\n"),
    "utf8",
  );
  return urls.length;
}
