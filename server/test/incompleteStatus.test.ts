import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AudioCppModel, catalogById } from "../src/models/audiocpp.js";

/**
 * "Incomplete" is decided from the package folder alone: something there,
 * nothing runnable. It must stay distinct from "not installed" (nothing at
 * all), because the two have different fixes and the Models page offers
 * Repair for one and Download for the other.
 */

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "soundbox-incomplete-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function model(id: string): AudioCppModel {
  const spec = catalogById().get(id);
  if (!spec) throw new Error(`no catalog entry ${id}`);
  return new AudioCppModel(spec, join(root, "unused"), null, root);
}

describe("incomplete weights", () => {
  it("reports not_installed with no package folder", async () => {
    const m = model("audiocpp-stable-audio-3-sfx");
    expect((await m.status()).status).toBe("not_installed");
  });

  it("reports not_installed for an empty package folder", async () => {
    const m = model("audiocpp-stable-audio-3-sfx");
    await mkdir(m.weightsDir(), { recursive: true });
    expect((await m.status()).status).toBe("not_installed");
  });

  it("reports incomplete when a transfer left a .part behind", async () => {
    const m = model("audiocpp-stable-audio-3-sfx");
    await mkdir(m.weightsDir(), { recursive: true });
    await writeFile(join(m.weightsDir(), "model.gguf.part"), "x");
    expect((await m.status()).status).toBe("incomplete");
  });
});
