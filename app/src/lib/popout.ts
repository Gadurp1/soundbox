/**
 * Opening a studio panel in a window of its own.
 *
 * The panel is not a second copy of the app. The window is a blank page that
 * this one opened, and the panel is rendered into it with a React portal — so
 * it is the same component tree, the same stores, the same audio graph and the
 * same query cache as the studio it came from. Edit a clip in a timeline on
 * your second monitor and the script beside the main window moves with it,
 * because there is only one of each.
 *
 * The cost is that the window can only be opened from a gesture (browsers
 * block `window.open` otherwise), so a pop-out never survives a reload: the
 * panel comes back into the studio and you drag it out again.
 */

/** Where the new window goes and how big it is, in screen pixels. A missing
 *  position lets the browser or the OS choose. */
export interface PopOutAt {
  left?: number;
  top?: number;
  width: number;
  height: number;
}

/** No window smaller than this: a timeline 200px wide is a scrollbar. */
const MIN_WIDTH = 360;
const MIN_HEIGHT = 240;

/**
 * Open the window, synchronously, inside the gesture that asked for it.
 *
 * Returns `null` when the browser refused — a popup blocker, or a gesture
 * that had already expired by the time the pointer came up.
 */
export function openPopoutWindow(id: string, at: PopOutAt): Window | null {
  const features = [
    "popup=yes",
    `width=${Math.round(Math.max(MIN_WIDTH, at.width))}`,
    `height=${Math.round(Math.max(MIN_HEIGHT, at.height))}`,
    ...(at.left !== undefined ? [`left=${Math.round(at.left)}`] : []),
    ...(at.top !== undefined ? [`top=${Math.round(at.top)}`] : []),
  ].join(",");
  // A name per panel, so a second "pop out" of the same panel reuses the
  // window it already has rather than stacking another one on top of it.
  return window.open("", `soundbox-panel-${id}`, features);
}

/** Is the pointer past the edge of this window? Where a drag has to end to
 *  mean "take this out of the app". */
export function isOutsideWindow(event: { clientX: number; clientY: number }): boolean {
  return (
    event.clientX < 0 ||
    event.clientY < 0 ||
    event.clientX > window.innerWidth ||
    event.clientY > window.innerHeight
  );
}

/** Things a press can start that are not "pick the panel up": the header's
 *  own buttons, tabs, fields and the timeline's toolbar. */
export const NOT_A_GRIP = "button, a, input, select, textarea, [role=tab], [data-no-grip]";
