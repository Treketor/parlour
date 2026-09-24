// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { CatalogueGame } from "@/lib/catalogue";
import type { IgdbClient } from "../igdb/client";
import { IgdbError } from "../igdb/errors";
import type { GameBatch } from "../igdb/map";
import searchOuterWilds from "../igdb/fixtures/search-outer-wilds.json";
import { SEARCH_CACHE_MS, createCatalogue, type CatalogueStore } from "./service";

const NOW = Date.UTC(2026, 8, 24);
const DAY = 24 * 60 * 60 * 1000;

/** An in-memory store that behaves like the database one. */
function memoryStore() {
  const searches = new Map<string, { gameIds: number[]; expiresAt: Date }>();
  const games = new Map<number, { game: CatalogueGame; staleAfter: Date }>();
  const store: CatalogueStore & { games: typeof games; searches: typeof searches } = {
    games,
    searches,
    readSearch: vi.fn(async (query: string) => searches.get(query) ?? null),
    writeSearch: vi.fn(async (query: string, gameIds: number[], expiresAt: Date) => {
      searches.set(query, { gameIds, expiresAt });
    }),
    storeBatch: vi.fn(async (batch: GameBatch) => {
      for (const row of batch.games) {
        games.set(row.id, {
          staleAfter: new Date(NOW + 7 * DAY),
          game: {
            id: row.id,
            slug: row.slug,
            name: row.name,
            summary: row.summary,
            firstReleaseDate: row.first_release_date,
            coverImageId: row.cover_image_id,
            gameType: row.game_type,
            platforms: [],
            igdbRating: row.igdb_rating,
            igdbRatingCount: row.igdb_rating_count,
            criticRating: row.critic_rating,
            criticRatingCount: row.critic_rating_count,
          },
        });
      }
    }),
    staleAfter: vi.fn(async (ids: readonly number[]) => {
      const result = new Map<number, Date>();
      for (const id of ids) {
        const stored = games.get(id);
        if (stored) result.set(id, stored.staleAfter);
      }
      return result;
    }),
    readGames: vi.fn(async (ids: readonly number[]) =>
      ids.flatMap((id) => {
        const stored = games.get(id);
        return stored ? [stored.game] : [];
      }),
    ),
  };
  return store;
}

/**
 * Answers like IGDB would from saved games: a search gets every game as a
 * candidate, a lookup by id gets just those games.
 */
function igdbReturning(data: unknown[]): IgdbClient & { query: ReturnType<typeof vi.fn> } {
  return {
    query: vi.fn(
      async (_endpoint: string, body: string, schema: { parse(value: unknown): unknown }) => {
        const ids = /where id = (([d,]+))/.exec(body)?.[1]?.split(",").map(Number);
        const rows = ids ? data.filter((row) => ids.includes((row as { id: number }).id)) : data;
        return schema.parse(rows);
      },
    ),
  } as IgdbClient & { query: ReturnType<typeof vi.fn> };
}

function failingIgdb(): IgdbClient & { query: ReturnType<typeof vi.fn> } {
  return {
    query: vi.fn(async () => {
      throw new IgdbError("down", "unavailable");
    }),
  };
}

describe("catalogue.search", () => {
  it("ranks IGDB's candidates, stores the best and caches the result for a day", async () => {
    const store = memoryStore();
    const igdb = igdbReturning(searchOuterWilds);
    const catalogue = createCatalogue({ store, igdb, now: () => NOW });

    const results = await catalogue.search("  Outer   Wilds ");

    expect(results.map((game) => game.id)).toEqual([11737, 304188]);
    expect(igdb.query).toHaveBeenNthCalledWith(
      1,
      "games",
      expect.stringContaining('search "outer wilds";'),
      expect.anything(),
    );
    expect(igdb.query).toHaveBeenNthCalledWith(
      2,
      "games",
      expect.stringContaining("where id = (11737,304188)"),
      expect.anything(),
    );
    expect(store.searches.get("outer wilds")?.expiresAt.getTime()).toBe(NOW + SEARCH_CACHE_MS);
  });

  it("answers a repeated search from the cache without calling IGDB", async () => {
    const store = memoryStore();
    const igdb = igdbReturning(searchOuterWilds);
    const catalogue = createCatalogue({ store, igdb, now: () => NOW });

    await catalogue.search("outer wilds");
    igdb.query.mockClear();
    await catalogue.search("OUTER WILDS");

    expect(igdb.query).not.toHaveBeenCalled();
  });

  it("asks again once the cached search has expired", async () => {
    const store = memoryStore();
    const igdb = igdbReturning(searchOuterWilds);
    let time = NOW;
    const catalogue = createCatalogue({ store, igdb, now: () => time });

    await catalogue.search("outer wilds");
    igdb.query.mockClear();
    time += SEARCH_CACHE_MS + 1;
    await catalogue.search("outer wilds");

    // Asks for candidates again; the games themselves are still fresh, so no detail fetch.
    expect(igdb.query).toHaveBeenCalledTimes(1);
  });

  it("serves an expired cached result when IGDB is down", async () => {
    const store = memoryStore();
    await createCatalogue({ store, igdb: igdbReturning(searchOuterWilds), now: () => NOW }).search(
      "outer wilds",
    );

    const later = createCatalogue({ store, igdb: failingIgdb(), now: () => NOW + 2 * DAY });
    const results = await later.search("outer wilds");

    expect(results.map((game) => game.id)).toEqual([11737, 304188]);
  });

  it("reports the failure when there is nothing cached to fall back on", async () => {
    const catalogue = createCatalogue({
      store: memoryStore(),
      igdb: failingIgdb(),
      now: () => NOW,
    });
    await expect(catalogue.search("outer wilds")).rejects.toBeInstanceOf(IgdbError);
  });

  it("does not search for fewer than two characters", async () => {
    const igdb = igdbReturning([]);
    const catalogue = createCatalogue({ store: memoryStore(), igdb, now: () => NOW });

    expect(await catalogue.search(" a ")).toEqual([]);
    expect(igdb.query).not.toHaveBeenCalled();
  });

  it("caches an empty result too, so a search with no matches is not repeated", async () => {
    const store = memoryStore();
    const igdb = igdbReturning([]);
    const catalogue = createCatalogue({ store, igdb, now: () => NOW });

    await catalogue.search("zzzz nothing");
    await catalogue.search("zzzz nothing");

    expect(igdb.query).toHaveBeenCalledTimes(1);
    expect(store.storeBatch).not.toHaveBeenCalled();
  });
});

describe("catalogue.ensure", () => {
  it("fetches only the games that are missing", async () => {
    const store = memoryStore();
    const igdb = igdbReturning(searchOuterWilds);
    const catalogue = createCatalogue({ store, igdb, now: () => NOW });
    await catalogue.search("outer wilds");
    igdb.query.mockClear();

    const games = await catalogue.ensure([11737]);

    expect(games.map((game) => game.name)).toEqual(["Outer Wilds"]);
    expect(igdb.query).not.toHaveBeenCalled();
  });

  it("refetches a stale game", async () => {
    const store = memoryStore();
    const igdb = igdbReturning(searchOuterWilds);
    await createCatalogue({ store, igdb, now: () => NOW }).search("outer wilds");
    igdb.query.mockClear();

    await createCatalogue({ store, igdb, now: () => NOW + 8 * DAY }).ensure([11737]);

    expect(igdb.query).toHaveBeenCalledWith(
      "games",
      expect.stringContaining("where id = (11737)"),
      expect.anything(),
    );
  });

  it("keeps a stale game when IGDB is down, but fails for a missing one", async () => {
    const store = memoryStore();
    await createCatalogue({ store, igdb: igdbReturning(searchOuterWilds), now: () => NOW }).search(
      "outer wilds",
    );
    const offline = createCatalogue({ store, igdb: failingIgdb(), now: () => NOW + 8 * DAY });

    await expect(offline.ensure([11737])).resolves.toHaveLength(1);
    await expect(offline.ensure([11737, 999])).rejects.toBeInstanceOf(IgdbError);
  });
});
