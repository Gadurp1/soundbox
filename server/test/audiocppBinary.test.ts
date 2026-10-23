import { describe, expect, it } from "vitest";

import {
  assetScore,
  companionAsset,
  cudaPreference,
  parseCudaVersion,
} from "../src/models/audiocppBinary.js";
import type { Release } from "../src/models/releaseInstall.js";

/** The asset names audio.cpp v0.9.2 publishes, verbatim. */
const V092 = [
  "audio-v0.9.2-bin-macos-arm64-metal.tar.gz",
  "audio-v0.9.2-bin-macos-x64-metal.tar.gz",
  "audio-v0.9.2-bin-ubuntu-x64-cpu-portable.tar.gz",
  "audio-v0.9.2-bin-ubuntu-x64-cpu.tar.gz",
  "audio-v0.9.2-bin-ubuntu-x64-cuda12.8-colab.tar.gz",
  "audio-v0.9.2-bin-ubuntu-x64-vulkan-portable.tar.gz",
  "audio-v0.9.2-bin-ubuntu-x64-vulkan.tar.gz",
  "audio-v0.9.2-bin-windows-x64-cpu-portable.zip",
  "audio-v0.9.2-bin-windows-x64-cpu.zip",
  "audio-v0.9.2-bin-windows-x64-cuda12.4.zip",
  "audio-v0.9.2-bin-windows-x64-cuda13.3.zip",
  "audio-v0.9.2-bin-windows-x64-vulkan-portable.zip",
  "audio-v0.9.2-bin-windows-x64-vulkan.zip",
  "audio-v0.9.2-cudart-ubuntu-x64-cuda12.8.tar.gz",
  "audio-v0.9.2-cudart-ubuntu-x64-cuda13.3.tar.gz",
  "audio-v0.9.2-cudart-windows-x64-cuda12.4.zip",
  "audio-v0.9.2-cudart-windows-x64-cuda13.3.zip",
  "audio-v0.9.2-lib-ubuntu-x64-cuda12.8.tar.gz",
  "audio-v0.9.2-lib-windows-x64-cuda12.4.zip",
  "audio-v0.9.2-lib-windows-x64-cuda13.3.zip",
  "audio-v0.9.2-server-config-examples.zip",
];

function best(platform: string, backend: string, driverCuda: number | null = null): string {
  const scored = V092.map((n) => ({
    n,
    s: assetScore(n, platform, backend, "x64"),
  }))
    .filter((p) => p.s > 0)
    .map((p) => ({ ...p, s: p.s + (backend === "cuda" ? cudaPreference(p.n, driverCuda) : 0) }));
  return scored.reduce((a, b) => (b.s > a.s ? b : a)).n;
}

const release = (names: string[]): Release =>
  ({
    tag_name: "v0.9.2",
    assets: names.map((name) => ({ name, browser_download_url: `https://example.invalid/${name}` })),
  }) as Release;

describe("assetScore against the 0.9.x release layout", () => {
  it("never picks a package that ships no audiocpp_cli", () => {
    for (const name of [
      "audio-v0.9.2-cudart-windows-x64-cuda12.4.zip",
      "audio-v0.9.2-lib-windows-x64-cuda12.4.zip",
      "audio-v0.9.2-server-config-examples.zip",
      "audio-v0.9.2-bin-ubuntu-x64-cuda12.8-colab.tar.gz",
    ]) {
      expect(assetScore(name, "windows", "cuda", "x64"), name).toBe(0);
      expect(assetScore(name, "linux", "cuda", "x64"), name).toBe(0);
    }
  });

  it("matches the ubuntu-named assets on Linux", () => {
    expect(best("linux", "vulkan")).toMatch(/bin-ubuntu-x64-vulkan/);
    expect(best("linux", "cpu")).toMatch(/bin-ubuntu-x64-cpu/);
  });

  it("picks the newest CUDA build the driver supports", () => {
    expect(best("windows", "cuda", 13.04)).toBe("audio-v0.9.2-bin-windows-x64-cuda13.3.zip");
    expect(best("windows", "cuda", 12.08)).toBe("audio-v0.9.2-bin-windows-x64-cuda12.4.zip");
  });

  it("falls back to the oldest CUDA build when the driver version is unknown", () => {
    expect(best("windows", "cuda", null)).toBe("audio-v0.9.2-bin-windows-x64-cuda12.4.zip");
  });

  it("still handles the 0.6.x names", () => {
    expect(assetScore("audiocpp-windows-cuda-runtime.zip", "windows", "cuda", "x64")).toBe(0);
    expect(assetScore("audiocpp-windows-cuda-balance-26dcb5c4.zip", "windows", "cuda", "x64")).toBeGreaterThan(
      assetScore("audiocpp-windows-cuda-fast-26dcb5c4.zip", "windows", "cuda", "x64"),
    );
  });
});

describe("companionAsset", () => {
  it.runIf(process.platform === "win32")("pairs a CUDA binary with the cudart of the same toolkit", () => {
    const r = release(V092);
    const pick = (name: string) => companionAsset(r, r.assets!.find((a) => a.name === name)!)?.name;
    expect(pick("audio-v0.9.2-bin-windows-x64-cuda13.3.zip")).toBe("audio-v0.9.2-cudart-windows-x64-cuda13.3.zip");
    expect(pick("audio-v0.9.2-bin-windows-x64-cuda12.4.zip")).toBe("audio-v0.9.2-cudart-windows-x64-cuda12.4.zip");
    expect(pick("audio-v0.9.2-bin-windows-x64-vulkan.zip")).toBeUndefined();
  });

  it.runIf(process.platform === "win32")("keeps finding the 0.6.x runtime package", () => {
    const r = release(["audiocpp-windows-cuda-balance-26dcb5c4.zip", "audiocpp-windows-cuda-runtime.zip"]);
    expect(companionAsset(r, r.assets![0]!)?.name).toBe("audiocpp-windows-cuda-runtime.zip");
  });
});

describe("parseCudaVersion", () => {
  it("reads both nvidia-smi header styles", () => {
    expect(parseCudaVersion("| NVIDIA-SMI 616.92   KMD Version: 616.92   CUDA UMD Version: 13.4 |")).toBe(13.04);
    expect(parseCudaVersion("| NVIDIA-SMI 551.86   Driver Version: 551.86   CUDA Version: 12.4 |")).toBe(12.04);
    expect(parseCudaVersion("no gpu here")).toBeNull();
  });
});
