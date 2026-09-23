// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createIgdbClient } from "./client";
import type { TokenProvider } from "./token";

const schema = z.array(z.object({ id: z.number() }));
const passThrough = <T>(task: () => Promise<T>) => task();
const noSleep = vi.fn(async () => {});

function tokens(initial = "token-1"): TokenProvider & { replace: ReturnType<typeof vi.fn> } {
  return {
    get: vi.fn(async () => initial),
    replace: vi.fn(async () => "token-2"),
  };
}

function responses(...list: Array<Response | Error>) {
  const fetch = vi.fn(async () => {
    const next = list.shift();
    if (!next) throw new Error("no more responses");
    if (next instanceof Error) throw next;
    return next;
  });
  return fetch;
}

function client(fetch: ReturnType<typeof responses>, provider = tokens()) {
  return createIgdbClient({
    clientId: "id",
    tokens: provider,
    limit: passThrough,
    fetch,
    sleep: noSleep,
  });
}

describe("createIgdbClient", () => {
  it("posts the query with IGDB's headers and returns validated data", async () => {
    const fetch = responses(Response.json([{ id: 1 }]));
    const result = await client(fetch).query("games", "fields name;", schema);

    expect(result).toEqual([{ id: 1 }]);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.igdb.com/v4/games");
    expect(init.method).toBe("POST");
    expect(init.body).toBe("fields name;");
    expect(init.headers).toMatchObject({ "Client-ID": "id", Authorization: "Bearer token-1" });
  });

  it("backs off and retries when rate limited, honouring Retry-After", async () => {
    const fetch = responses(
      new Response(null, { status: 429, headers: { "retry-after": "2" } }),
      Response.json([{ id: 1 }]),
    );
    noSleep.mockClear();

    await expect(client(fetch).query("games", "", schema)).resolves.toEqual([{ id: 1 }]);
    expect(noSleep).toHaveBeenCalledWith(2000);
  });

  it("retries server errors and network failures", async () => {
    const fetch = responses(
      new Response(null, { status: 503 }),
      new Error("socket hang up"),
      Response.json([{ id: 7 }]),
    );
    await expect(client(fetch).query("games", "", schema)).resolves.toEqual([{ id: 7 }]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("replaces a rejected token once and retries with it", async () => {
    const provider = tokens();
    const fetch = responses(new Response(null, { status: 401 }), Response.json([{ id: 1 }]));

    await expect(client(fetch, provider).query("games", "", schema)).resolves.toEqual([{ id: 1 }]);
    expect(provider.replace).toHaveBeenCalledWith("token-1");
    const [, init] = fetch.mock.calls[1] as unknown as [string, RequestInit];
    expect(init.headers).toMatchObject({ Authorization: "Bearer token-2" });
  });

  it("gives up on a second rejection instead of looping", async () => {
    const fetch = responses(
      new Response(null, { status: 401 }),
      new Response(null, { status: 401 }),
    );
    await expect(client(fetch).query("games", "", schema)).rejects.toMatchObject({ kind: "auth" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry a bad query", async () => {
    const fetch = responses(new Response("Syntax error", { status: 400 }));
    await expect(client(fetch).query("games", "nonsense", schema)).rejects.toMatchObject({
      kind: "bad-request",
      status: 400,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reports a persistent rate limit as such after the last attempt", async () => {
    const fetch = responses(
      ...Array.from({ length: 4 }, () => new Response(null, { status: 429 })),
    );
    await expect(client(fetch).query("games", "", schema)).rejects.toMatchObject({
      kind: "rate-limit",
    });
  });

  it("rejects data in an unexpected shape", async () => {
    const fetch = responses(Response.json({ not: "an array" }));
    await expect(client(fetch).query("games", "", schema)).rejects.toMatchObject({
      kind: "bad-response",
    });
  });
});
