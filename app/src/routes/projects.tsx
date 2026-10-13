/** Projects — every project, as a list, with the sidebar's create/delete moved in here too. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderIcon, FolderPlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectThumb } from "@/components/project-thumb";

import { SearchInput } from "@/components/search-input";
import { useCreateProject, useDeleteProject, useProjects } from "@/lib/queries";
import type { Project } from "@/lib/api";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projects, isLoading, isError, error } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [query, setQuery] = useState("");

  // Client-side: the whole list is already here (there is no paged projects
  // endpoint), so a round trip per keystroke would buy nothing.
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? (projects ?? []).filter((p) => p.name.toLowerCase().includes(needle))
    : (projects ?? []);

  const commitCreate = () => {
    const name = draftName.trim();
    setCreating(false);
    setDraftName("");
    if (!name) return;
    createProject.mutate(name);
  };

  const open = (project: Project) => navigate(`/library?project=${encodeURIComponent(project.id)}`);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            {projects ? `${projects.length} project${projects.length === 1 ? "" : "s"}` : " "}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <FolderPlusIcon />
          New project
        </Button>
      </div>

      {/* Only once there are enough to be worth filtering — a search box over
          three projects is chrome. */}
      {(projects?.length ?? 0) > 5 && (
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search projects…"
          className="max-w-sm"
        />
      )}

      {creating && (
        <Input
          autoFocus
          value={draftName}
          placeholder="Project name"
          aria-label="New project name"
          className="max-w-sm"
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitCreate}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitCreate();
            if (e.key === "Escape") {
              setDraftName("");
              setCreating(false);
            }
          }}
        />
      )}

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="border-border rounded-xl border border-dashed px-6 py-10 text-center">
          <p className="text-sm font-medium">Could not load projects</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      ) : !shown.length ? (
        <div className="border-border/70 text-muted-foreground animate-in fade-in-0 flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-16 text-center duration-300">
          <div className="bg-muted flex size-11 items-center justify-center rounded-full">
            <FolderIcon className="text-muted-foreground/70 size-5" aria-hidden="true" />
          </div>
          <p className="text-foreground text-sm font-medium">
            {needle ? "No projects match that" : "No projects yet"}
          </p>
          <p className="max-w-xs text-sm">
            {needle
              ? "Try a different name, or clear the search."
              : "Projects group sounds and sessions together — create one to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {shown.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => open(p)}
              className="group border-border/70 bg-card hover:border-border hover:bg-accent/40 animate-in fade-in-0 slide-in-from-bottom-1 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left duration-300 fill-mode-both"
              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="ring-foreground/10 size-11 shrink-0 overflow-hidden rounded-lg ring-1">
                  <ProjectThumb name={p.name} className="size-full" />
                </div>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {p.sound_count} sound{p.sound_count === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete project ${p.name}`}
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDelete(p);
                }}
              >
                <Trash2Icon />
              </Button>
            </button>
          ))}
        </div>
      )}

      <Dialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this project?</DialogTitle>
            <DialogDescription>
              {pendingDelete && (
                <>
                  &ldquo;{pendingDelete.name}&rdquo; will be removed. The {pendingDelete.sound_count}{" "}
                  sound{pendingDelete.sound_count === 1 ? "" : "s"} in it stay in the library, just
                  unfiled.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteProject.isPending}
              onClick={() => {
                if (!pendingDelete) return;
                deleteProject.mutate(pendingDelete.id, {
                  onSuccess: () => setPendingDelete(null),
                });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
