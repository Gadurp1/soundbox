/**
 * A key, as a keycap. `Keys` lays a combination out as caps with a thin
 * "+" between them, so "Ctrl K" reads as one chord rather than two words.
 * The modifier is named for the platform once, here, instead of in every
 * hint string.
 */

import { MOD } from "@/lib/platform";
import { cn } from "@/lib/utils";

export function Kbd({ className, children, ...rest }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "bg-muted text-muted-foreground ring-border/70 inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 font-mono text-[10px] font-medium ring-1 ring-inset",
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
}

/** A chord: `["Ctrl", "K"]` renders two caps with a "+" between. "mod" is
 *  replaced by the platform's modifier. */
export function Keys({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((k, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {i > 0 && (
            <span className="text-muted-foreground/70 text-[10px]" aria-hidden="true">
              +
            </span>
          )}
          <Kbd>{k === "mod" ? MOD : k}</Kbd>
        </span>
      ))}
    </span>
  );
}
