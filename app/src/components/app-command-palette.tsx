/**
 * The app-wide palette: ⌘K anywhere in the shell.
 *
 * Two kinds of command, because they are the two things you do that are not
 * about the page you are on — switch which library is open, and go to a
 * different page. Anything that acts on the open document belongs to that
 * page's own palette instead.
 *
 * The list component is `command-palette.tsx`, which knows how to choose a
 * command and nothing about what any of them do.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { CommandPalette, type Command } from "@/components/command-palette";
import { NewStudioDialog } from "@/components/new-studio-dialog";
import { ProfileManagerDialog } from "@/components/profile-manager";
import { useActivateProfile, useProfiles } from "@/lib/queries";
import type { Profile } from "@/lib/api";

/** Whether this looks like a Mac, for naming the modifier only — the handler
 *  tests `metaKey || ctrlKey` regardless. */
const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const NO_PROFILES: Profile[] = [];

const PAGES: { label: string; to: string }[] = [
  { label: "Go to Dashboard", to: "/dashboard" },
  { label: "Go to Generate", to: "/chat" },
  { label: "Go to Console", to: "/console" },
  { label: "Go to Library", to: "/library" },
  { label: "Go to SFX", to: "/library/sfx" },
  { label: "Go to Music", to: "/library/music" },
  { label: "Go to Text to Speech", to: "/library/speech" },
  { label: "Go to Studio", to: "/studio" },
  { label: "Go to Voice Lab", to: "/voice/lab" },
  { label: "Go to Projects", to: "/projects" },
  { label: "Go to Models", to: "/models" },
  { label: "Go to Agents", to: "/agents" },
  { label: "Go to Activity", to: "/activity" },
  { label: "Go to Settings", to: "/settings" },
];

/**
 * Both builders have a palette of their own, over a page with eight
 * toggleable panels, and they took ⌘K first. Two palettes on one key would
 * open together, so this one stands down while a builder is in front — the
 * header chip is still there for switching profile, which is the part you
 * would miss.
 */
function pageOwnsTheKey(pathname: string): boolean {
  return pathname.startsWith("/studio/");
}

export function AppCommandPalette() {
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data } = useProfiles();
  const activate = useActivateProfile();
  // A stable empty array, so the memo below is not rebuilt on every render
  // before the first fetch lands.
  const profiles = data?.profiles ?? NO_PROFILES;
  const standDown = pageOwnsTheKey(pathname);

  useEffect(() => {
    if (standDown) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key.toLowerCase() !== "k") return;
      // Firefox and Chrome both give ⌘K to the address bar otherwise.
      event.preventDefault();
      setOpen((current) => !current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [standDown]);

  const commands = useMemo<Command[]>(() => {
    // Profiles first: it is the one command here with a consequence, and the
    // list is short. A single-profile install shows nothing but "New profile…",
    // which is also how you find out the feature exists.
    const switching: Command[] = profiles.map((profile) => ({
      id: `profile:${profile.id}`,
      label: `Open ${profile.name}`,
      active: profile.active,
      // Shown and refused rather than hidden — a missing row reads as a bug
      // where a checked one reads as an answer.
      disabled: profile.active || activate.isPending,
      run: () => activate.mutate(profile.id),
    }));
    return [
      ...switching,
      { id: "profile:new", label: "New profile…", run: () => setManageOpen(true) },
      // The same door as the sidebar's and the dashboard's: which builder
      // this is for is a question, not an assumption.
      { id: "studio:new", label: "New sound…", run: () => setPickerOpen(true) },
      ...PAGES.map((page) => ({
        id: `go:${page.to}`,
        label: page.label,
        active: pathname === page.to,
        run: () => navigate(page.to),
      })),
    ];
  }, [profiles, activate, pathname, navigate]);

  return (
    <>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={commands}
        placeholder={`Switch profile, jump to a page…  (${IS_MAC ? "⌘" : "Ctrl+"}K)`}
      />
      <ProfileManagerDialog open={manageOpen} onOpenChange={setManageOpen} profiles={profiles} />
      <NewStudioDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}
