import type { PriceData, PriceRegion } from "@/lib/prices";
import { PriceSourceError, type ItadClient } from "./itad";
import { isSameGame, toPriceData } from "./map";

/*
 * Prices for the game page (DECISIONS.md 045), with IsThereAnyDeal asked as
 * little as its terms ask: which ITAD game a game is, is remembered for a
 * month (a week when nothing was found); prices for six hours, as deals come
 * and go within a day; the year's history for a day. If ITAD cannot be
 * reached, whatever was last fetched is shown, however old.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
export const ID_FOUND_MS = 30 * DAY_MS;
export const ID_MISSING_MS = 7 * DAY_MS;
export const PRICES_MS = 6 * 60 * 60 * 1000;
export const HISTORY_MS = DAY_MS;
const HISTORY_SPAN_MS = 365 * DAY_MS;
/** Fetched a month further back than drawn, so every shop has a price when the line starts. */
const HISTORY_LEAD_MS = 30 * DAY_MS;

/** Enough to cover a game and its editions without a burst of lookups. */
const MAX_STEAM_APPS = 3;

export type PriceGame = {
  id: number;
  name: string;
  /** IsThereAnyDeal follows PC shops; a game on no PC platform has nothing to find. */
  onPc: boolean;
  steamAppIds: readonly string[];
};

export type PriceResult =
  | { status: "not-on-pc" }
  | { status: "untracked" }
  | { status: "unavailable" }
  | { status: "ok"; data: PriceData | null; fetchedAt: string };

type Cached = { payload: unknown; fetchedAt: Date };

export type PriceStore = {
  readId(gameId: number): Promise<{ itadId: string | null; checkedAt: Date } | null>;
  writeId(gameId: number, itadId: string | null): Promise<void>;
  read(gameId: number, country: string, kind: "prices" | "history"): Promise<Cached | null>;
  write(
    gameId: number,
    country: string,
    kind: "prices" | "history",
    payload: unknown,
  ): Promise<void>;
};

type Dependencies = { store: PriceStore; itad: ItadClient; now?: () => number };

export function createPriceService({ store, itad, now = Date.now }: Dependencies) {
  const fresh = (at: Date, span: number) => now() - at.getTime() < span;

  /** The ITAD game for a game: by its Steam apps first, then by title. */
  async function itadIdFor(game: PriceGame): Promise<string | null> {
    const known = await store.readId(game.id);
    if (known && fresh(known.checkedAt, known.itadId ? ID_FOUND_MS : ID_MISSING_MS)) {
      return known.itadId;
    }

    let found: string | null = null;
    for (const appId of game.steamAppIds.slice(0, MAX_STEAM_APPS)) {
      const match = await itad.lookupByAppId(appId);
      if (isSameGame(match, game.name)) {
        found = match.id;
        break;
      }
    }
    if (!found) {
      const match = await itad.lookupByTitle(game.name);
      if (isSameGame(match, game.name)) found = match.id;
    }

    await store.writeId(game.id, found);
    return found;
  }

  /** Reads a cached value, or fetches and caches a new one when it has gone stale. */
  async function cached<T>(
    gameId: number,
    country: string,
    kind: "prices" | "history",
    span: number,
    load: () => Promise<T>,
  ): Promise<{ value: T; fetchedAt: Date } | null> {
    const stored = await store.read(gameId, country, kind);
    if (stored && fresh(stored.fetchedAt, span)) {
      return { value: stored.payload as T, fetchedAt: stored.fetchedAt };
    }
    try {
      const value = await load();
      await store.write(gameId, country, kind, value);
      return { value, fetchedAt: new Date(now()) };
    } catch (error) {
      if (!(error instanceof PriceSourceError)) throw error;
      // Old prices, dated as old, beat none.
      return stored ? { value: stored.payload as T, fetchedAt: stored.fetchedAt } : null;
    }
  }

  async function pricesFor(game: PriceGame, region: PriceRegion): Promise<PriceResult> {
    if (!game.onPc && game.steamAppIds.length === 0) return { status: "not-on-pc" };

    let itadId: string | null;
    try {
      itadId = await itadIdFor(game);
    } catch (error) {
      if (!(error instanceof PriceSourceError)) throw error;
      const known = await store.readId(game.id);
      if (!known?.itadId) return { status: "unavailable" };
      itadId = known.itadId;
    }
    if (!itadId) return { status: "untracked" };
    const id = itadId;

    const [prices, history] = await Promise.all([
      cached(game.id, region, "prices", PRICES_MS, () => itad.prices(id, region)),
      cached(game.id, region, "history", HISTORY_MS, () =>
        itad.history(id, region, new Date(now() - HISTORY_SPAN_MS - HISTORY_LEAD_MS)),
      ),
    ]);
    if (!prices) return { status: "unavailable" };

    return {
      status: "ok",
      data: toPriceData(
        prices.value,
        history?.value ?? [],
        new Date(now() - HISTORY_SPAN_MS).toISOString(),
      ),
      fetchedAt: prices.fetchedAt.toISOString(),
    };
  }

  return { pricesFor };
}

export type PriceService = ReturnType<typeof createPriceService>;
