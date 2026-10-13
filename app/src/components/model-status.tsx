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
  error: "Error",
};

const DOT: Record<ModelStatus, string> = {
  not_installed: "bg-muted-foreground/50",
  needs_runtime: "bg-amber-500",
  installed: "bg-sky-500",
  downloading: "bg-amber-500 animate-pulse",
  loaded: "bg-emerald-500",
  error: "bg-red-500",
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
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT[status])} aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}

export function modelStatusLabel(status: ModelStatus): string {
  return LABEL[status];
}
