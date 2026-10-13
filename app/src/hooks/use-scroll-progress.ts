/**
 * Turns "how far has the user scrolled through this element" into a number
 * from 0 to 1 — the primitive the marketing site's scroll-reveal sections
 * (`components/scroll-stage.tsx` and everything built on it) are driven by.
 *
 * Deliberately not `IntersectionObserver`. That answers "is it visible" in
 * discrete steps, which is right for the docs sidebar's scroll-spy
 * (`site/src/docs/shell.tsx`) but wrong here: a reveal that advances a clip at
 * a time needs a continuous value tracking exactly where the pointer is
 * inside the element, not a handful of visibility thresholds. So this is a
 * scroll listener, throttled to one measurement per frame with `rAF` — cheap
 * enough (one `getBoundingClientRect` call) that a plain listener beats the
 * complexity of trying to make an observer do a scrollbar's job.
 *
 * No `prefers-reduced-motion` branch: unlike an autoplaying animation, this
 * motion is the user's own scrolling being reflected back at them, not
 * something the page started on its own. Suppressing it would mean a
 * reduced-motion visitor scrolls past a section that never changes at all,
 * which is a worse experience than the plain content it decorates deserves.
 * What *does* have to respect reduced motion is any transition an element
 * built on top of this applies — see `components/reveal-*` for how those
 * guard themselves.
 */

import { useEffect, useRef, useState } from "react";

/** 0 while the element's top has not yet reached the top of the viewport, 1
 *  once its bottom has reached the bottom — so the element's own height is
 *  what sets how much scrolling "using" it costs, same as any content. */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = rect.height - viewport;
      // An element shorter than the viewport has no scroll range to measure
      // against; it is simply "not yet" or "past", based on which side of the
      // viewport its top has crossed.
      const raw = total > 0 ? -rect.top / total : rect.top <= 0 ? 1 : 0;
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { ref, progress };
}
