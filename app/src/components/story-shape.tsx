/**
 * A story's arrangement, drawn small.
 *
 * The shelf's cards used to be three lines of text, which made a page of them
 * a page of titles — and a title is the one thing about a story you had to
 * invent. What a story actually looks like is its timeline: a dense
 * left-packed run of short lines reads as a script, four lanes of long blocks
 * read as a mix, and you can tell those apart across a grid without reading
 * anything.
 *
 * Redrawn from the clip placements rather than captured from the studio. A
 * screenshot would have to be taken while a story was open, stored, and
 * re-taken on every drag — so the shelf would show stale pictures of the
 * stories you had visited and nothing at all for the rest. Placements come
 * down with the list (`Story.timeline`), cost a few hundred bytes, and are by
 * definition current.
 *
 * It is a shape cue, not an identifier: two 30-line scripts do look alike.
 * That is the honest amount of signal — the title still tells those apart,
 * and this tells a script from an arrangement.
 */

import { laneColor } from "@/lib/lanes";
import { cn } from "@/lib/utils";
import type { TimelineClip } from "@/lib/api";

/** Unit space. Positions are fractions of the story's own length and lane
 *  count, and the box is drawn without aspect ratio, so this stretches to
 *  whatever square the card gives it. */
const W = 100;
const H = 100;
/**
 * How much of a lane's pitch its clips fill, the rest being the gap below.
 *
 * Lower than it would be on a wide strip. Squaring a timeline compresses the
 * time axis and leaves the lanes alone, so a fat bar makes every short clip
 * taller than it is wide — an arrangement that reads as confetti rather than
 * as clips. Thin bars keep them horizontal.
 */
const BAR_FRACTION = 0.5;
/**
 * A ceiling on lane pitch, and the reason the stack is centred rather than
 * stretched.
 *
 * Dividing the height by the lane count would make a one-lane story a slab
 * filling two thirds of the tile — which reads as a colour swatch, not as a
 * timeline. Capping the pitch and centring what results keeps lanes looking
 * like lanes at any count: one clip is a bar across the middle, eight fill
 * the tile.
 */
const MAX_LANE_PITCH = 16;
/**
 * How wide to draw one clip: its real length, widened to at least a square
 * dot, but never widened past where the next clip on its lane starts.
 *
 * Both halves of that are needed. Squaring a timeline compresses the time
 * axis hard — a two-second line in a minute-long story is a pixel or two
 * across — and anything narrower than it is tall stops reading as a clip and
 * becomes a tally mark, so the floor is the bar height (the tile is square,
 * so a unit is a unit either way). But a floor alone would make a dense
 * script worse, not better: twenty short lines back to back would each grow
 * past the next and fuse into one bar that claims the story is one long take.
 * So growth stops at the neighbour. Clips that genuinely overlap — the
 * timeline crossfades those — keep their real width, since there the overlap
 * is the truth.
 */
function clipWidth(natural: number, floor: number, toNeighbour: number): number {
  return Math.min(Math.max(natural, floor), Math.max(natural, toNeighbour));
}

/**
 * What an empty story draws.
 *
 * A blank tile among full ones reads as a story that failed to load rather
 * than one with nothing in it yet, so an empty story gets the ghost of an
 * arrangement instead: the same geometry, in the muted foreground, at an
 * opacity no real clip ever has. It says "this is where the timeline goes".
 */
const PLACEHOLDER: TimelineClip[] = [
  { t: 0, s: 0, d: 3 },
  { t: 0, s: 3.6, d: 1.6 },
  { t: 1, s: 1.2, d: 2.2 },
  { t: 2, s: 2.6, d: 4.4 },
];

export function StoryShape({ clips, className }: { clips: TimelineClip[]; className?: string }) {
  const empty = clips.length === 0;
  const drawn = empty ? PLACEHOLDER : clips;

  // Lanes are packed by *use*, not by index: a story whose only clips sit on
  // track 4 should draw one bar, not one bar under four empty rows. The
  // colour still follows the real track index, because a lane's hue is its
  // identity everywhere else in the studio and a preview that recoloured it
  // would be decoration.
  const lanes = [...new Set(drawn.map((c) => c.t))].sort((a, b) => a - b);
  const end = drawn.reduce((max, c) => Math.max(max, c.s + c.d), 0);
  const pitch = Math.min(H / lanes.length, MAX_LANE_PITCH);
  const barH = pitch * BAR_FRACTION;
  const top = (H - pitch * lanes.length) / 2;

  // How far each clip is from the next one on its own lane, so widening a
  // short clip enough to see cannot run it into its neighbour. The list
  // arrives in start order per lane already — it is ordered by start overall
  // — so this is one pass.
  const nextOnLane = new Map<TimelineClip, number>();
  const lastOfLane = new Map<number, TimelineClip>();
  for (const clip of [...drawn].sort((a, b) => a.s - b.s)) {
    const previous = lastOfLane.get(clip.t);
    if (previous) nextOnLane.set(previous, ((clip.s - previous.s) / end) * W);
    lastOfLane.set(clip.t, clip);
  }

  return (
    <div
      aria-hidden="true"
      className={cn("bg-muted/40 aspect-square w-full overflow-hidden rounded-lg", className)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="presentation"
      >
        {drawn.map((clip, i) => {
          const width = clipWidth(
            (clip.d / end) * W,
            barH,
            nextOnLane.get(clip) ?? Infinity,
          );
          return (
            <rect
              // Clips have no id here — there is nothing to key by but where
              // they are, and nothing about this list is reordered in place.
              key={i}
              x={Math.min((clip.s / end) * W, W - width)}
              y={top + lanes.indexOf(clip.t) * pitch + (pitch - barH) / 2}
              width={width}
              height={barH}
              // Inline CSS rather than a `fill` attribute: both colours are
              // built from theme variables, and `var()` only resolves in a
              // style. The ghost takes the muted foreground so it stays a
              // greyed-out bar in either theme.
              style={{
                fill: empty
                  ? "color-mix(in oklab, var(--muted-foreground) 30%, transparent)"
                  : laneColor(clip.t, 0.85),
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
