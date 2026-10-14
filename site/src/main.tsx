import { ViteReactSSG } from "vite-react-ssg";

import { routes } from "./routes";
// The app's stylesheet plus this build's own `@source` roots — see site.css.
import "./site.css";
// Prose styling for the markdown docs — site-only, see the file for why.
import "./docs/prose.css";

// The public `/sfx` site's entry — see site/vite.config.ts. No
// QueryClientProvider, no app shell: the /sfx pages don't call the backend
// (see the audit notes in sample-grid.tsx and the two route files), so this
// stays deliberately thinner than app/src/App.tsx. Theming is handled by
// `Layout` wrapping every route (see routes.tsx), not here.
//
// `basename` follows Vite's `base` (SITE_BASE in vite.config.ts): "/soundbox/"
// becomes "/soundbox", and a root deploy passes none. vite-react-ssg uses the
// same value to prerender each route at base + path while still writing the
// file at `dist/<path>/index.html`, which is where a sub-path host looks.
const basename = import.meta.env.BASE_URL.replace(/\/+$/, "") || undefined;

export const createRoot = ViteReactSSG({ routes, basename });
