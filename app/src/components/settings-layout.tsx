/**
 * The Settings page's chrome: a centred column with a sticky section nav.
 *
 * Why a nav at all — the page had grown to nine cards on one scroll, which is
 * the point where "where was the artwork setting?" stops having an answer you
 * can see. Two shapes were on the table:
 *
 *   - Apple System Settings: a permanent sidebar, one pane per item, nothing
 *     but the selected pane visible.
 *   - Vercel: grouped sections on one scrolling page, with a sub-nav that
 *     jumps and tracks position.
 *
 * This is the Vercel one, because of what these settings are. Apple's model
 * assumes panes are independent and each is substantial; here half the sections
 * are three controls, and the ones people set together (compute device, the
 * prompt assistant, artwork — everything that competes for the same VRAM) are
 * *related*, so hiding four of them to show one costs more than it saves. One
 * scroll also keeps Ctrl-F working and keeps a single URL, which matters for a
 * page people are told to visit in docs.
 *
 * The nav collapses below `lg` rather than turning into a drawer: on a narrow
 * window the section headings are already visible while scrolling, and a
 * drawer for four links is chrome for chrome's sake.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionMeta {
  id: string;
  title: string;
}

export function SettingsLayout({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<SectionMeta[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // The nav is built from what the content actually rendered, read back out of
  // the DOM, rather than from a hand-kept list of section ids living in this
  // file: that list goes stale the first time somebody adds a card, and a nav
  // item pointing at a section that no longer exists is worse than no nav.
  useEffect(() => {
    const found = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>("[data-settings-section]") ?? [],
    ).map((el) => ({ id: el.id, title: el.dataset.settingsSection ?? el.id }));
    setSections(found);
  }, [children]);

  /**
   * Highlight the section the reader is actually in.
   *
   * The band is the top of the viewport rather than the whole of it: a section
   * counts as current when it is near the top, not when any part of it is
   * visible, or every scroll position with two sections on screen would light
   * up two nav items. Where the band still catches two, the topmost wins.
   *
   * The bottom edge is -60% rather than something tighter so the final section
   * can become current at all: the page bottoms out with it partway down the
   * viewport, and a narrower band would leave the nav stuck on the section
   * above it however far you scroll.
   */
  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 },
    );
    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="mx-auto flex w-full max-w-4xl justify-center gap-10">
      <nav aria-label="Settings sections" className="hidden w-40 shrink-0 lg:block">
        <div className="sticky top-20 space-y-1">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => {
                // Handled here rather than left to the browser: this app is on
                // a hash router, so a bare `#id` href would be read as a route
                // change and navigate away from Settings entirely.
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                setActive(section.id);
              }}
              className={cn(
                "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active === section.id
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              aria-current={active === section.id ? "true" : undefined}
            >
              {section.title}
            </a>
          ))}
        </div>
      </nav>

      <div ref={contentRef} className="w-full min-w-0 max-w-2xl space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Stored locally alongside your sounds. Nothing leaves this machine.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * One titled group of cards.
 *
 * `scroll-mt` keeps the heading clear of the sticky app header when the nav
 * jumps to it — without it the thing you clicked lands underneath the bar.
 */
export function SettingsSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-settings-section={title}
      className="scroll-mt-20 space-y-3"
      aria-labelledby={`${id}-heading`}
    >
      <h2
        id={`${id}-heading`}
        className="text-muted-foreground label-caps"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
