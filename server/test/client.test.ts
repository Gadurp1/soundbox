import { describe, expect, it, vi } from "vitest";

import { chatCompletion } from "../src/llm/client.js";

function fakeFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => "",
    ...response,
  } as Response);
}

describe("chatCompletion", () => {
  it("sends an Authorization header only when apiKey is set", async () => {
    const fetchImpl = fakeFetch({ json: async () => ({ choices: [{ message: { content: "ok" } }] }) });
    await chatCompletion(
      { baseUrl: "http://localhost:9999", apiKey: "secret", model: "m", messages: [] },
      fetchImpl,
    );
    const [, init] = fetchImpl.mock.calls[0]!;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret");
  });

  it("omits Authorization when apiKey is absent", async () => {
    const fetchImpl = fakeFetch({ json: async () => ({ choices: [{ message: { content: "ok" } }] }) });
    await chatCompletion({ baseUrl: "http://localhost:9999", model: "m", messages: [] }, fetchImpl);
    const [, init] = fetchImpl.mock.calls[0]!;
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("returns the message content on success", async () => {
    const fetchImpl = fakeFetch({
      json: async () => ({ choices: [{ message: { content: "hello world" } }] }),
    });
    const result = await chatCompletion(
      { baseUrl: "http://localhost:9999", model: "m", messages: [] },
      fetchImpl,
    );
    expect(result).toBe("hello world");
  });

  it("throws ModelError on a non-2xx response with the body surfaced", async () => {
    const fetchImpl = fakeFetch({ ok: false, status: 500, text: async () => "boom" });
    await expect(
      chatCompletion({ baseUrl: "http://localhost:9999", model: "m", messages: [] }, fetchImpl),
    ).rejects.toThrow(/HTTP 500.*boom/s);
  });

  it("throws ModelError on an unexpected response shape", async () => {
    const fetchImpl = fakeFetch({ json: async () => ({ nope: true }) });
    await expect(
      chatCompletion({ baseUrl: "http://localhost:9999", model: "m", messages: [] }, fetchImpl),
    ).rejects.toThrow(/unexpected response shape/);
  });

  it("throws ModelError when the fetch itself rejects", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(
      chatCompletion({ baseUrl: "http://localhost:9999", model: "m", messages: [] }, fetchImpl),
    ).rejects.toThrow(/Could not reach/);
  });
});
