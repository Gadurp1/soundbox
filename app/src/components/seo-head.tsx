/**
 * Per-route document head: title, description, canonical, Open Graph, JSON-LD.
 *
 * This writes directly to `document` rather than pulling in a helmet library —
 * there is exactly one consumer (the `/sfx` pages), the API surface needed is
 * four tags, and a dependency for that would be hard to justify.
 *
 * It is a *client-side* head, which on its own is worth very little for SEO.
 * It becomes worth something under the site's prerender step: the crawler loads each route in a real browser, lets
 * this effect run, and serialises the resulting DOM to a static .html file. So
 * the tags below are what ends up in the shipped markup — but only because
 * something snapshots them, never because a crawler waited for React.
 *
 * Tags are keyed with `data-seo-head` so that navigating between routes
 * replaces them instead of stacking duplicates.
 */

import { useEffect } from "react";

const MARK = "data-seo-head";

/**
 * Absolute origin for canonical and og:url, e.g. "https://soundbox.audio".
 *
 * Deliberately not hardcoded: the project has no public deployment yet (the app
 * is served from 127.0.0.1 by the local backend), so inventing a domain here
 * would put a wrong canonical into the markup. With the variable unset the
 * canonical and og:url tags are simply omitted, which is the correct behaviour
 * for a preview build.
 */
const SITE_ORIGIN: string = import.meta.env.VITE_SITE_ORIGIN ?? "";

export interface SeoHeadProps {
  title: string;
  description: string;
  /** Absolute path, e.g. "/sfx/8bit". Combined with VITE_SITE_ORIGIN. */
  path: string;
  /** schema.org objects, serialised into one or more JSON-LD script tags. */
  jsonLd?: object[];
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute(MARK, "");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function SeoHead({ title, description, path, jsonLd }: SeoHeadProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("name", "twitter:card", "summary_large_image");

    const url = SITE_ORIGIN ? `${SITE_ORIGIN}${path}` : "";
    let canonical: HTMLLinkElement | null = null;
    if (url) {
      upsertMeta("property", "og:url", url);
      canonical =
        document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? null;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        canonical.setAttribute(MARK, "");
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }

    const scripts = (jsonLd ?? []).map((obj) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.setAttribute(MARK, "");
      el.textContent = JSON.stringify(obj);
      document.head.appendChild(el);
      return el;
    });

    return () => {
      document.title = previousTitle;
      for (const s of scripts) s.remove();
    };
  }, [title, description, path, jsonLd]);

  return null;
}

/** `FAQPage` for the question list a category page renders. */
export function faqJsonLd(faqs: { question: string; answer: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** `BreadcrumbList` for Sound effects → <category>. */
export function breadcrumbJsonLd(
  trail: { name: string; path: string }[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      ...(SITE_ORIGIN ? { item: `${SITE_ORIGIN}${t.path}` } : {}),
    })),
  };
}
