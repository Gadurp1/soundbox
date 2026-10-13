/**
 * Vertical fader. Same contract as Knob (min/max/step/onChange, slider role,
 * keyboard, wheel, double-click reset) with a linear throw. Used for the one
 * parameter that *feels* linear — duration — and reads better as a length
 * you push up than a dial you twist.
 */

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { quantize } from "./math";

interface FaderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  defaultValue?: number;
  label: string;
  format?: (v: number) => string;
  height?: number;
  disabled?: boolean;
  /** Labelled tick marks in value units. */
  marks?: number[];
  markFormat?: (v: number) => string;
  className?: string;
}

export function Fader({
  value,
  min,
  max,
  step,
  onChange,
  defaultValue,
  label,
  format,
  height = 160,
  disabled,
  marks,
  markFormat,
  className,
}: FaderProps) {
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const range = Math.max(1e-9, max - min);
  const frac = Math.min(1, Math.max(0, (value - min) / range));

  const emit = useCallback(
    (raw: number) => {
      const q = quantize(raw, min, max, step);
      if (q !== value) onChange(q);
    },
    [min, max, step, value, onChange],
  );

  const fromPointer = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const f = 1 - (clientY - rect.top) / rect.height;
    emit(min + Math.min(1, Math.max(0, f)) * range);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    (e.currentTarget as HTMLElement).focus();
    fromPointer(e.clientY);
    e.preventDefault();
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    fromPointer(e.clientY);
  };
  const end = () => setDragging(false);

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
      const s = e.shiftKey ? step : Math.max(step, range / 40);
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

  const shown = format ? format(value) : String(value);
  const ticks = 21;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="cx-seg text-[11px]" data-dim={disabled ? "true" : undefined}>
        <span className="lit">{shown}</span>
      </div>
      <div
        ref={ref}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={shown}
        aria-disabled={disabled ? "true" : undefined}
        data-dragging={dragging ? "true" : undefined}
        className="cx-fader"
        style={{ height, width: 72 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onDoubleClick={() => !disabled && defaultValue !== undefined && emit(defaultValue)}
        onKeyDown={onKeyDown}
        title={defaultValue !== undefined ? "Drag · double-click to reset" : "Drag"}
      >
        {/* ticks on both sides */}
        {Array.from({ length: ticks }, (_, i) => {
          const major = i % 5 === 0;
          const top = `${(i / (ticks - 1)) * 100}%`;
          const w = major ? 10 : 6;
          return (
            <span key={i}>
              <span className={cn("tick", major && "major")} style={{ top, left: 36 - 3 - w - 4, width: w }} />
              <span className={cn("tick", major && "major")} style={{ top, left: 36 + 3 + 4, width: w }} />
            </span>
          );
        })}
        {marks?.map((m) => {
          const f = 1 - (m - min) / range;
          return (
            <span
              key={m}
              className="cx-label absolute right-0 -translate-y-1/2 text-[8px]!"
              style={{ top: `${f * 100}%`, color: "var(--cx-engrave-dim)" }}
            >
              {markFormat ? markFormat(m) : m}
            </span>
          );
        })}
        <div ref={trackRef} className="slot" />
        <div className="fill" style={{ height: `${frac * 100}%` }} />
        <div className="cap" style={{ top: `${(1 - frac) * 100}%` }} />
      </div>
      <span className="cx-label">{label}</span>
    </div>
  );
}
