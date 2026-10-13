/**
 * The wait-word itself: one invented gerund and an ellipsis.
 *
 * Hidden from the accessibility tree — a rotating joke is not a status. The
 * parent keeps `aria-busy` and a real label ("Generating", "Splitting").
 */

import { useLoadingVerb } from "@/lib/loading-verbs";
import { cn } from "@/lib/utils";

export function LoadingVerb({
  active = true,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  const verb = useLoadingVerb(active);
  return (
    <span className={cn(className)} aria-hidden="true">
      {verb}…
    </span>
  );
}
