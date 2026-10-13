/**
 * Licence is the single most consequential fact about a model you are about to
 * put in a commercial project, so it gets a colour-coded badge rather than a
 * line of small print.
 */

import { ExternalLinkIcon, ScaleIcon } from "lucide-react";
import type { LicenseInfo } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tone = { label: string; chip: string; panel: string };

const TONE: Record<LicenseInfo["commercial"], Tone> = {
  yes: {
    label: "Commercial OK",
    chip: "bg-emerald-500/12 text-emerald-700 ring-emerald-600/30 dark:text-emerald-300 dark:ring-emerald-400/30",
    panel: "bg-emerald-500/6 ring-emerald-600/20 dark:ring-emerald-400/20",
  },
  conditional: {
    label: "Commercial: conditional",
    chip: "bg-amber-500/12 text-amber-700 ring-amber-600/35 dark:text-amber-300 dark:ring-amber-400/35",
    panel: "bg-amber-500/6 ring-amber-600/20 dark:ring-amber-400/20",
  },
  no: {
    label: "Non-commercial only",
    chip: "bg-red-500/12 text-red-700 ring-red-600/30 dark:text-red-300 dark:ring-red-400/35",
    panel: "bg-red-500/6 ring-red-600/20 dark:ring-red-400/20",
  },
};

export function LicenseChip({
  license,
  className,
}: {
  license: LicenseInfo;
  className?: string;
}) {
  const tone = TONE[license.commercial];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tone.chip,
        className,
      )}
    >
      <ScaleIcon className="size-3 shrink-0" aria-hidden="true" />
      {tone.label}
    </span>
  );
}

export function LicensePanel({ license }: { license: LicenseInfo }) {
  const tone = TONE[license.commercial];
  return (
    <div className={cn("rounded-lg px-3 py-2.5 ring-1 ring-inset", tone.panel)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <LicenseChip license={license} />
        <span className="text-foreground text-sm font-medium">{license.name}</span>
        {license.url && (
          <a
            href={license.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded text-xs underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
          >
            Read the licence
            <ExternalLinkIcon className="size-3" aria-hidden="true" />
          </a>
        )}
      </div>
      {license.note && (
        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
          {license.note}
        </p>
      )}
    </div>
  );
}
