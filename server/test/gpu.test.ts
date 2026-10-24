import { describe, expect, it } from "vitest";

import { parseNvidiaSmi, pickGpu } from "../src/gpu.js";

// The two-GPU box from issue #17.
const TWO_GPUS = [
  "0, GPU-aaaa1111-0000-0000-0000-000000000000, NVIDIA GeForce RTX 3080, 10240, 9800",
  "1, GPU-bbbb2222-0000-0000-0000-000000000000, NVIDIA GeForce RTX 3060, 12288, 12000",
  "",
].join("\n");

describe("parseNvidiaSmi", () => {
  it("reads every GPU", () => {
    const gpus = parseNvidiaSmi(TWO_GPUS);
    expect(gpus).toHaveLength(2);
    expect(gpus[0]).toEqual({
      index: 0,
      uuid: "GPU-aaaa1111-0000-0000-0000-000000000000",
      name: "NVIDIA GeForce RTX 3080",
      vram_total_mb: 10240,
      vram_free_mb: 9800,
    });
    expect(gpus[1].name).toBe("NVIDIA GeForce RTX 3060");
  });

  it("handles CRLF and a comma in the name", () => {
    const gpus = parseNvidiaSmi("0, GPU-x, Odd, Name, 8192, 4096\r\n");
    expect(gpus).toEqual([
      { index: 0, uuid: "GPU-x", name: "Odd, Name", vram_total_mb: 8192, vram_free_mb: 4096 },
    ]);
  });

  it("drops rows whose memory is not a number", () => {
    expect(parseNvidiaSmi("0, GPU-x, GRID vGPU, [N/A], [N/A]\n")).toEqual([]);
    expect(parseNvidiaSmi("")).toEqual([]);
  });
});

describe("pickGpu", () => {
  const gpus = parseNvidiaSmi(TWO_GPUS);

  it("takes GPU 0 by default", () => {
    expect(pickGpu(gpus, undefined)?.name).toBe("NVIDIA GeForce RTX 3080");
  });

  it("follows CUDA_VISIBLE_DEVICES by index or UUID", () => {
    expect(pickGpu(gpus, "1,0")?.name).toBe("NVIDIA GeForce RTX 3060");
    expect(pickGpu(gpus, "GPU-bbbb2222")?.name).toBe("NVIDIA GeForce RTX 3060");
  });

  it("falls back to GPU 0 for a value it cannot match", () => {
    expect(pickGpu(gpus, "MIG-whatever")?.name).toBe("NVIDIA GeForce RTX 3080");
  });

  it("is null with no GPUs", () => {
    expect(pickGpu([], undefined)).toBeNull();
  });
});
