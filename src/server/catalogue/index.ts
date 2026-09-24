import "server-only";
import type { CatalogueGame } from "@/lib/catalogue";
import { igdb } from "../igdb";
import { adminClient } from "../supabase-admin";
import { createCatalogue, type Catalogue, type CatalogueStore } from "./service";

const GAME_COLUMNS =
  "id, slug, name, summary, first_release_date, cover_image_id, game_type, igdb_rating, igdb_rating_count, critic_rating, critic_rating_count, game_platforms(platforms(id, name, abbreviation, generation))";

const databaseStore: CatalogueStore = {
  async readSearch(query) {
    const { data, error } = await adminClient()
      .from("igdb_search_cache")
      .select("game_ids, expires_at")
      .eq("query", query)
      .maybeSingle();
    if (error) throw error;
    return data ? { gameIds: data.game_ids, expiresAt: new Date(data.expires_at) } : null;
  },

  async writeSearch(query, gameIds, expiresAt) {
    const { error } = await adminClient().from("igdb_search_cache").upsert({
      query,
      game_ids: gameIds,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });
    if (error) throw error;
  },

  async storeBatch(batch) {
    const { error } = await adminClient().rpc("store_igdb_games", { batch });
    if (error) throw error;
  },

  async staleAfter(ids) {
    const { data, error } = await adminClient()
      .from("games")
      .select("id, stale_after")
      .in("id", [...ids]);
    if (error) throw error;
    return new Map(data.map((row) => [row.id, new Date(row.stale_after)]));
  },

  async readGames(ids) {
    const { data, error } = await adminClient()
      .from("games")
      .select(GAME_COLUMNS)
      .in("id", [...ids]);
    if (error) throw error;

    return data.map((row): CatalogueGame => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      summary: row.summary,
      firstReleaseDate: row.first_release_date,
      coverImageId: row.cover_image_id,
      gameType: row.game_type,
      platforms: row.game_platforms
        .flatMap((link) => (link.platforms ? [link.platforms] : []))
        .sort((a, b) => a.name.localeCompare(b.name)),
      igdbRating: row.igdb_rating,
      igdbRatingCount: row.igdb_rating_count,
      criticRating: row.critic_rating,
      criticRatingCount: row.critic_rating_count,
    }));
  },
};

let catalogue: Catalogue | undefined;

/** Search and game lookups, cached in Postgres and backed by IGDB. Server only. */
export function getCatalogue(): Catalogue {
  catalogue ??= createCatalogue({ store: databaseStore, igdb: igdb() });
  return catalogue;
}
