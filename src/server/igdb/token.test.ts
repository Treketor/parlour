// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createTokenProvider, type StoredToken, type TokenStore } from "./token";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 24);

function memoryStore(
  initial: StoredToken | null = null,
): TokenStore & { current: StoredToken | null } {
  const store = {
    current: initial,
    read: vi.fn(async () => store.current),
    write: vi.fn(async (token: StoredToken) => {
      store.current = token;
    }),
  };
  return store;
}

function twitch(accessToken: string, expiresInDays = 55) {
  return vi.fn(async () =>
    Response.json({
      access_token: accessToken,
      expires_in: expiresInDays * 86400,
      token_type: "bearer",
    }),
  );
}

const credentials = { clientId: "id", clientSecret: "secret", now: () => NOW };

describe("createTokenProvider", () => {
  it("reuses a stored token that is valid for more than a day", async () => {
    const store = memoryStore({ accessToken: "stored", expiresAt: new Date(NOW + 10 * DAY) });
    const fetch = twitch("new");
    const tokens = createTokenProvider({ ...credentials, store, fetch });

    expect(await tokens.get()).toBe("stored");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requests and stores a new token when the stored one is about to expire", async () => {
    const store = memoryStore({ accessToken: "old", expiresAt: new Date(NOW + DAY / 2) });
    const fetch = twitch("fresh");
    const tokens = createTokenProvider({ ...credentials, store, fetch });

    expect(await tokens.get()).toBe("fresh");
    expect(store.current?.accessToken).toBe("fresh");
    expect(store.current?.expiresAt.getTime()).toBe(NOW + 55 * DAY);
  });

  it("sends the client credentials grant to Twitch", async () => {
    const fetch = twitch("fresh");
    await createTokenProvider({ ...credentials, store: memoryStore(), fetch }).get();

    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.origin + url.pathname).toBe("https://id.twitch.tv/oauth2/token");
    expect(url.searchParams.get("grant_type")).toBe("client_credentials");
    expect(url.searchParams.get("client_id")).toBe("id");
    expect(init.method).toBe("POST");
  });

  it("keeps the token in memory after the first lookup", async () => {
    const store = memoryStore({ accessToken: "stored", expiresAt: new Date(NOW + 10 * DAY) });
    const tokens = createTokenProvider({ ...credentials, store, fetch: twitch("new") });

    await tokens.get();
    await tokens.get();
    expect(store.read).toHaveBeenCalledTimes(1);
  });

  it("makes concurrent callers share one request", async () => {
    const fetch = twitch("fresh");
    const tokens = createTokenProvider({ ...credentials, store: memoryStore(), fetch });

    const results = await Promise.all([tokens.get(), tokens.get(), tokens.get()]);
    expect(results).toEqual(["fresh", "fresh", "fresh"]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("replaces a rejected token with a new one", async () => {
    const store = memoryStore({ accessToken: "revoked", expiresAt: new Date(NOW + 10 * DAY) });
    const fetch = twitch("fresh");
    const tokens = createTokenProvider({ ...credentials, store, fetch });

    expect(await tokens.get()).toBe("revoked");
    expect(await tokens.replace("revoked")).toBe("fresh");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("uses a token another instance already renewed instead of requesting one", async () => {
    const store = memoryStore({ accessToken: "renewed", expiresAt: new Date(NOW + 10 * DAY) });
    const fetch = twitch("fresh");
    const tokens = createTokenProvider({ ...credentials, store, fetch });

    expect(await tokens.replace("revoked")).toBe("renewed");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports refused credentials as an auth error", async () => {
    const fetch = vi.fn(async () => new Response("nope", { status: 403 }));
    const tokens = createTokenProvider({ ...credentials, store: memoryStore(), fetch });

    await expect(tokens.get()).rejects.toMatchObject({ name: "IgdbError", kind: "auth" });
  });
});
