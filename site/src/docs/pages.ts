/**
 * Which markdown files are pages, and in what order.
 *
 * Listed rather than globbed: the order *is* the reading order, and a
 * directory listing would put "API" first because of the alphabet. A new doc
 * is a line here, which is also where you decide whether it belongs in the
 * "Start here" half or the reference half.
 */

import * as install from "../../../docs/INSTALL.md?doc";
import * as architecture from "../../../docs/ARCHITECTURE.md?doc";
import * as generating from "../../../docs/GENERATING.md?doc";
import * as studio from "../../../docs/STUDIO.md?doc";
import * as library from "../../../docs/LIBRARY.md?doc";
import * as audiocpp from "../../../docs/AUDIOCPP.md?doc";
import * as desktop from "../../../docs/DESKTOP.md?doc";
import * as api from "../../../docs/API.md?doc";
import * as mcp from "../../../docs/MCP.md?doc";
import type { DocHeading } from "../../plugins/markdown";

export interface DocPage {
  slug: string;
  /** Sidebar label. Usually shorter than the document's own `# Title`. */
  label: string;
  section: string;
  title: string;
  html: string;
  headings: DocHeading[];
  /** One line under the title, and the page's meta description. */
  blurb: string;
}

export const DOC_PAGES: DocPage[] = [
  {
    slug: "install",
    label: "Install",
    section: "Start here",
    blurb: "Get Soundbox running, with models, on your own machine.",
    ...install,
  },
  {
    slug: "generating",
    label: "Generating sound",
    section: "Using Soundbox",
    blurb:
      "Prompt, model, seed, takes — how a generation runs, and what each parameter actually changes.",
    ...generating,
  },
  {
    slug: "studio",
    label: "The studio",
    section: "Using Soundbox",
    blurb:
      "Arranging: lanes and clips, trimming, fades and crossfades, the mixer, the device rack, and the export.",
    ...studio,
  },
  {
    slug: "library",
    label: "Library & projects",
    section: "Using Soundbox",
    blurb:
      "Where everything you make goes, how to find it again, and how editing works without destroying the original.",
    ...library,
  },
  {
    slug: "architecture",
    label: "Architecture",
    section: "Under the hood",
    blurb:
      "One process, one port: the app, the API, the MCP server, the database and where your files live.",
    ...architecture,
  },
  {
    slug: "audiocpp",
    label: "audio.cpp",
    section: "Under the hood",
    blurb:
      "The inference engine: one binary, no Python, no CUDA install ritual — and how Soundbox picks a backend for your machine.",
    ...audiocpp,
  },
  {
    slug: "desktop",
    label: "Desktop app",
    section: "Under the hood",
    blurb: "Building and shipping Soundbox as a Tauri desktop app.",
    ...desktop,
  },
  {
    slug: "api",
    label: "HTTP API",
    section: "Reference",
    blurb: "The local server's endpoints, and what they take and return.",
    ...api,
  },
  {
    slug: "mcp",
    label: "MCP tools",
    section: "Reference",
    blurb: "The tools an agent gets when it connects to Soundbox over MCP.",
    ...mcp,
  },
];

/** The sections in the order they should appear, each with its pages. */
export const DOC_SECTIONS: { name: string; pages: DocPage[] }[] = DOC_PAGES.reduce(
  (sections, page) => {
    const existing = sections.find((s) => s.name === page.section);
    if (existing) existing.pages.push(page);
    else sections.push({ name: page.section, pages: [page] });
    return sections;
  },
  [] as { name: string; pages: DocPage[] }[],
);

export function docBySlug(slug: string): DocPage | null {
  return DOC_PAGES.find((p) => p.slug === slug) ?? null;
}
