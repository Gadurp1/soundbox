/**
 * Cover art for a music track, with the initial-tile fallback the artist cards
 * on `/music` already use.
 *
 * It exists as a shared component rather than a local one because three
 * surfaces render the same square — the cover grid and the track rows on the
 * hub, and the hero and footer on `/music/:slug` — and a fallback that only
 * some of them had would be worse than none: the broken squares would be the
 * ones nobody looked at.
 *
 * The fallback is a gradient and a letter, deliberately. It reads as absent
 * art rather than imitating the generated covers, which matters on a page
 * whose whole claim is that everything on it is a real render. An empty tile
 * that looked like cover art would be the one dishonest pixel here.
 */

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { MusicTrack } from "@/content/music/types";
import { assetUrl } from "@/lib/asset-url";

export function MusicCover({
  track,
  className,
  fallbackTextClassName,
}: {
  track: Pick<MusicTrack, "title" | "cover">;
  className?: string;
  /** Sized per surface — the hero tile carries a much larger letter than a
   *  40px track row does, and the two should not share a font size. */
  fallbackTextClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "from-primary/25 via-muted to-accent flex items-center justify-center bg-gradient-to-br",
          className,
        )}
      >
        <span
          className={cn(
            "font-heading text-muted-foreground font-semibold",
            fallbackTextClassName,
          )}
        >
          {track.title.slice(0, 1)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={assetUrl(track.cover)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
