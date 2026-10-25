import { describe, expect, it } from "vitest";

import { buildFailure, classify } from "../src/failure.js";

describe("classify", () => {
  it.each([
    ["ggml_backend_cuda_buffer_type_alloc_buffer: allocating 2048 MB on device 0: cudaMalloc failed: out of memory", "gpu_oom"],
    ["vk::Device::allocateMemory: ErrorOutOfDeviceMemory", "gpu_oom"],
    ["std::bad_alloc", "host_memory"],
    ["Error: spawn ENOMEM", "host_memory"],
    ["[WinError 1455] The paging file is too small for this operation to complete", "paging_file"],
    ["Stable Audio Open Small's weights are not downloaded yet.", "model_not_installed"],
    ["Download the weights first.", "model_not_installed"],
    ["audiocpp_cli disappeared mid-generation.", "runtime_missing"],
    ["Could not run audio.cpp: Error: spawn C:\\x\\audiocpp_cli.exe ENOENT", "runtime_missing"],
    ["Download of https://huggingface.co/x/y stalled — no data for 60s. Check your network and try again.", "download_stalled"],
    ["Download of https://huggingface.co/x/y ended early: got 100 of 200 bytes.", "download_truncated"],
    ["Download of https://x is 100 bytes, expected 200. The file upstream may have changed, or the transfer was cut short.", "download_truncated"],
    ["ENOSPC: no space left on device, write", "disk_full"],
    ["X is a gated model. Accept the licence at https://huggingface.co/x/y with your Hugging Face account", "hf_gated"],
    ["Could not reach huggingface.co. Check your network.\n\n(TypeError: fetch failed)", "hf_unreachable"],
    ["audio.cpp did not finish within 600s.", "timeout"],
    ["audio.cpp finished but wrote no audio.\n\n<tail>", "no_audio"],
    ["gguf_init_from_file: invalid magic characters", "model_file_corrupt"],
    ["CUDA error: cudaErrorInsufficientDriver", "backend_mismatch"],
  ])("%s → %s", (text, topic) => {
    expect(classify(text)).toBe(topic);
  });

  it("keeps GPU and host memory apart", () => {
    expect(classify("std::bad_alloc")).not.toBe("gpu_oom");
    expect(classify("CUDA out of memory")).toBe("gpu_oom");
  });

  it("returns null for the unknown", () => {
    expect(classify("")).toBeNull();
    expect(classify("The trim's end must be after its start.")).toBeNull();
    expect(classify(undefined)).toBeNull();
  });

  it("ignores terminal colour codes", () => {
    expect(classify("\x1b[31mcudaMalloc failed: out of memory\x1b[0m")).toBe("gpu_oom");
  });
});

describe("buildFailure", () => {
  it("carries a title, a hint, at most two fixes and the raw text", () => {
    const f = buildFailure(new Error("cudaMalloc failed: out of memory on device"), { stage: "generating" });
    expect(f.topic).toBe("gpu_oom");
    expect(f.title).toMatch(/GPU ran out of memory/);
    expect(f.hint).toMatch(/not system RAM/);
    expect(f.fixes.length).toBeLessThanOrEqual(2);
    expect(f.fixes[0]?.to).toBe("/models");
    expect(f.stage).toBe("generating");
    expect(f.detail).toContain("cudaMalloc");
    expect(f.terminal).toBe(false);
  });

  it("still describes an unclassified error", () => {
    const f = buildFailure(new Error("Something odd\nsecond line"));
    expect(f.topic).toBeNull();
    expect(f.title).toBe("Something odd");
    expect(f.hint).toBeNull();
    expect(f.fixes).toEqual([]);
    expect(f.detail).toBe("Something odd\nsecond line");
  });

  it("never produces an empty title", () => {
    expect(buildFailure(new Error("")).title).not.toBe("");
    expect(buildFailure(null).title).not.toBe("");
  });

  it("marks what a plain retry cannot fix", () => {
    expect(buildFailure("ENOSPC: no space left on device").terminal).toBe(true);
    expect(buildFailure("Download stalled — no data for 60s").terminal).toBe(false);
  });
});
