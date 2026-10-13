/**
 * A stem's instrument as a tinted square tile.
 *
 * Split from `lib/instrument-icons.ts` so that module can export the lookup
 * without also exporting a component — a file that exports both breaks fast
 * refresh, which oxlint flags.
 *
 * A tile rather than a bare glyph because it sits in a row beside cover art
 * and waveforms: at that size an untinted 16px icon disappears, and the point
 * of it is to make a stem list scannable at a glance.
 */

import { instrumentIcon } from "@/lib/instrument-icons";

export function InstrumentBadge({
  stemName,
  className,
  iconClassName,
}: {
  stemName: string;
  className?: string;
  iconClassName?: string;
}) {
  const { Icon, label } = instrumentIcon(stemName);
  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      className={
        "bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-md " +
        (className ?? "size-8")
      }
    >
      <Icon className={iconClassName ?? "size-4"} aria-hidden="true" />
    </span>
  );
}
