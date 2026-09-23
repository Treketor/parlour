import type { CatalogueGame } from "@/lib/catalogue";
import type { IgdbClient } from "../igdb/client";
import { IgdbError } from "../igdb/errors";
import { mapGames, type GameBatch } from "../igdb/map";
import { gamesByIdQuery, normaliseSearch, searchGamesQuery } from "../igdb/query";
import { igdbGames } from "../igdb/schema";

/*
 * The caching policy between the app and IGDB (DECISIONS.md 028):
 * - a search is answered from the cache for a day, then asked again;
 * - a game is refetched only once its record is past stale_after;
 * - if IGDB fails, an expired cached answer is better than none.
 */

export const SEARCH_CACHE_MS = 24 * 60 * 60 * 1000;
export const MIN_QUERY_LENGTH = 2;

export type CatalogueStore = {
  readSearch(query: string): Promise<{ gameIds: number[]; expiresAt: Date } | null>;
  writeSearch(query: string, gameIds: number[], expiresAt: Date): Promise<void>;
  storeBatch(batch: GameBatch): Promise<void>;
  /** When each stored game goes stale; games not stored are absent. */
  staleAfter(ids: readonly number[]): Promise<Map<number, Date>>;
  readGames(ids: readonly number[]): Promise<CatalogueGame[]>;
};

type Dependencies = { store: CatalogueStore; igdb: IgdbClient; now?: () => number };

export function createCatalogue({ store, igdb, now = Date.now }: Dependencies) {
  async function fetchAndStore(body: string): Promise<number[]> {
    const games = await igdb.query("games", body, igdbGames);
    if (games.length > 0) await store.storeBatch(mapGames(games));
    return games.map((game) => game.id);
  }

  /** Reads games back in the order given; ids that are not stored are skipped. */
  async function inOrder(ids: readonly number[]): Promise<CatalogueGame[]> {
    if (ids.length === 0) return [];
    const byId = new Map((await store.readGames(ids)).map((game) => [game.id, game]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  }

  return {
    async search(input: string): Promise<CatalogueGame[]> {
      const query = normaliseSearch(input);
      if (query.length < MIN_QUERY_LENGTH) return [];

      const cached = await store.readSearch(query);
      if (cached && cached.expiresAt.getTime() > now()) return inOrder(cached.gameIds);

      try {
        const ids = await fetchAndStore(searchGamesQuery(query));
        await store.writeSearch(query, ids, new Date(now() + SEARCH_CACHE_MS));
        return inOrder(ids);
      } catch (error) {
        if (cached && error instanceof IgdbError) return inOrder(cached.gameIds);
        throw error;
      }
    },

    /**
     * Makes sure these games are stored and fresh, fetching only the ones that
     * are missing or stale. Library entries reference stored games, so this
     * runs before anything is added.
     */
    async ensure(ids: readonly number[]): Promise<CatalogueGame[]> {
      const wanted = [...new Set(ids)];
      if (wanted.length === 0) return [];

      const staleAfter = await store.staleAfter(wanted);
      const toFetch = wanted.filter((id) => {
        const staleAt = staleAfter.get(id);
        return staleAt === undefined || staleAt.getTime() <= now();
      });

      if (toFetch.length > 0) {
        try {
          await fetchAndStore(gamesByIdQuery(toFetch));
        } catch (error) {
          // Stale is fine to show; missing is not.
          const missing = toFetch.some((id) => !staleAfter.has(id));
          if (missing || !(error instanceof IgdbError)) throw error;
        }
      }

      return inOrder(wanted);
    },
  };
}

export type Catalogue = ReturnType<typeof createCatalogue>;
