import "server-only";
import type { CatalogueGame } from "@/lib/catalogue";
import type { MediaImage } from "@/lib/game-detail";
import { igdb } from "../igdb";
import { adminClient } from "../supabase-admin";
import { createCatalogue, type Catalogue, type CatalogueStore } from "./service";

const GAME_COLUMNS =
  "id, slug, name, summary, first_release_date, cover_image_id, game_type, igdb_rating, igdb_rating_count, critic_rating, critic_rating_count, game_platforms(platforms(id, name, abbreviation, generation))";

const DETAIL_COLUMNS = `${GAME_COLUMNS},
  game_genres(genres(name)),
  release_dates(platform_id, region, released_on, precision, label, platforms(name)),
  game_media(kind, image_id, width, height, position),
  game_videos(video_id, name, position),
  game_external_ids(source, uid)`;

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

    return data.map(toCatalogueGame);
  },

  async idForSlug(slug) {
    const { data, error } = await adminClient()
      .from("games")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  },

  async readDetail(id) {
    const { data, error } = await adminClient()
      .from("games")
      .select(DETAIL_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;
    const images = (kind: string): MediaImage[] =>
      data.game_media
        .filter((media) => media.kind === kind)
        .sort(byPosition)
        .map((media) => ({ imageId: media.image_id, width: media.width, height: media.height }));

    return {
      ...toCatalogueGame(data),
      genres: data.game_genres
        .flatMap((link) => (link.genres ? [link.genres.name] : []))
        .sort((a, b) => a.localeCompare(b)),
      releases: data.release_dates.map((release) => ({
        platformId: release.platform_id,
        platform: release.platforms?.name ?? null,
        releasedOn: release.released_on,
        precision: PRECISIONS.find((precision) => precision === release.precision) ?? "tbd",
        label: release.label,
        region: release.region,
      })),
      screenshots: images("screenshot"),
      artworks: images("artwork"),
      videos: [...data.game_videos]
        .sort(byPosition)
        .map((video) => ({ id: video.video_id, name: video.name })),
      externalIds: data.game_external_ids.flatMap((external) => {
        const source = SOURCES.find((known) => known === external.source);
        return source ? [{ source, uid: external.uid }] : [];
      }),
    };
  },
};

const PRECISIONS = ["day", "month", "year", "quarter", "tbd"] as const;
const SOURCES = ["steam", "gog", "epic"] as const;

type GameRow = {
  id: number;
  slug: string;
  name: string;
  summary: string | null;
  first_release_date: string | null;
  cover_image_id: string | null;
  game_type: string | null;
  igdb_rating: number | null;
  igdb_rating_count: number;
  critic_rating: number | null;
  critic_rating_count: number;
  game_platforms: Array<{
    platforms: {
      id: number;
      name: string;
      abbreviation: string | null;
      generation: number | null;
    } | null;
  }>;
};

function toCatalogueGame(row: GameRow): CatalogueGame {
  return {
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
  };
}

let catalogue: Catalogue | undefined;

/** Search and game lookups, cached in Postgres and backed by IGDB. Server only. */
export function getCatalogue(): Catalogue {
  catalogue ??= createCatalogue({ store: databaseStore, igdb: igdb() });
  return catalogue;
}
