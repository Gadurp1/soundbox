/**
 * Root-relative URLs, made to work under a sub-path deploy.
 *
 * The public site can be hosted at a path rather than at a domain root — a
 * GitHub Pages project site lives at `https://<user>.github.io/<repo>/`, so
 * `/sfx/8bit/manifest.json` has to become `/<repo>/sfx/8bit/manifest.json`.
 * The router handles its own links through `basename`; everything else that
 * ends up as a raw URL in the DOM (an img or audio src, a download href, a
 * fetch, a canonical link) goes through here.
 *
 * Vite sets `import.meta.env.BASE_URL` from the build's `base`. The app build
 * leaves it at "/", which makes both functions identity functions there.
 */

const BASE: string = import.meta.env.BASE_URL || "/";

/** Absolute origin for canonical/og URLs, e.g. "https://hamsanders.github.io". Empty when unset. */
export const SITE_ORIGIN: string = (import.meta.env.VITE_SITE_ORIGIN ?? "").replace(/\/+$/, "");

/**
 * Prefix a root-relative path ("/sfx/x.mp3") with the deploy's base path.
 *
 * Anything that is not root-relative — a full URL, a protocol-relative URL, a
 * `data:`/`blob:` URL, a fragment, a relative path — comes back unchanged, and
 * so does a path that already carries the base, so calling it twice is safe.
 */
export function assetUrl(path: string): string {
  if (BASE === "/" || BASE === "./" || !path.startsWith("/") || path.startsWith("//")) return path;
  if (path === BASE.slice(0, -1) || path.startsWith(BASE)) return path;
  return BASE + path.slice(1);
}

/**
 * The absolute URL of a root-relative path: `SITE_ORIGIN` + base + path.
 * Empty when no origin is configured, so callers can omit the tag outright
 * rather than ship a relative canonical.
 */
export function siteUrl(path: string): string {
  return SITE_ORIGIN ? `${SITE_ORIGIN}${assetUrl(path)}` : "";
}

/**
 * A root-relative *page* path with a trailing slash: "/sfx/door" -> "/sfx/door/".
 *
 * The prerender writes each page as `<path>/index.html`, and static hosts
 * (GitHub Pages included) answer the slashless URL with a 301 to the slashed
 * one. Links and canonicals that already carry the slash skip that hop. A
 * query or fragment stays after the slash, and a path whose last segment has a
 * file extension ("/blog/rss.xml") is a file, not a page, so it is left alone.
 */
export function pagePath(path: string): string {
  const match = /^([^?#]*)(.*)$/.exec(path);
  const [pathname, rest] = [match?.[1] ?? path, match?.[2] ?? ""];
  if (!pathname.startsWith("/") || pathname.endsWith("/")) return path;
  if (/\.[a-z0-9]+$/i.test(pathname.slice(pathname.lastIndexOf("/")))) return path;
  return `${pathname}/${rest}`;
}

/**
 * The absolute URL of a page, always ending in "/" — for canonicals, og:url,
 * breadcrumbs and feeds. Use `siteUrl` for files (MP3s, images).
 */
export function pageUrl(path: string): string {
  return siteUrl(pagePath(path));
}
