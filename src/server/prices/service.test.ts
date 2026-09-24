// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { PriceSourceError, type ItadClient, type ItadPrices } from "./itad";
import { isSameGame, toPriceData } from "./map";
import {
  ID_MISSING_MS,
  PRICES_MS,
  createPriceService,
  type PriceGame,
  type PriceStore,
} from "./service";

const NOW = Date.UTC(2026, 8, 24);
const ITAD_ID = "018d937e-f48c-7289-8516-c7c5b2e12eba";
const gbp = (amount: number) => ({ amount, currency: "GBP" });

const pricesFor: ItadPrices = {
  id: ITAD_ID,
  historyLow: { all: gbp(1.86), y1: gbp(1.86), m3: gbp(2.18) },
  deals: [
    {
      shop: { id: 61, name: "Steam" },
      price: gbp(19.99),
      regular: gbp(19.99),
      cut: 0,
      voucher: null,
      drm: [{ id: 61, name: "Steam" }],
      url: "https://itad.link/steam",
    },
    {
      shop: { id: 64, name: "WinGameStore" },
      price: gbp(2.18),
      regular: gbp(15.11),
      cut: 86,
      voucher: null,
      drm: [{ id: 61, name: "Steam" }],
      url: "https://itad.link/wgs",
    },
    {
      shop: { id: 74, name: "PlayerLand" },
      price: { amount: 27.49, currency: "USD" },
      regular: { amount: 30.48, currency: "USD" },
      cut: 10,
      voucher: null,
      drm: [],
      url: "https://itad.link/pl",
    },
  ],
};

const game: PriceGame = { id: 1011, name: "Borderlands 2", onPc: true, steamAppIds: ["49520"] };

function memoryStore() {
  const ids = new Map<number, { itadId: string | null; checkedAt: Date }>();
  const cache = new Map<string, { payload: unknown; fetchedAt: Date }>();
  const store = {
    ids,
    cache,
    readId: vi.fn(async (gameId: number) => ids.get(gameId) ?? null),
    writeId: vi.fn(async (gameId: number, itadId: string | null) => {
      ids.set(gameId, { itadId, checkedAt: new Date(NOW) });
    }),
    read: vi.fn(async (gameId: number, country: string, kind: string) => {
      return cache.get(`${gameId}:${country}:${kind}`) ?? null;
    }),
    write: vi.fn(async (gameId: number, country: string, kind: string, payload: unknown) => {
      cache.set(`${gameId}:${country}:${kind}`, { payload, fetchedAt: new Date(NOW) });
    }),
  } satisfies PriceStore & { ids: typeof ids; cache: typeof cache };
  return store;
}

function itadClient(overrides: Partial<ItadClient> = {}): ItadClient & {
  [K in keyof ItadClient]: ReturnType<typeof vi.fn>;
} {
  return {
    lookupByAppId: vi.fn(async () => ({ id: ITAD_ID, title: "Borderlands 2", type: "game" })),
    lookupByTitle: vi.fn(async () => null),
    prices: vi.fn(async () => pricesFor),
    history: vi.fn(async () => []),
    ...overrides,
  } as never;
}

describe("isSameGame", () => {
  it("refuses DLC and namesakes", () => {
    expect(isSameGame({ id: ITAD_ID, title: "Borderlands 2", type: "game" }, "Borderlands 2")).toBe(
      true,
    );
    expect(
      isSameGame(
        { id: ITAD_ID, title: "The Legend of Zelda: Breath of the Wild", type: "dlc" },
        "The Legend of Zelda: Breath of the Wild",
      ),
    ).toBe(false);
    expect(
      isSameGame({ id: ITAD_ID, title: "Borderlands 2 VR", type: "game" }, "Borderlands 2"),
    ).toBe(false);
  });
});

describe("toPriceData", () => {
  it("keeps the region's currency, cheapest first, with the lows", () => {
    const data = toPriceData(pricesFor, [], "2025-09-24T00:00:00Z");
    expect(data?.currency).toBe("GBP");
    expect(data?.deals.map((deal) => deal.shop)).toEqual(["WinGameStore", "Steam"]);
    expect(data?.lowest).toEqual({ allTime: gbp(1.86), pastYear: gbp(1.86) });
  });

  it("is null when no shop sells it", () => {
    expect(toPriceData(null, [], "2025-09-24T00:00:00Z")).toBeNull();
    expect(
      toPriceData({ id: ITAD_ID, historyLow: null, deals: [] }, [], "2025-09-24T00:00:00Z"),
    ).toBeNull();
  });
});

describe("pricesFor", () => {
  it("says a game on no PC platform has nothing to look up", async () => {
    const itad = itadClient();
    const service = createPriceService({ store: memoryStore(), itad, now: () => NOW });
    expect(await service.pricesFor({ ...game, onPc: false, steamAppIds: [] }, "GB")).toEqual({
      status: "not-on-pc",
    });
    expect(itad.lookupByTitle).not.toHaveBeenCalled();
  });

  it("finds the game by its Steam app and caches the prices", async () => {
    const store = memoryStore();
    const itad = itadClient();
    const service = createPriceService({ store, itad, now: () => NOW });

    const first = await service.pricesFor(game, "GB");
    expect(first.status).toBe("ok");
    expect(itad.prices).toHaveBeenCalledWith(ITAD_ID, "GB");

    await service.pricesFor(game, "GB");
    expect(itad.lookupByAppId).toHaveBeenCalledTimes(1);
    expect(itad.prices).toHaveBeenCalledTimes(1);
  });

  it("asks again once the prices are six hours old", async () => {
    const store = memoryStore();
    const itad = itadClient();
    let now = NOW;
    const service = createPriceService({ store, itad, now: () => now });
    await service.pricesFor(game, "GB");
    now = NOW + PRICES_MS + 1;
    await service.pricesFor(game, "GB");
    expect(itad.prices).toHaveBeenCalledTimes(2);
  });

  it("remembers a game ITAD does not have, for a week", async () => {
    const store = memoryStore();
    const itad = itadClient({ lookupByAppId: vi.fn(async () => null) });
    let now = NOW;
    const service = createPriceService({ store, itad, now: () => now });

    expect(await service.pricesFor(game, "GB")).toEqual({ status: "untracked" });
    await service.pricesFor(game, "GB");
    expect(itad.lookupByTitle).toHaveBeenCalledTimes(1);

    now = NOW + ID_MISSING_MS + 1;
    await service.pricesFor(game, "GB");
    expect(itad.lookupByTitle).toHaveBeenCalledTimes(2);
  });

  it("serves old prices when ITAD cannot be reached", async () => {
    const store = memoryStore();
    let now = NOW;
    const failing = vi.fn(async () => {
      throw new PriceSourceError(new Error("503"));
    });
    const working = createPriceService({ store, itad: itadClient(), now: () => now });
    await working.pricesFor(game, "GB");

    now = NOW + PRICES_MS * 4;
    const broken = createPriceService({
      store,
      itad: itadClient({ prices: failing, history: failing }),
      now: () => now,
    });
    const result = await broken.pricesFor(game, "GB");
    expect(result.status).toBe("ok");
    expect(result.status === "ok" && result.fetchedAt).toBe(new Date(NOW).toISOString());
  });

  it("is unavailable when ITAD is down and nothing was ever fetched", async () => {
    const failing = vi.fn(async () => {
      throw new PriceSourceError(new Error("timeout"));
    });
    const service = createPriceService({
      store: memoryStore(),
      itad: itadClient({ lookupByAppId: failing, lookupByTitle: failing }),
      now: () => NOW,
    });
    expect(await service.pricesFor(game, "GB")).toEqual({ status: "unavailable" });
  });
});
