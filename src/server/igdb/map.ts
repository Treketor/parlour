import {
  DATE_FORMAT_PRECISION,
  EXTERNAL_SOURCES,
  GAME_TYPES,
  PLATFORM_TYPES,
  RELEASE_REGIONS,
  type DatePrecision,
  type ExternalSource,
} from "./constants";
import type { IgdbGame } from "./schema";

/*
 * IGDB game -> the batch that public.store_igdb_games() writes. Pure, so the
 * exact rows can be tested against saved IGDB responses.
 */

export type PlatformRow = {
  id: number;
  name: string;
  abbreviation: string | null;
  slug: string;
  generation: number | null;
  platform_type: string | null;
};

export type GenreRow = { id: number; name: string; slug: string };

export type GameRow = {
  id: number;
  slug: string;
  name: string;
  summary: string | null;
  first_release_date: string | null;
  cover_image_id: string | null;
  game_type: string | null;
  parent_game_id: number | null;
  version_parent_id: number | null;
  igdb_rating: number | null;
  igdb_rating_count: number;
  critic_rating: number | null;
  critic_rating_count: number;
  igdb_updated_at: string | null;
  platform_ids: number[];
  genre_ids: number[];
  release_dates: Array<{
    id: number;
    platform_id: number | null;
    region: string | null;
    released_on: string | null;
    precision: DatePrecision;
    label: string | null;
  }>;
  media: Array<{
    kind: "cover" | "screenshot" | "artwork";
    image_id: string;
    width: number | null;
    height: number | null;
    position: number;
  }>;
  videos: Array<{ video_id: string; name: string | null; position: number }>;
  external_ids: Array<{ source: ExternalSource; uid: string }>;
};

export type GameBatch = { platforms: PlatformRow[]; genres: GenreRow[]; games: GameRow[] };

// Zero-width and byte-order-mark characters: invisible, but they break sorting,
// matching and search. Seen at the start of real IGDB titles.
const INVISIBLE = /[\u200B-\u200D\u2060\uFEFF]/g;

export function cleanText(value: string): string {
  return value.replace(INVISIBLE, "").trim();
}

function optionalText(value: string | undefined): string | null {
  if (value === undefined) return null;
  const cleaned = cleanText(value);
  return cleaned === "" ? null : cleaned;
}

/** Unix seconds to an ISO calendar date in UTC: IGDB dates are dates, not moments. */
export function unixToDate(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function unixToTimestamp(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

/** 0 to 100 with two decimals, as stored; IGDB sends long floats. */
function score(value: number | undefined): number | null {
  if (value === undefined || !Number.isFinite(value)) return null;
  return Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;
}

function mapGame(game: IgdbGame): GameRow {
  const platformIds = new Set((game.platforms ?? []).map((platform) => platform.id));

  const media: GameRow["media"] = [];
  if (game.cover) {
    media.push({
      kind: "cover",
      image_id: game.cover.image_id,
      width: game.cover.width ?? null,
      height: game.cover.height ?? null,
      position: 0,
    });
  }
  for (const [kind, images] of [
    ["screenshot", game.screenshots ?? []],
    ["artwork", game.artworks ?? []],
  ] as const) {
    images.forEach((image, position) => {
      media.push({
        kind,
        image_id: image.image_id,
        width: image.width ?? null,
        height: image.height ?? null,
        position,
      });
    });
  }

  const externalIds = new Map<string, { source: ExternalSource; uid: string }>();
  for (const external of game.external_games ?? []) {
    const source =
      external.external_game_source === undefined
        ? undefined
        : EXTERNAL_SOURCES[external.external_game_source];
    const uid = external.uid?.trim();
    if (source && uid) externalIds.set(`${source}:${uid}`, { source, uid });
  }

  return {
    id: game.id,
    slug: game.slug,
    name: cleanText(game.name),
    summary: optionalText(game.summary),
    first_release_date:
      game.first_release_date === undefined ? null : unixToDate(game.first_release_date),
    cover_image_id: game.cover?.image_id ?? null,
    game_type: game.game_type === undefined ? null : (GAME_TYPES[game.game_type] ?? null),
    parent_game_id: game.parent_game ?? null,
    version_parent_id: game.version_parent ?? null,
    igdb_rating: score(game.rating),
    igdb_rating_count: game.rating_count ?? 0,
    critic_rating: score(game.aggregated_rating),
    critic_rating_count: game.aggregated_rating_count ?? 0,
    igdb_updated_at: game.updated_at === undefined ? null : unixToTimestamp(game.updated_at),
    platform_ids: [...platformIds],
    genre_ids: (game.genres ?? []).map((genre) => genre.id),
    release_dates: (game.release_dates ?? []).map((release) => {
      const precision =
        release.date_format === undefined
          ? release.date === undefined
            ? "tbd"
            : "day"
          : (DATE_FORMAT_PRECISION[release.date_format] ?? "tbd");
      return {
        id: release.id,
        // A release can name a platform the game's own list does not include;
        // keep the date but drop the link rather than break the foreign key.
        platform_id:
          release.platform !== undefined && platformIds.has(release.platform)
            ? release.platform
            : null,
        region:
          release.release_region === undefined
            ? null
            : (RELEASE_REGIONS[release.release_region] ?? null),
        // Only a full date is a real date; "2026" stored as 1 Jan 2026 would lie.
        released_on:
          precision === "day" && release.date !== undefined ? unixToDate(release.date) : null,
        precision,
        label: optionalText(release.human),
      };
    }),
    media,
    videos: (game.videos ?? []).map((video, position) => ({
      video_id: video.video_id,
      name: optionalText(video.name),
      position,
    })),
    external_ids: [...externalIds.values()],
  };
}

/** Maps a list of games, collecting each platform and genre once for the whole batch. */
export function mapGames(games: readonly IgdbGame[]): GameBatch {
  const platforms = new Map<number, PlatformRow>();
  const genres = new Map<number, GenreRow>();

  for (const game of games) {
    for (const platform of game.platforms ?? []) {
      platforms.set(platform.id, {
        id: platform.id,
        name: cleanText(platform.name),
        abbreviation: optionalText(platform.abbreviation),
        slug: platform.slug,
        generation: platform.generation ?? null,
        platform_type:
          platform.platform_type === undefined
            ? null
            : (PLATFORM_TYPES[platform.platform_type] ?? null),
      });
    }
    for (const genre of game.genres ?? []) {
      genres.set(genre.id, { id: genre.id, name: cleanText(genre.name), slug: genre.slug });
    }
  }

  return {
    platforms: [...platforms.values()],
    genres: [...genres.values()],
    games: games.map(mapGame),
  };
}
