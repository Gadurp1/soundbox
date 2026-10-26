/**
 * Drag a panel's header past the edge of the window to give it a window of
 * its own.
 *
 * Pointer capture is what makes this possible at all: while the button is
 * held the header keeps receiving moves after the pointer has left the page,
 * so the release can be read at a screen position the page never covered.
 * That release is where the new window opens, under the pointer, at the size
 * the panel had in the studio.
 */

import { useRef, useState } from "react";

import { NOT_A_GRIP, isOutsideWindow, type PopOutAt } from "@/lib/popout";

/** How far the pointer has to travel before a press on a header is a drag,
 *  so a click on the title is still a click. */
const DRAG_THRESHOLD_PX = 4;

export function useDragOut(onDragOut: ((at: PopOutAt) => void) | undefined) {
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    /** Where on the panel it was picked up, so the window opens with the
     *  same point under the pointer. */
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    moved: boolean;
  } | null>(null);
  /** Past the edge right now: the panel says so, so letting go is not a
   *  surprise. */
  const [outside, setOutside] = useState(false);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>): void => {
    if (!onDragOut || event.button !== 0) return;
    if ((event.target as Element).closest(NOT_A_GRIP)) return;
    const panel = event.currentTarget.closest("section") ?? event.currentTarget;
    const rect = panel.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>): void => {
    const state = drag.current;
    if (state === null || state.pointerId !== event.pointerId) return;
    if (
      !state.moved &&
      Math.hypot(event.clientX - state.startX, event.clientY - state.startY) < DRAG_THRESHOLD_PX
    ) {
      return;
    }
    state.moved = true;
    setOutside(isOutsideWindow(event));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>): void => {
    const state = drag.current;
    if (state === null || state.pointerId !== event.pointerId) return;
    drag.current = null;
    setOutside(false);
    if (state.moved && event.type === "pointerup" && isOutsideWindow(event)) {
      onDragOut?.({
        left: event.screenX - state.offsetX,
        top: event.screenY - state.offsetY,
        width: state.width,
        height: state.height,
      });
    }
  };

  return {
    outside,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
