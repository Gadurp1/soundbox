/**
 * Publish `docs/*.md` as pages of the site, at build time.
 *
 * The docs are markdown in the repo because that is where they are useful to
 * anyone with a checkout, and GitHub renders them for free. They were also
 * invisible to everybody else: the only doc the site served was the generated
 * API reference. So rather than move them into components — two copies of the
 * same prose, one of which goes stale — the site reads the files.
 *
 * This is the VitePress-shaped hole in a custom site, filled without adopting
 * a second design system: markdown in, `{ title, html, headings }` out, and
 * the site's own components draw the page around it.
 *
 * Everything happens in the Vite transform, so neither `marked` nor `shiki`
 * reaches the browser — the client gets a string of HTML that the SSG has
 * already put in the static file.
 */

import { readFile } from "node:fs/promises";

import GithubSlugger from "github-slugger";
import { marked } from "marked";
import { createHighlighter, type Highlighter } from "shiki";
import type { Plugin } from "vite";

import { splitFrontmatter, type FmValue } from "./frontmatter";

/** A heading worth a line in the on-page contents. `h1` is the page title and
 *  `h4`+ is detail nobody navigates by, so the table is h2 and h3. */
export interface DocHeading {
  depth: 2 | 3;
  text: string;
  id: string;
}

/**
 * What a `?doc` module exports.
 *
 * `src/markdown.d.ts` declares the same shape ambiently, which types a static
 * `import * as doc from "./FOO.md?doc"`. It does not type an
 * `import.meta.glob` result — that comes back as `unknown` — so the blog's
 * post collection needs a real, importable type. This is it.
 */
export interface DocModule {
  title: string;
  html: string;
  headings: DocHeading[];
  frontmatter: Record<string, FmValue>;
}

const SUFFIX = "?doc";

/** Both themes are baked in and swapped by CSS, because the site's theme is a
 *  class on `<html>` that the server cannot know at build time. */
const THEMES = { light: "github-light", dark: "github-dark" } as const;

let highlighterPromise: Promise<Highlighter> | null = null;

function highlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [THEMES.light, THEMES.dark],
    langs: ["bash", "json", "ts", "tsx", "js", "python", "toml", "ini", "http", "md"],
  });
  return highlighterPromise;
}

/** Language tags that appear in our docs but are not what Shiki calls them. */
const LANG_ALIASES: Record<string, string> = {
  sh: "bash",
  shell: "bash",
  console: "bash",
  javascript: "js",
  typescript: "ts",
  jsonc: "json",
  yaml: "json",
  text: "md",
  "": "md",
};

export function markdownDocs(): Plugin {
  return {
    name: "soundbox:markdown-docs",
    async load(id) {
      if (!id.endsWith(SUFFIX)) return null;
      const file = id.slice(0, -SUFFIX.length);
      if (!file.endsWith(".md")) return null;

      const source = await readFile(file, "utf8");
      // Blog posts carry a frontmatter block; docs do not. Splitting
      // unconditionally costs one regex and means the plugin does not have to
      // know which kind of file it is looking at.
      const { data, body } = splitFrontmatter(source);
      this.addWatchFile(file);

      const shiki = await highlighter();
      const slugger = new GithubSlugger();
      const headings: DocHeading[] = [];
      let title = "";

      const renderer = new marked.Renderer();

      renderer.heading = ({ text, depth }) => {
        // The heading's own markdown, rendered — `**bold**` in a heading is
        // rare but a backticked identifier is not.
        const parsed = marked.parseInline(text) as string;
        const plain = parsed.replace(/<[^>]+>/g, "");
        // The first `# Title` becomes the page's own header, drawn by the
        // route with the site's display type. Rendering it again at the top of
        // the prose would print the same words twice in two different sizes.
        if (depth === 1 && !title) {
          title = plain;
          return "";
        }
        const id = slugger.slug(plain);
        if (depth === 2 || depth === 3) headings.push({ depth, text: plain, id });
        // The anchor is the heading itself rather than a link beside it: a
        // `#` that only appears on hover is a link nobody on a touch screen
        // has ever found.
        return `<h${depth} id="${id}"><a class="doc-anchor" href="#${id}">${parsed}</a></h${depth}>\n`;
      };

      renderer.code = ({ text, lang }) => {
        const language = LANG_ALIASES[lang ?? ""] ?? lang ?? "md";
        try {
          return shiki.codeToHtml(text, {
            lang: language,
            themes: THEMES,
            defaultColor: false,
          });
        } catch {
          // An unknown language is a reason to show the code plainly, not to
          // fail the build over a fenced block.
          const escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `<pre class="shiki"><code>${escaped}</code></pre>`;
        }
      };

      // Links between docs are written for GitHub — `./MCP.md` — and have to
      // become site URLs on the way out.
      renderer.link = ({ href, title: linkTitle, text: label }) => {
        const text = marked.parseInline(label) as string;
        const local = /^\.?\/?([A-Z0-9_-]+)\.md(#.*)?$/i.exec(href ?? "");
        const to = local ? `/docs/${local[1].toLowerCase()}${local[2] ?? ""}` : href;
        const external = /^https?:/i.test(to ?? "");
        const attrs = external ? ' target="_blank" rel="noreferrer"' : "";
        return `<a href="${to}"${linkTitle ? ` title="${linkTitle}"` : ""}${attrs}>${text}</a>`;
      };

      const html = marked.parse(body, { renderer, async: false }) as string;

      // A post may name its own title instead of opening with an `# H1`.
      if (!title && typeof data.title === "string") title = data.title;

      return `export const title = ${JSON.stringify(title)};
export const html = ${JSON.stringify(html)};
export const headings = ${JSON.stringify(headings)};
export const frontmatter = ${JSON.stringify(data)};
`;
    },
  };
}
