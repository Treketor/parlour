import type { CatalogueGame } from "@/lib/catalogue";
import type { GameDetail } from "@/lib/game-detail";
import type { IgdbClient } from "../igdb/client";
import { IgdbError } from "../igdb/errors";
import { mapGames, toCandidate, type GameBatch } from "../igdb/map";
import {
  gameBySlugQuery,
  gamesByIdQuery,
  isGameSlug,
  normaliseSearch,
  searchCandidatesQuery,
} from "../igdb/query";
import { igdbCandidates, igdbGames } from "../igdb/schema";
import { rankCandidates } from "./rank";

/*
 * The caching policy between the app and IGDB (DECISIONS.md 028, 031):
 * - a search asks IGDB for many light candidates, ranks them, and fetches
 *   full details only for the best; the ranked list is cached for a day;
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
  /** The stored game with this slug, if any. */
  idForSlug(slug: string): Promise<number | null>;
  /** Everything the game page shows, for a stored game. */
  readDetail(id: number): Promise<GameDetail | null>;
};

type Dependencies = { store: CatalogueStore; igdb: IgdbClient; now?: () => number };

export function createCatalogue({ store, igdb, now = Date.now }: Dependencies) {
  /** Reads games back in the order given; ids that are not stored are skipped. */
  async function inOrder(ids: readonly number[]): Promise<CatalogueGame[]> {
    if (ids.length === 0) return [];
    const byId = new Map((await store.readGames(ids)).map((game) => [game.id, game]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  }

  /**
   * Makes sure these games are stored and fresh, fetching only the ones that
   * are missing or stale. Library entries reference stored games, so this
   * runs before anything is added.
   */
  async function ensure(ids: readonly number[]): Promise<CatalogueGame[]> {
    const wanted = [...new Set(ids)];
    if (wanted.length === 0) return [];

    const staleAfter = await store.staleAfter(wanted);
    const toFetch = wanted.filter((id) => {
      const staleAt = staleAfter.get(id);
      return staleAt === undefined || staleAt.getTime() <= now();
    });

    if (toFetch.length > 0) {
      try {
        const games = await igdb.query("games", gamesByIdQuery(toFetch), igdbGames);
        if (games.length > 0) await store.storeBatch(mapGames(games));
      } catch (error) {
        // Stale is fine to show; missing is not.
        const missing = toFetch.some((id) => !staleAfter.has(id));
        if (missing || !(error instanceof IgdbError)) throw error;
      }
    }

    return inOrder(wanted);
  }

  async function search(input: string): Promise<CatalogueGame[]> {
    const query = normaliseSearch(input);
    if (query.length < MIN_QUERY_LENGTH) return [];

    const cached = await store.readSearch(query);
    if (cached && cached.expiresAt.getTime() > now()) return inOrder(cached.gameIds);

    try {
      const candidates = await igdb.query("games", searchCandidatesQuery(query), igdbCandidates);
      const ids = rankCandidates(query, candidates.map(toCandidate));
      const games = await ensure(ids);
      await store.writeSearch(query, ids, new Date(now() + SEARCH_CACHE_MS));
      return games;
    } catch (error) {
      if (cached && error instanceof IgdbError) return inOrder(cached.gameIds);
      throw error;
    }
  }

  /**
   * A game for its own page. A stored game is refreshed if stale; one that
   * was never stored (a shared link, an old bookmark) is fetched by slug.
   * Null means IGDB has no such game, which the page shows as not found.
   */
  async function detail(slug: string): Promise<GameDetail | null> {
    if (!isGameSlug(slug)) return null;

    const stored = await store.idForSlug(slug);
    if (stored !== null) {
      await ensure([stored]);
      return store.readDetail(stored);
    }

    const [game] = await igdb.query("games", gameBySlugQuery(slug), igdbGames);
    if (!game) return null;
    await store.storeBatch(mapGames([game]));
    return store.readDetail(game.id);
  }

  return { search, ensure, detail };
}

export type Catalogue = ReturnType<typeof createCatalogue>;
