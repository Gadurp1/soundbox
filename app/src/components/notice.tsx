/** Amber/red advisory box — calm inline notices for model status problems.
 *  Shared by the Models screen and the Generate composer so the same
 *  tone/pattern is used everywhere an model isn't ready. */

import { cn } from "@/lib/utils";

export function Notice({
  tone = "amber",
  className,
  children,
}: {
  tone?: "amber" | "red";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-xs ring-1 ring-inset",
        tone === "amber"
          ? "bg-warn/10 ring-warn/30"
          : "bg-danger/10 ring-danger/30",
        className,
      )}
    >
      {children}
    </div>
  );
}
