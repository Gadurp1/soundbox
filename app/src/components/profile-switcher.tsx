/**
 * The profile chip in the header: which library is open, and how to change it.
 *
 * A profile is a whole data directory — its own sounds, stories, voices and
 * settings — so switching is closer to opening a different document than to
 * flipping a setting. The chip is in the header rather than buried in Settings
 * for that reason: it is state you want to be able to see before you generate
 * into the wrong library, not a preference you set once.
 *
 * Creating and switching are deliberately separate. "New profile" makes an
 * empty one and leaves you where you are; you switch to it when you mean to.
 */

import { useState } from "react";
import { Check, FolderOpen, Loader2, Plus } from "lucide-react";

import { ProfileManagerDialog } from "@/components/profile-manager";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActivateProfile, useProfiles } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function ProfileSwitcher() {
  const { data } = useProfiles();
  const activate = useActivateProfile();
  const [manageOpen, setManageOpen] = useState(false);

  const profiles = data?.profiles ?? [];
  const active = profiles.find((p) => p.active);
  // Before the first fetch lands there is nothing honest to name, and a chip
  // that flickers from a guess to the real name is worse than one that arrives.
  if (!active) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2"
            aria-label={`Profile: ${active.name}`}
          >
            {activate.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FolderOpen className="size-3.5" />
            )}
            <span className="max-w-32 truncate text-xs font-medium">{active.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
            Library
          </DropdownMenuLabel>
          {profiles.map((profile) => (
            <DropdownMenuItem
              key={profile.id}
              disabled={activate.isPending}
              onSelect={() => {
                if (!profile.active) activate.mutate(profile.id);
              }}
            >
              <Check className={cn("size-4", !profile.active && "invisible")} />
              <span className="truncate">{profile.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setManageOpen(true)}>
            <Plus className="size-4" />
            New profile…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileManagerDialog open={manageOpen} onOpenChange={setManageOpen} profiles={profiles} />
    </>
  );
}
