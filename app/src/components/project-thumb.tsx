/**
 * Thumbnail for a project — a deterministic tile derived from its name.
 *
 * It follows the `MusicCover` rule for absent art: a quiet tinted gradient and
 * an initial, rather than anything imitating rendered cover art. The tint is
 * derived from the name the same way the timeline derives lane colours
 * (`--lane-l`/`--lane-c` with a per-name hue), so every project gets a stable
 * identity in both themes without anyone drawing anything.
 *
 * Shape is the caller's: the same component is a square in the projects list
 * and a 2:3 portrait on the dashboard shelf, set via `className`.
 */

import { cn } from "@/lib/utils";

/** Same spirit as `laneHue`: a stable hue per name, avoiding the accent's
 *  neighbourhood around 195 so no tile reads as "selected". */
function nameHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const arc = ((hash % 300) + 300) % 300; // 300 degrees of usable hue
  return (arc + 245) % 360; // rotate the excluded band onto ~195±30
}

export function ProjectThumb({ name, className }: { name: string; className?: string }) {
  const hue = nameHue(name);

  return (
    <div
      aria-hidden="true"
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{
        background: `linear-gradient(150deg,
          oklch(var(--lane-l) var(--lane-c) ${hue} / 0.28),
          oklch(var(--lane-l) var(--lane-c) ${hue} / 0.08) 55%,
          oklch(var(--lane-l) var(--lane-c) ${(hue + 40) % 360} / 0.18))`,
      }}
    >
      <span className="font-heading text-muted-foreground text-xl font-semibold">
        {name.trim().slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}
