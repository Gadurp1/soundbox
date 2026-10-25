/** Small status pill shared by the model picker and the Models screen. */

import type { ModelStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const LABEL: Record<ModelStatus, string> = {
  not_installed: "Not installed",
  // Weights downloaded, runtime missing. Saying "Installed" here is what sends
  // someone to Generate only to be told to run pip.
  needs_runtime: "Runtime missing",
  installed: "Installed",
  downloading: "Downloading",
  loaded: "Loaded",
  incomplete: "Incomplete",
  error: "Error",
};

/** LED colours, from the shared signal set: green is ready, amber needs
 *  something, red failed, and teal — the brand's own signal — is the one
 *  model actually resident and live. An unlit lens for "not here". */
const DOT: Record<ModelStatus, string> = {
  not_installed: "",
  needs_runtime: "text-warn",
  installed: "text-ok",
  downloading: "text-warn",
  loaded: "text-signal",
  incomplete: "text-warn",
  error: "text-danger",
};

export function ModelStatusPill({
  status,
  className,
}: {
  status: ModelStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center gap-1.5 text-xs whitespace-nowrap",
        className,
      )}
    >
      <span
        className={cn("sb-led size-1.5", DOT[status])}
        data-off={status === "not_installed" || undefined}
        data-live={status === "downloading" || status === "loaded" || undefined}
        aria-hidden="true"
      />
      {LABEL[status]}
    </span>
  );
}

export function modelStatusLabel(status: ModelStatus): string {
  return LABEL[status];
}
