/**
 * The tail of the app's top bar, lent to whichever page is open.
 *
 * The studio used to carry its own header row: a back button, the story's
 * title, and the tools that act on it. That is a second bar directly under the
 * app's own, saying an overlapping thing — the breadcrumb already names where
 * you are, and the back button already existed as the crumb beside it. So the
 * page projects its controls into the bar instead, and the studio gets the
 * vertical space back.
 *
 * A portal rather than a store: what a page wants up there is JSX with its own
 * handlers and state, and passing React nodes through a store would mean
 * re-rendering the shell every time a page's header changed. The portal keeps
 * the nodes owned by the page that made them.
 */

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const SlotNode = createContext<HTMLElement | null>(null);
const SetSlotNode = createContext<(node: HTMLElement | null) => void>(() => {});

export function HeaderSlotProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  return (
    <SetSlotNode.Provider value={setNode}>
      <SlotNode.Provider value={node}>{children}</SlotNode.Provider>
    </SetSlotNode.Provider>
  );
}

/** Rendered once, by the app header: the space a page may fill. */
export function HeaderSlot({ className }: { className?: string }) {
  const setNode = useContext(SetSlotNode);
  return (
    <div
      ref={setNode}
      className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
    />
  );
}

/**
 * Rendered by a page: its own controls, in the app's top bar.
 *
 * Nothing on the first render — the slot's element does not exist until the
 * header has mounted and told the provider about it, which is one render
 * later. A page header appearing a frame late is invisible; guarding against
 * it with a layout effect would not be.
 */
export function PageHeader({ children }: { children: ReactNode }) {
  const node = useContext(SlotNode);
  return node ? createPortal(children, node) : null;
}
