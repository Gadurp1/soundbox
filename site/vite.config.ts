import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { markdownDocs } from "./plugins/markdown";
import { blogFeed } from "./plugins/blog-feed";
import { sharedPublicFiles } from "./plugins/shared-public";

// The public `/sfx` site: a thin second Vite entry over the same source as
// `app/` — a separate target rather than trying to make the HashRouter SPA
// crawlable in place.
//
// One design system, one player, two build targets: everything under `@/*`
// resolves straight into `../app/src`, so a component written once for the
// app "just works" here too, as long as it doesn't reach for something that
// only exists with a live backend behind it (the `/sfx` pages don't).
export default defineConfig({
  /**
   * The site build is, by definition, the public-site target.
   *
   * Baked in here rather than read from an env file, so the marketing pages
   * cannot render as the app just because a `.env` was missing. See
   * `app/src/lib/marketing-links.ts`.
   */
  define: {
    "import.meta.env.VITE_TARGET": JSON.stringify("site"),
  },
  // `markdownDocs` turns `docs/*.md?doc` into `{ title, html, headings }` at
  // build time — see the plugin for why the docs are read rather than copied.
  plugins: [
    react(),
    tailwindcss(),
    markdownDocs(),
    blogFeed(),
    // Files both builds serve stay in app/public; see the plugin.
    sharedPublicFiles(path.resolve(__dirname, "../app/public"), ["favicon.svg"]),
  ],
  resolve: {
    /**
     * One copy of each of these, whichever tree they are reached through.
     *
     * The site has its own `node_modules` — it must, because `vite-react-ssg`
     * needs react-router 6 while the app it borrows components from is on 7 —
     * and without this the app's components resolve React from the repo root
     * while the site's own files resolve it here. Two Reacts is the
     * "Cannot read properties of null (reading 'useCallback')" crash: the
     * second copy's dispatcher is never installed.
     *
     * `react-router-dom` is in the list for the same reason with the opposite
     * winner — everything on this site has to agree on the v6 that
     * `vite-react-ssg` renders with.
     */
    dedupe: ["react", "react-dom", "react-router-dom", "radix-ui"],
    alias: [
      // Site-specific override: the app's SeoHead writes tags via a
      // useEffect, which produces nothing during SSR. This must be listed
      // before the general "@" alias below so it wins for this one path.
      { find: "@/components/seo-head", replacement: path.resolve(__dirname, "./src/seo-head.tsx") },
      // Escape hatch back to the real app source, used by the override above
      // to re-export the pure (non-head-writing) helpers unchanged.
      { find: "@sfx-app", replacement: path.resolve(__dirname, "../app/src") },
      { find: "@", replacement: path.resolve(__dirname, "../app/src") },
    ],
  },
  /**
   * Bundle every dependency into the SSR pass rather than leaving them for
   * Node to resolve.
   *
   * The site has its own `node_modules` (it must — `vite-react-ssg` needs
   * react-router 6 while the app it borrows components from is on 7). An
   * externalised dependency is resolved by Node, not by Vite, so `lucide-react`
   * would `require("react")` and walk up to the repo root while the renderer
   * itself used the copy of `react-dom` next door. Two Reacts, and every
   * component that touches a context dies with "Cannot read properties of null
   * (reading 'useContext')" — during prerender, so the page 500s rather than
   * degrading.
   *
   * `resolve.dedupe` cannot fix that on its own: it only reaches modules Vite
   * itself resolves. Bundling makes Vite resolve all of them, and dedupe then
   * applies.
   */
  ssr: {
    // The UI packages only — everything that calls a React hook. `true` would
    // also inline React's own CJS entry points, which the module runner cannot
    // evaluate ("module is not defined"), and React itself does not need to be
    // bundled: the renderer resolves it from this directory either way.
    noExternal: [
      "lucide-react",
      "radix-ui",
      "next-themes",
      "zustand",
      "sonner",
      "wavesurfer.js",
      "class-variance-authority",
      "tailwind-merge",
    ],
  },
  // The site's own media: /sfx and /music sample MP3s + manifests and covers,
  // blog images, product screenshots. None of it ships with the app. The
  // scripts/gen-*-tracks.mjs and scripts/gen-sfx-samples.ts renderers write
  // here.
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  ssgOptions: {
    // /sfx/8bit -> /sfx/8bit/index.html, not /sfx/8bit.html — plain static
    // hosts (Cloudflare Pages, Netlify, GitHub Pages) all serve that shape
    // at the clean URL without extra rewrite rules.
    dirStyle: "nested",
    // Dynamic routes are prerendered only for the paths their
    // getStaticPaths returns (routes.tsx) — e.g. only SFX_CATEGORIES entries
    // with `content` (see isPublished in content/sfx/types.ts). This keeps
    // the hub itself and the other static routes in the default set.
    includeAllRoutes: false,
  },
});
