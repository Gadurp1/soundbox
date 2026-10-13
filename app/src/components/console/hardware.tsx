/**
 * The small hardware vocabulary: panels with screws, LEDs, seven-segment
 * readouts, rocker switches, lamp push-buttons, a VU meter. Dumb and visual;
 * the console page composes them.
 */

import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ panel */

export function Panel({
  title,
  children,
  className,
  bodyClassName,
  aside,
  style,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Right-aligned content on the title bar (LEDs, a readout). */
  aside?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section className={cn("cx-panel min-w-0", className)} style={style} aria-label={title}>
      <span className="cx-screw" style={{ left: 6, top: 6, ["--rot" as string]: "20deg" }} />
      <span className="cx-screw" style={{ right: 6, top: 6, ["--rot" as string]: "-35deg" }} />
      <span className="cx-screw" style={{ left: 6, bottom: 6, ["--rot" as string]: "70deg" }} />
      <span className="cx-screw" style={{ right: 6, bottom: 6, ["--rot" as string]: "5deg" }} />
      {(title || aside) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-3">
          {title ? <h2 className="cx-title shrink-0">{title}</h2> : <span />}
          {aside ? <div className="flex min-w-0 items-center justify-end truncate">{aside}</div> : null}
        </header>
      )}
      <div className={cn("relative px-5 pt-3 pb-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------- led */

export function Led({
  on,
  color,
  blink,
  label,
  className,
}: {
  on: boolean;
  color?: "amber" | "green" | "red";
  blink?: boolean;
  label?: string;
  className?: string;
}) {
  const dot = (
    <span
      className={cn("cx-led shrink-0", className)}
      data-on={on ? "true" : "false"}
      data-color={color}
      data-blink={blink ? "true" : undefined}
      aria-hidden="true"
    />
  );
  if (!label) return dot;
  return (
    <span className="inline-flex items-center gap-1.5">
      {dot}
      <span className="cx-label" style={{ color: on ? "var(--cx-engrave)" : "var(--cx-engrave-dim)" }}>
        {label}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------- readout */

/** Seven-segment style readout. `digits` sets the ghost width. */
export function Seg({
  value,
  digits = 6,
  size = "md",
  dim,
  className,
  align = "right",
}: {
  value: string;
  digits?: number;
  size?: "sm" | "md" | "lg";
  dim?: boolean;
  className?: string;
  align?: "left" | "right";
}) {
  const ghost = "8".repeat(Math.max(digits, value.length));
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-[11px]" : "text-sm";
  return (
    <span
      className={cn("cx-seg inline-block", text, className)}
      data-dim={dim ? "true" : undefined}
      style={{ textAlign: align, minWidth: `${ghost.length + 1.2}ch` }}
    >
      <span className="ghost" aria-hidden="true">
        {ghost}
      </span>
      <span className="lit">{value}</span>
    </span>
  );
}

/* --------------------------------------------------------------- rocker */

export function Rocker({
  checked,
  onChange,
  label,
  disabled,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className="cx-rocker"
        onClick={() => onChange(!checked)}
        title={hint}
      />
      <span className="cx-label">{label}</span>
    </label>
  );
}

/* ----------------------------------------------------------- push button */

export function PushButton({
  pressed,
  lamp,
  lampColor,
  onClick,
  children,
  disabled,
  title,
  className,
}: {
  pressed?: boolean;
  /** Lamp state, independent of pressed (loaded model = lit). */
  lamp?: boolean;
  lampColor?: "amber" | "green" | "red";
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn("cx-push", className)}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <Led on={Boolean(lamp)} color={lampColor} />
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

/* --------------------------------------------------------------- meter */

/** A VU meter face. `value` 0..1 swings the needle -45°..+45°. */
export function Meter({
  value,
  label,
  className,
  peak,
}: {
  value: number;
  label?: string;
  className?: string;
  /** Lights the red zone marker. */
  peak?: boolean;
}) {
  const v = Math.min(1, Math.max(0, value));
  const deg = -45 + v * 90;
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="cx-meter" style={{ width: 150, height: 78 }} role="img" aria-label={label ? `${label}: ${Math.round(v * 100)}%` : undefined}>
        <svg viewBox="0 0 150 78" width="150" height="78" className="absolute inset-0" aria-hidden="true">
          {/* scale arc */}
          <path d="M 22 66 A 60 60 0 0 1 128 66" fill="none" stroke="oklch(0.2 0.02 30)" strokeWidth="1.5" />
          {/* red zone */}
          <path
            d="M 108 39 A 60 60 0 0 1 128 66"
            fill="none"
            stroke={peak ? "var(--cx-red)" : "oklch(0.55 0.18 25 / 60%)"}
            strokeWidth="3"
          />
          {Array.from({ length: 11 }, (_, i) => {
            const a = ((-45 + i * 9 - 90) * Math.PI) / 180;
            const major = i % 5 === 0;
            const r0 = 60;
            const r1 = major ? 52 : 55;
            return (
              <line
                key={i}
                x1={75 + Math.cos(a) * r0}
                y1={72 + Math.sin(a) * r0}
                x2={75 + Math.cos(a) * r1}
                y2={72 + Math.sin(a) * r1}
                stroke="oklch(0.2 0.02 30)"
                strokeWidth={major ? 1.5 : 1}
              />
            );
          })}
          <text x="24" y="60" fontSize="7" fontFamily="var(--cx-mono)" fill="oklch(0.25 0.02 30)">
            0
          </text>
          <text x="71" y="20" fontSize="7" fontFamily="var(--cx-mono)" fill="oklch(0.25 0.02 30)">
            50
          </text>
          <text x="117" y="60" fontSize="7" fontFamily="var(--cx-mono)" fill="oklch(0.25 0.02 30)">
            100
          </text>
          <text
            x="75"
            y="40"
            fontSize="8"
            fontFamily="var(--cx-mono)"
            fill="oklch(0.3 0.02 30)"
            textAnchor="middle"
            letterSpacing="2"
          >
            VU
          </text>
        </svg>
        <div className="needle" style={{ transform: `rotate(${deg}deg)` }} />
        <div className="pivot" />
        <div className="glass" />
      </div>
      {label && <span className="cx-label">{label}</span>}
    </div>
  );
}

/* --------------------------------------------------------- selector row */

/** A row of small push buttons for a discrete choice (takes, presets). */
export function SelectorRow<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled,
  render,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  disabled?: boolean;
  render?: (v: T) => ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5" role="radiogroup" aria-label={label}>
      <div className="flex gap-1">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={String(o)}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(o)}
              className={cn(
                "cx-push flex-col! items-center! gap-1! px-2! py-1.5! min-h-0! w-9!",
              )}
              aria-pressed={active}
            >
              <Led on={active} />
              <span className="cx-label" style={{ letterSpacing: 0 }}>
                {render ? render(o) : String(o)}
              </span>
            </button>
          );
        })}
      </div>
      <span className="cx-label">{label}</span>
    </div>
  );
}
