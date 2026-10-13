/**
 * Where a moved clip reads in the script.
 *
 * The server's rule (`placeInReadingOrder` in server/src/db.ts), mirrored so
 * the script re-orders in the same frame a clip lands rather than a round trip
 * later, and so the mock behaves like the real thing. Only the moved clip
 * moves: it goes before the first other clip that starts after it — or at the
 * same moment on a lower lane — and everything else keeps its order.
 */

interface Placed {
  id: string;
  position: number;
  start_s: number;
  track_index: number;
}

/** `segments` with `id` re-slotted by its placement and every position
 *  renumbered, in reading order. Unchanged input if `id` is not there. */
export function followPlacement<T extends Placed>(segments: readonly T[], id: string): T[] {
  const moved = segments.find((s) => s.id === id);
  if (!moved) return [...segments];
  const others = segments.filter((s) => s.id !== id).sort((a, b) => a.position - b.position);
  let at = others.findIndex(
    (o) =>
      o.start_s > moved.start_s ||
      (o.start_s === moved.start_s && o.track_index > moved.track_index),
  );
  if (at < 0) at = others.length;
  return [...others.slice(0, at), moved, ...others.slice(at)].map((s, position) =>
    s.position === position ? s : { ...s, position },
  );
}
