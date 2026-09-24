import { z } from "zod";

/*
 * The IsThereAnyDeal API (docs.isthereanydeal.com). The key travels in the
 * ITAD-API-Key header rather than the address, so it never lands in a log.
 * Every response is validated; any failure is thrown as PriceSourceError so
 * the service can fall back to what it has cached.
 */

const BASE_URL = "https://api.isthereanydeal.com";

/** Long enough for a slow response, short enough that the page does not hang on it. */
const TIMEOUT_MS = 5000;

export class PriceSourceError extends Error {
  constructor(cause: unknown) {
    super("IsThereAnyDeal could not be reached", { cause });
    this.name = "PriceSourceError";
  }
}

type Fetch = typeof fetch;

const money = z.object({ amount: z.number(), currency: z.string().length(3) });

const lookupResponse = z.object({
  found: z.boolean(),
  game: z.object({ id: z.uuid(), title: z.string(), type: z.string().nullable() }).optional(),
});

/** One game's prices; also checks what comes back out of the cache. */
export const pricesItem = z.object({
  id: z.uuid(),
  historyLow: z
    .object({ all: money.nullish(), y1: money.nullish(), m3: money.nullish() })
    .nullish(),
  deals: z.array(
    z.object({
      shop: z.object({ id: z.number(), name: z.string() }),
      price: money,
      regular: money,
      cut: z.number(),
      voucher: z.string().nullish(),
      drm: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
      url: z.url(),
    }),
  ),
});

const pricesResponse = z.array(pricesItem);

/** Also checks what comes back out of the cache, so an old shape is refetched, not trusted. */
export const historyResponse = z.array(
  z.object({
    timestamp: z.string(),
    shop: z.object({ id: z.number(), name: z.string() }),
    deal: z.object({ price: money }),
  }),
);

export type ItadLookup = z.infer<typeof lookupResponse>["game"];
export type ItadPrices = z.infer<typeof pricesItem>;
export type ItadHistory = z.infer<typeof historyResponse>;

export type ItadClient = {
  lookupByAppId(appId: string): Promise<ItadLookup | null>;
  lookupByTitle(title: string): Promise<ItadLookup | null>;
  prices(itadId: string, country: string): Promise<ItadPrices | null>;
  history(itadId: string, country: string, since: Date): Promise<ItadHistory>;
};

export function createItadClient(apiKey: string, fetchImpl: Fetch = fetch): ItadClient {
  async function call<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
    try {
      const response = await fetchImpl(`${BASE_URL}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          "ITAD-API-Key": apiKey,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return schema.parse(await response.json());
    } catch (error) {
      throw new PriceSourceError(error);
    }
  }

  async function lookup(query: URLSearchParams): Promise<ItadLookup | null> {
    const result = await call(`/games/lookup/v1?${query}`, lookupResponse);
    return result.found && result.game ? result.game : null;
  }

  return {
    lookupByAppId: (appId) => lookup(new URLSearchParams({ appid: appId })),
    lookupByTitle: (title) => lookup(new URLSearchParams({ title })),

    async prices(itadId, country) {
      const results = await call(
        `/games/prices/v3?${new URLSearchParams({ country })}`,
        pricesResponse,
        {
          method: "POST",
          body: JSON.stringify([itadId]),
        },
      );
      return results.find((result) => result.id === itadId) ?? null;
    },

    async history(itadId, country, since) {
      const query = new URLSearchParams({
        id: itadId,
        country,
        // Whole seconds: the API rejects fractional ones.
        since: since.toISOString().replace(/\.\d{3}Z$/, "Z"),
      });
      return call(`/games/history/v2?${query}`, historyResponse);
    },
  };
}
