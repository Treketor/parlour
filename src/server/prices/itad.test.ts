// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { PriceSourceError, createItadClient } from "./itad";

const ITAD_ID = "018d937e-f48c-7289-8516-c7c5b2e12eba";

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("createItadClient", () => {
  it("sends the key in a header, never in the address", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        respond({ found: true, game: { id: ITAD_ID, title: "Borderlands 2", type: "game" } }),
      );
    const client = createItadClient("secret-key", fetchMock);
    await client.lookupByAppId("49520");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.isthereanydeal.com/games/lookup/v1?appid=49520");
    expect(url).not.toContain("secret-key");
    expect((init.headers as Record<string, string>)["ITAD-API-Key"]).toBe("secret-key");
  });

  it("returns null when the lookup finds nothing", async () => {
    const client = createItadClient("k", vi.fn().mockResolvedValue(respond({ found: false })));
    expect(await client.lookupByTitle("Nothing")).toBeNull();
  });

  it("posts the game id for prices in the region", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respond([{ id: ITAD_ID, historyLow: null, deals: [] }]));
    const client = createItadClient("k", fetchMock);
    expect(await client.prices(ITAD_ID, "GB")).toEqual({
      id: ITAD_ID,
      historyLow: null,
      deals: [],
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.isthereanydeal.com/games/prices/v3?country=GB");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify([ITAD_ID]));
  });

  it("asks for history since a whole-second date", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond([]));
    const client = createItadClient("k", fetchMock);
    await client.history(ITAD_ID, "GB", new Date("2025-09-24T10:11:12.345Z"));
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("since=2025-09-24T10%3A11%3A12Z");
  });

  it("reports failures and unexpected shapes as source errors", async () => {
    await expect(
      createItadClient("k", vi.fn().mockResolvedValue(respond({}, 429))).lookupByTitle("x"),
    ).rejects.toBeInstanceOf(PriceSourceError);
    await expect(
      createItadClient("k", vi.fn().mockResolvedValue(respond([{ id: "nope" }]))).prices(
        ITAD_ID,
        "GB",
      ),
    ).rejects.toBeInstanceOf(PriceSourceError);
  });
});
