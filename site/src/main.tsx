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
export const createRoot = ViteReactSSG({ routes });
