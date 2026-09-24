import { SEARCHABLE_GAME_TYPES } from "./constants";

/*
 * IGDB queries are Apicalypse text, not JSON. Anything user-typed goes through
 * quote(), because an unescaped quote or semicolon would let a search string
 * rewrite the rest of the query.
 */

/** Every field Parlour stores for a game, fetched in one request via IGDB's expander. */
export const GAME_FIELDS = [
  "name",
  "slug",
  "summary",
  "first_release_date",
  "updated_at",
  "game_type",
  "parent_game",
  "version_parent",
  "rating",
  "rating_count",
  "aggregated_rating",
  "aggregated_rating_count",
  "cover.image_id",
  "cover.width",
  "cover.height",
  "screenshots.image_id",
  "screenshots.width",
  "screenshots.height",
  "artworks.image_id",
  "artworks.width",
  "artworks.height",
  "videos.video_id",
  "videos.name",
  "genres.name",
  "genres.slug",
  "platforms.name",
  "platforms.abbreviation",
  "platforms.slug",
  "platforms.generation",
  "platforms.platform_type",
  "release_dates.date",
  "release_dates.date_format",
  "release_dates.human",
  "release_dates.platform",
  "release_dates.release_region",
  "external_games.uid",
  "external_games.external_game_source",
].join(",");

/** IGDB's query-size ceiling for one request. */
export const MAX_LIMIT = 500;

/** A string literal for an Apicalypse query: backslashes and quotes escaped, newlines flattened. */
export function quote(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, " ");
  return `"${escaped}"`;
}

/**
 * Normalises what someone typed into a stable cache key and a clean search
 * term: trimmed, inner whitespace collapsed, lower-cased, and capped so a
 * pasted paragraph does not become a query.
 */
export function normaliseSearch(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 100);
}

/**
 * Wide and light: up to 200 name matches with only what ranking needs. Full
 * details are fetched afterwards for the best few (DECISIONS.md 031).
 */
export function searchCandidatesQuery(term: string, limit = 200): string {
  return [
    `search ${quote(term)};`,
    "fields name,total_rating_count,hypes;",
    // Editions ("Gold Edition") point at their main game through version_parent;
    // listing them separately would fill results with near-duplicates.
    `where game_type = (${SEARCHABLE_GAME_TYPES.join(",")}) & version_parent = null;`,
    `limit ${Math.min(Math.max(1, Math.trunc(limit)), MAX_LIMIT)};`,
  ].join(" ");
}

export function gamesByIdQuery(ids: readonly number[]): string {
  const clean = [...new Set(ids.filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (clean.length === 0) throw new Error("gamesByIdQuery needs at least one valid id");
  if (clean.length > MAX_LIMIT) throw new Error(`gamesByIdQuery takes at most ${MAX_LIMIT} ids`);
  return `fields ${GAME_FIELDS}; where id = (${clean.join(",")}); limit ${clean.length};`;
}

/**
 * IGDB slugs are lower-case words joined by hyphens, doubled for a repeated
 * title ("prey--1"); anything else is not worth a request.
 */
export function isGameSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(value) && value.length <= 200;
}

/** One game by its slug, for a game page reached before the game was ever stored. */
export function gameBySlugQuery(slug: string): string {
  if (!isGameSlug(slug)) throw new Error("gameBySlugQuery needs a valid slug");
  return `fields ${GAME_FIELDS}; where slug = ${quote(slug)}; limit 1;`;
}
