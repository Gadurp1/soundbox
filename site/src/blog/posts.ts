/**
 * Every blog post, newest first.
 *
 * Globbed, unlike `src/docs/pages.ts`, which lists its files by hand. That
 * comment's reason — "the order *is* the reading order" — is exactly what does
 * not apply here: a blog's order is its publish dates, and those are data
 * inside the posts. Listing them again in a second file would be a second
 * place for the order to be wrong.
 *
 * The other half of the reason is `plugins/blog-feed.ts`. The RSS emitter runs
 * as a plain Node build hook and cannot import this module — it reaches for the
 * same `.md` files with the same parser instead. One `draft` flag, read twice
 * from the same place, rather than two lists that can drift apart.
 */

import { parseBlogFrontmatter, type BlogFrontmatter } from "../../plugins/frontmatter";
import type { DocHeading, DocModule } from "../../plugins/markdown";

export interface BlogPost extends BlogFrontmatter {
  /** URL slug: `/blog/<slug>`. Always the markdown file's basename. */
  slug: string;
  /** The post's `# Heading`, or its frontmatter `title`, or the slug. */
  title: string;
  html: string;
  headings: DocHeading[];
}

const modules = import.meta.glob<DocModule>("../../content/blog/*.md", {
  query: "?doc",
  eager: true,
});

/**
 * Drafts are for the author, not the reader.
 *
 * `import.meta.env.DEV` is true under `vite-react-ssg dev` and false in both
 * passes of a build — and `getStaticPaths` runs inside the SSR pass. So one
 * constant excludes drafts from the index, from the prerendered paths and
 * therefore from Pagefind, without three separate places agreeing to.
 *
 * `VITE_DRAFTS=1` builds them anyway, for when you want to see a draft in its
 * real static shape. On Windows that is `$env:VITE_DRAFTS=1` first, not a
 * prefix on the command.
 */
const SHOW_DRAFTS = import.meta.env.DEV || import.meta.env.VITE_DRAFTS === "1";

export const BLOG_POSTS: BlogPost[] = Object.entries(modules)
  // The authoring guide lives in the same directory so that anyone browsing
  // it on GitHub finds the rules before writing a post. It is not one.
  .filter(([path]) => !path.endsWith("/README.md"))
  .map(([path, mod]) => {
    const slug = path.slice(path.lastIndexOf("/") + 1, -".md".length);
    const front = parseBlogFrontmatter(mod.frontmatter, path);
    return {
      ...front,
      slug,
      title: mod.title || front.title || slug,
      html: mod.html,
      headings: mod.headings,
    };
  })
  .filter((post) => SHOW_DRAFTS || !post.draft)
  // ISO dates sort correctly as strings, which is why `date` stays a string —
  // no parsing, and no post landing a day early in one timezone.
  .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1));

/** Every tag in use, for the index's filter chips. */
export const BLOG_TAGS: string[] = [...new Set(BLOG_POSTS.flatMap((p) => p.tags))].sort();

export function postBySlug(slug: string | undefined): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}
