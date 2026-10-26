/**
 * Where a menu, a tooltip or a dialog draws itself.
 *
 * Radix portals into `document.body` unless told otherwise, and `document` is
 * always the main window's — the one this bundle was loaded into. A panel the
 * studio has popped out into a window of its own is still part of the same
 * React tree, so its dropdowns would open on the *other* monitor, in the
 * window you are not looking at. The popped-out window provides its own body
 * here, and the `ui/` wrappers pass it to their portals.
 *
 * `undefined` everywhere else, which is Radix's own default.
 */

import { createContext, useContext } from "react";

export const PortalContainerContext = createContext<HTMLElement | undefined>(undefined);

export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext);
}
