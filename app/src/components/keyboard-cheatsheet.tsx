/**
 * The keyboard cheatsheet: `?` anywhere outside a text field. One dialog,
 * grouped by where the keys work, so the studio's panel chords are listed
 * next to the app-wide ones instead of being discoverable only by reading
 * the Panels menu.
 *
 * The list is hand-kept. The bindings themselves live where they are
 * handled (`app-command-palette`, `ui/sidebar`, `use-generate-session`,
 * `routes/studio`, `story-timeline`); this is the one place they are all
 * written down for a person.
 */

import { useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keys } from "@/components/ui/kbd";

interface Shortcut {
  keys: string[];
  does: string;
}

const GROUPS: { title: string; where?: string; items: Shortcut[] }[] = [
  {
    title: "Everywhere",
    items: [
      { keys: ["mod", "K"], does: "Open the command palette" },
      { keys: ["mod", "B"], does: "Show or hide the sidebar" },
      { keys: ["?"], does: "Show this sheet" },
      { keys: ["Esc"], does: "Close a dialog or panel" },
    ],
  },
  {
    title: "Composer",
    where: "SFX, Text to Speech, Console",
    items: [{ keys: ["mod", "Enter"], does: "Generate, or speak, what is in the box" }],
  },
  {
    title: "Studio",
    where: "Script Builder and Music Builder",
    items: [
      { keys: ["Space"], does: "Play or pause the timeline" },
      { keys: ["mod", "K"], does: "The studio's own palette: panels and actions" },
      { keys: ["mod", "T"], does: "Chat panel" },
      { keys: ["mod", "R"], does: "Script panel (Script Builder)" },
      { keys: ["mod", "P"], does: "Prompt panel" },
      { keys: ["mod", "B"], does: "Library panel" },
      { keys: ["mod", "I"], does: "History panel" },
      { keys: ["mod", "E"], does: "Sample panel" },
      { keys: ["mod", "F"], does: "Devices panel" },
      { keys: ["mod", "N"], does: "MIDI panel" },
      { keys: ["mod", "O"], does: "Piano roll" },
      { keys: ["mod", "G"], does: "Logs panel" },
      { keys: ["mod", "L"], does: "Timeline" },
      { keys: ["Alt", "drag"], does: "Move a clip without snapping" },
    ],
  },
];

/** True when the key press happened somewhere typing is expected, so a `?`
 *  in a prompt stays a `?`. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function KeyboardCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // `key` is "?" on most layouts; `code` catches the ones where Shift
      // and the slash key do not report it that way.
      const isQuestion = event.key === "?" || (event.code === "Slash" && event.shiftKey);
      if (!isQuestion || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      onOpenChange(!open);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press <Keys keys={["?"]} /> anywhere outside a text box to open this.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="text-foreground text-xs font-semibold tracking-tight">
                {group.title}
                {group.where && (
                  <span className="text-muted-foreground ml-1.5 font-normal">{group.where}</span>
                )}
              </h3>
              <dl className="mt-2 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1.5">
                {group.items.map((item) => (
                  <div key={item.does} className="contents">
                    <dt className="justify-self-end">
                      <Keys keys={item.keys} />
                    </dt>
                    <dd className="text-muted-foreground text-sm">{item.does}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
