/**
 * Rotary knob.
 *
 * A real potentiometer feel: 270° of travel, drag *vertically* to turn (the
 * convention every DAW settled on, because circular dragging is precise-
 * looking and useless), Shift for fine, wheel to nudge, arrows on the
 * keyboard, double-click to snap back to the model's default. The whole
 * face rotates so the knurl moves with it. Exposed as a slider to assistive
 * tech — a knob is a slider that happens to be round.
 */

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { decimals, quantize } from "./math";

const SWEEP = 270; // degrees of travel
const START = -135; // pointer at min

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** Value to return to on double-click. */
  defaultValue?: number;
  label: string;
  /** Rendered under the knob. Defaults to the value with `step` precision. */
  format?: (v: number) => string;
  size?: number;
  disabled?: boolean;
  /** Optional detent marks (in value units) drawn on the scale. */
  detents?: number[];
  /** Pixels of drag for a full sweep. Bigger = finer. */
  travelPx?: number;
  className?: string;
}

export function Knob({
  value,
  min,
  max,
  step,
  onChange,
  defaultValue,
  label,
  format,
  size = 56,
  disabled,
  detents,
  travelPx = 180,
  className,
}: KnobProps) {
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ y: number; start: number; fine: boolean } | null>(null);
  const range = Math.max(1e-9, max - min);
  const frac = Math.min(1, Math.max(0, (value - min) / range));
  const angle = START + frac * SWEEP;

  const emit = useCallback(
    (raw: number) => {
      const q = quantize(raw, min, max, step);
      if (q !== value) onChange(q);
    },
    [min, max, step, value, onChange],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { y: e.clientY, start: value, fine: e.shiftKey };
    setDragging(true);
    (e.currentTarget as HTMLElement).focus();
    e.preventDefault();
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dy = drag.current.y - e.clientY;
    const scale = (e.shiftKey || drag.current.fine ? 0.2 : 1) * (range / travelPx);
    emit(drag.current.start + dy * scale);
  };
  const end = () => {
    drag.current = null;
    setDragging(false);
  };

  /* Wheel: passive listeners can't preventDefault, so bind natively. */
  const ref = useRef<HTMLDivElement>(null);
  const emitRef = useRef(emit);
  emitRef.current = emit;
  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      const s = e.shiftKey ? step : Math.max(step, range / 50);
      emitRef.current(valueRef.current + dir * s);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [disabled, step, range]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const big = Math.max(step, range / 10);
    const map: Record<string, number> = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
      PageUp: big,
      PageDown: -big,
    };
    if (e.key in map) {
      e.preventDefault();
      emit(value + map[e.key] * (e.shiftKey ? 5 : 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      emit(min);
    } else if (e.key === "End") {
      e.preventDefault();
      emit(max);
    }
  };

  const shown = format ? format(value) : value.toFixed(decimals(step));

  // scale ticks: 11 across the sweep, majors at ends and centre
  const ticks = Array.from({ length: 11 }, (_, i) => START + (i / 10) * SWEEP);
  const r = size / 2;
  const tickR = r + 7;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: size + 20, height: size + 20 }}>
        {/* scale */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={size + 20}
          height={size + 20}
          viewBox={`0 0 ${size + 20} ${size + 20}`}
          aria-hidden="true"
        >
          {ticks.map((a, i) => {
            const rad = ((a - 90) * Math.PI) / 180;
            const major = i === 0 || i === 5 || i === 10;
            const inner = tickR - (major ? 4 : 2.5);
            const cx = r + 10;
            const cy = r + 10;
            return (
              <line
                key={i}
                x1={cx + Math.cos(rad) * inner}
                y1={cy + Math.sin(rad) * inner}
                x2={cx + Math.cos(rad) * tickR}
                y2={cy + Math.sin(rad) * tickR}
                stroke={major ? "var(--cx-engrave)" : "var(--cx-engrave-dim)"}
                strokeWidth={major ? 1.5 : 1}
                strokeLinecap="round"
              />
            );
          })}
          {/* lit arc from min to value */}
          <path
            d={arc(r + 10, r + 10, tickR - 1, START, angle)}
            fill="none"
            stroke="var(--cx-lamp)"
            strokeWidth={1.5}
            opacity={disabled ? 0.3 : 0.9}
            style={{ filter: "drop-shadow(0 0 2px var(--cx-lamp-glow))" }}
          />
          {detents?.map((d) => {
            const a = START + ((d - min) / range) * SWEEP;
            const rad = ((a - 90) * Math.PI) / 180;
            return (
              <circle
                key={d}
                cx={r + 10 + Math.cos(rad) * (tickR + 4)}
                cy={r + 10 + Math.sin(rad) * (tickR + 4)}
                r={1.5}
                fill="var(--cx-lamp)"
              />
            );
          })}
        </svg>
        <div
          ref={ref}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={shown}
          aria-disabled={disabled ? "true" : undefined}
          data-dragging={dragging ? "true" : undefined}
          className="cx-knob absolute"
          style={{ width: size, height: size, left: 10, top: 10 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={end}
          onPointerCancel={end}
          onDoubleClick={() => !disabled && defaultValue !== undefined && emit(defaultValue)}
          onKeyDown={onKeyDown}
          title={defaultValue !== undefined ? "Drag up/down · Shift for fine · double-click to reset" : "Drag up/down · Shift for fine"}
        >
          <div className="face" style={{ transform: `rotate(${angle}deg)` }}>
            <div className="pointer" />
          </div>
        </div>
      </div>
      <div className="cx-seg text-[11px]" data-dim={disabled ? "true" : undefined}>
        <span className="lit">{shown}</span>
      </div>
      <span className="cx-label">{label}</span>
    </div>
  );
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const s = ((a0 - 90) * Math.PI) / 180;
  const e = ((a1 - 90) * Math.PI) / 180;
  const x0 = cx + Math.cos(s) * r;
  const y0 = cy + Math.sin(s) * r;
  const x1 = cx + Math.cos(e) * r;
  const y1 = cy + Math.sin(e) * r;
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}
