/**
 * What `import * as doc from "…/FOO.md?doc"` gives you.
 *
 * The shape is produced by `plugins/markdown.ts` at build time; this is the
 * declaration that lets the rest of the site treat it as a normal module.
 */
declare module "*.md?doc" {
  export const title: string;
  export const html: string;
  export const headings: { depth: 2 | 3; text: string; id: string }[];
  /** The post's frontmatter block, unvalidated. Empty for the docs. */
  export const frontmatter: Record<string, string | boolean | string[]>;
}
