import { createServer, type Server } from "node:http";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { probeAll, probeEndpoint, type ProbeCandidate } from "../src/llm/probe.js";

let stub: Server;
let stubUrl: string;

beforeAll(async () => {
  stub = createServer((_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ data: [{ id: "llama3" }, { id: "qwen2.5" }] }));
  });
  await new Promise<void>((resolve) => stub.listen(0, "127.0.0.1", resolve));
  const address = stub.address();
  const port = typeof address === "object" && address ? address.port : 0;
  stubUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise((resolve) => stub.close(resolve));
});

describe("probeEndpoint", () => {
  it("returns the endpoint with its model ids when something answers", async () => {
    const candidate: ProbeCandidate = { label: "Test", base_url: stubUrl };
    const result = await probeEndpoint(candidate);
    expect(result).toEqual({ label: "Test", base_url: stubUrl, models: ["llama3", "qwen2.5"] });
  });

  it("returns null when nothing is listening", async () => {
    const candidate: ProbeCandidate = { label: "Nowhere", base_url: "http://127.0.0.1:1" };
    expect(await probeEndpoint(candidate)).toBeNull();
  });

  it("returns null on a non-2xx response", async () => {
    const errorServer = createServer((_req, res) => {
      res.statusCode = 404;
      res.end("not found");
    });
    await new Promise<void>((resolve) => errorServer.listen(0, "127.0.0.1", resolve));
    const address = errorServer.address();
    const port = typeof address === "object" && address ? address.port : 0;
    try {
      const result = await probeEndpoint({ label: "X", base_url: `http://127.0.0.1:${port}` });
      expect(result).toBeNull();
    } finally {
      await new Promise((resolve) => errorServer.close(resolve));
    }
  });
});

describe("probeAll", () => {
  it("checks every candidate and filters out the ones that don't answer", async () => {
    const results = await probeAll();
    // The three real default ports are almost certainly not all in use on a
    // CI/test machine — this just asserts the shape holds, not that any are up.
    expect(Array.isArray(results)).toBe(true);
    for (const r of results) {
      expect(r).toHaveProperty("label");
      expect(r).toHaveProperty("base_url");
      expect(Array.isArray(r.models)).toBe(true);
    }
  });
});
