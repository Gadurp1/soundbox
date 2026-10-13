/**
 * Where a story's device racks live.
 *
 * Local, per story, in the same spirit as the console's patch slots: this is
 * front-panel state, not part of the story document. The server's `StoryTrack`
 * knows about name, mute, solo and gain because the export mixdown honours
 * those — it has no idea what a reverb is, so claiming these were saved
 * alongside the arrangement would be a promise the export cannot keep.
 *
 * That is the honest limitation to state out loud, and the rack does:
 * **devices are heard on the timeline, not baked into an export.** Making them
 * real on export means a second implementation of all seven in
 * `server/src/audio/dsp.ts`, which is a bigger job than the rack itself.
 */

import { useCallback, useSyncExternalStore } from "react";

import type { DeviceSpec, TrackDevices } from "@/lib/devices";

const KEY = "soundbox.story.devices.v1";

type Stored = Record<string, TrackDevices>;

const listeners = new Set<() => void>();
let cache: Stored | null = null;

function read(): Stored {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    cache = parsed && typeof parsed === "object" ? (parsed as Stored) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Stored): void {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota or private mode: the in-memory copy still works for the visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const EMPTY: TrackDevices = {};
/** No localStorage during SSR/prerender, and a fresh object each call would
 *  loop the store. One frozen empty snapshot for every such render. */
const NOTHING: Stored = {};

/** Drop a deleted story's racks, so storage does not keep chains for lanes
 *  that no longer exist anywhere. */
export function forgetStoryDevices(storyId: string): void {
  const current = read();
  if (!(storyId in current)) return;
  const next = { ...current };
  delete next[storyId];
  write(next);
}

export interface TrackDevicesApi {
  devices: TrackDevices;
  /** Replace one lane's chain. Passing an empty array drops the lane's entry
   *  entirely, so an emptied rack leaves nothing behind in storage. */
  setLane(lane: number, specs: DeviceSpec[]): void;
  /** A lane was removed: drop its rack and move every rack above it down
   *  one, the way the server closes the gap in the clips. Racks are keyed by
   *  lane index, so without this a reverb on lane 2 ended up processing what
   *  used to be lane 3. */
  removeLane(lane: number): void;
}

export function useTrackDevices(storyId: string): TrackDevicesApi {
  const all = useSyncExternalStore(subscribe, read, () => NOTHING);
  const devices = all[storyId] ?? EMPTY;

  const setLane = useCallback(
    (lane: number, specs: DeviceSpec[]) => {
      const current = read();
      const forStory = { ...(current[storyId] ?? {}) };
      if (specs.length === 0) delete forStory[lane];
      else forStory[lane] = specs;

      const next = { ...current };
      if (Object.keys(forStory).length === 0) delete next[storyId];
      else next[storyId] = forStory;
      write(next);
    },
    [storyId],
  );

  const removeLane = useCallback(
    (lane: number) => {
      const current = read();
      const before = current[storyId];
      if (!before) return;
      const forStory: TrackDevices = {};
      for (const [key, specs] of Object.entries(before)) {
        const index = Number(key);
        if (index === lane) continue;
        forStory[index > lane ? index - 1 : index] = specs;
      }
      const next = { ...current };
      if (Object.keys(forStory).length === 0) delete next[storyId];
      else next[storyId] = forStory;
      write(next);
    },
    [storyId],
  );

  return { devices, setLane, removeLane };
}
