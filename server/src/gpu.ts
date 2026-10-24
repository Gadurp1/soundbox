/**
 * GPU name and VRAM for `/api/health`.
 *
 * Inference runs inside audio.cpp, so there is no torch here to ask. On NVIDIA
 * hardware `nvidia-smi` already knows the answer, and it is the same tool
 * `audiocppBinary.detectBackend()` probes to pick the CUDA build, so a box
 * that reports `device: "cuda"` can also report what that device is. Other
 * vendors (Metal, Vulkan on AMD/Intel) leave the fields null rather than
 * guess.
 */

import { execFile } from "node:child_process";

export interface GpuInfo {
  index: number;
  uuid: string;
  name: string;
  vram_total_mb: number;
  vram_free_mb: number;
}

// The UI polls health every few seconds; a fresh process per poll is wasteful,
// but free VRAM moves when a model loads, so the cache stays short.
const TTL_MS = 3_000;
const TIMEOUT_MS = 5_000;

let cached: { at: number; gpus: GpuInfo[] } | null = null;
let inflight: Promise<GpuInfo[]> | null = null;

/** Parse `nvidia-smi --query-gpu=index,uuid,name,memory.total,memory.free
 *  --format=csv,noheader,nounits`. Rows that do not parse (e.g. "[N/A]"
 *  memory on some vGPU setups) are dropped rather than reported as zero. */
export function parseNvidiaSmi(stdout: string): GpuInfo[] {
  const gpus: GpuInfo[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    // The name can in principle contain a comma; it sits between two fixed
    // fields on each side, so take those from the ends.
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 5) continue;
    const index = Number(parts[0]);
    const uuid = parts[1];
    const free = Number(parts[parts.length - 1]);
    const total = Number(parts[parts.length - 2]);
    const name = parts.slice(2, parts.length - 2).join(", ");
    if (!Number.isInteger(index) || !Number.isFinite(total) || !Number.isFinite(free)) continue;
    gpus.push({ index, uuid, name, vram_total_mb: total, vram_free_mb: free });
  }
  return gpus;
}

/**
 * The GPU audio.cpp will run on: the first entry of CUDA_VISIBLE_DEVICES when
 * it is set (by index or by UUID, the two forms CUDA accepts), else GPU 0.
 */
export function pickGpu(gpus: GpuInfo[], visible = process.env.CUDA_VISIBLE_DEVICES): GpuInfo | null {
  if (gpus.length === 0) return null;
  const first = (visible ?? "").split(",")[0]?.trim();
  if (first) {
    const byIndex = /^\d+$/.test(first) ? gpus.find((g) => g.index === Number(first)) : undefined;
    const byUuid = gpus.find((g) => g.uuid === first || g.uuid.startsWith(first));
    const chosen = byIndex ?? byUuid;
    if (chosen) return chosen;
  }
  return gpus.find((g) => g.index === 0) ?? gpus[0];
}

function runNvidiaSmi(): Promise<GpuInfo[]> {
  return new Promise((resolve) => {
    execFile(
      "nvidia-smi",
      [
        "--query-gpu=index,uuid,name,memory.total,memory.free",
        "--format=csv,noheader,nounits",
      ],
      { timeout: TIMEOUT_MS, windowsHide: true },
      (err, stdout) => resolve(err ? [] : parseNvidiaSmi(String(stdout))),
    );
  });
}

/** Every NVIDIA GPU on the host, or `[]` without nvidia-smi. Never throws. */
export async function listGpus(): Promise<GpuInfo[]> {
  if (process.platform === "darwin") return [];
  if (cached && Date.now() - cached.at < TTL_MS) return cached.gpus;
  inflight ??= runNvidiaSmi().then((gpus) => {
    cached = { at: Date.now(), gpus };
    inflight = null;
    return gpus;
  });
  return inflight;
}
