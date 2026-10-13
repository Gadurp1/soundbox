/** Shared value helpers for the console controls. */

export function decimals(step: number): number {
  if (step >= 1) return 0;
  return Math.min(4, Math.ceil(-Math.log10(step)));
}

export function quantize(v: number, min: number, max: number, step: number): number {
  const q = Math.round((v - min) / step) * step + min;
  const d = decimals(step);
  return Math.min(max, Math.max(min, Number(q.toFixed(d))));
}
