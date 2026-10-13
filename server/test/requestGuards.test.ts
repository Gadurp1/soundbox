import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp, hostnameOf } from "../src/app.js";
import { Config } from "../src/config.js";

let app: FastifyInstance;
let dataDir: string;

beforeAll(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "soundbox-guards-test-"));
  app = buildApp(new Config(dataDir), { serveUi: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await rm(dataDir, { recursive: true, force: true });
});

describe("hostnameOf", () => {
  it("strips ports and keeps IPv6 brackets", () => {
    expect(hostnameOf("localhost:17494")).toBe("localhost");
    expect(hostnameOf("127.0.0.1")).toBe("127.0.0.1");
    expect(hostnameOf("[::1]:17494")).toBe("[::1]");
    expect(hostnameOf("Evil.Example:80")).toBe("evil.example");
  });
});

describe("Host header allowlist (DNS rebinding)", () => {
  for (const host of ["localhost", "localhost:5174", "127.0.0.1:17494", "[::1]:17494"]) {
    it(`serves ${host}`, async () => {
      const res = await app.inject({ method: "GET", url: "/api/health", headers: { host } });
      expect(res.statusCode).not.toBe(403);
    });
  }

  for (const host of ["evil.example", "evil.example:17494", "127.0.0.1.evil.example"]) {
    it(`refuses ${JSON.stringify(host)}`, async () => {
      const res = await app.inject({ method: "GET", url: "/api/health", headers: { host } });
      expect(res.statusCode).toBe(403);
    });
  }

  it("also allows a host the server was deliberately bound to", async () => {
    const lan = buildApp(new Config(dataDir), { serveUi: false, allowedHosts: ["192.168.1.20"] });
    await lan.ready();
    try {
      const ok = await lan.inject({
        method: "GET",
        url: "/api/health",
        headers: { host: "192.168.1.20:17494" },
      });
      expect(ok.statusCode).not.toBe(403);
      const bad = await lan.inject({ method: "GET", url: "/api/health", headers: { host: "evil.example" } });
      expect(bad.statusCode).toBe(403);
    } finally {
      await lan.close();
    }
  });
});

describe("CSRF: mutating /api requests", () => {
  it("refuses a body-less POST without the header", async () => {
    const res = await app.inject({ method: "POST", url: "/api/sessions" });
    expect(res.statusCode).toBe(403);
  });

  for (const ct of [
    "text/plain",
    "text/plain;charset=UTF-8",
    "application/x-www-form-urlencoded",
    "multipart/form-data; boundary=x",
  ]) {
    it(`refuses a simple ${ct} POST`, async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/sessions",
        headers: { "content-type": ct },
        payload: "{}",
      });
      expect(res.statusCode).toBe(403);
    });
  }

  it("refuses a body-less DELETE without the header", async () => {
    const res = await app.inject({ method: "DELETE", url: "/api/sounds/nope" });
    expect(res.statusCode).toBe(403);
  });

  it("accepts a JSON POST", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { "content-type": "application/json" },
      payload: "{}",
    });
    expect(res.statusCode).not.toBe(403);
  });

  it("accepts a body-less POST carrying X-Soundbox", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: { "x-soundbox": "1" },
    });
    expect(res.statusCode).not.toBe(403);
  });

  it("leaves GETs alone", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
  });
});
