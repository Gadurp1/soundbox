/**
 * The three-dot title bar every product-shaped marketing visual on this site
 * wears — `timeline-banner.tsx` had it first; this is the same chrome pulled
 * out so `reveal-prompt-to-sample.tsx` and `reveal-studio.tsx` can share it
 * rather than each drawing their own dots.
 *
 * It exists to say "this is a screen in an application" rather than "this is
 * decoration" — a mockup with no frame reads as an illustration; one with a
 * title bar reads as a window you could be looking at right now.
 */

export function WindowChrome({ label }: { label: string }) {
  return (
    <div className="border-border/60 bg-muted/30 flex items-center gap-2 border-b px-3 py-1.5">
      <div className="flex gap-1" aria-hidden="true">
        <span className="bg-muted-foreground/25 size-2 rounded-full" />
        <span className="bg-muted-foreground/25 size-2 rounded-full" />
        <span className="bg-muted-foreground/25 size-2 rounded-full" />
      </div>
      <span className="text-muted-foreground text-[11px] font-medium tracking-tight">{label}</span>
    </div>
  );
}
