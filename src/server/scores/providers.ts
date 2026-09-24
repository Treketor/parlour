import { z } from "zod";
import type { ExternalScore } from "@/lib/external-scores";
import { rawgScores, steamScore } from "./map";
import { pickRawgMatch, type RawgCandidate } from "./match";

/*
 * The two outside sources. Every response is validated before use, and any
 * failure (network, status, shape, timeout) is thrown as ScoreSourceError so
 * the service can keep the last good scores instead of erasing them.
 */

export class ScoreSourceError extends Error {
  constructor(source: string, cause: unknown) {
    super(`${source} scores could not be fetched`, { cause });
    this.name = "ScoreSourceError";
  }
}

/** Long enough for a slow API, short enough that the page does not wait on it for long. */
const TIMEOUT_MS = 4000;

type Fetch = typeof fetch;

async function getJson<T>(
  source: string,
  url: string,
  schema: z.ZodType<T>,
  fetchImpl: Fetch,
): Promise<T> {
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return schema.parse(await response.json());
  } catch (error) {
    throw new ScoreSourceError(source, error);
  }
}

const rawgCandidate = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
  released: z.string().nullable(),
  metacritic: z.number().int().nullable(),
  rating: z.number(),
  ratings_count: z.number().int(),
}) satisfies z.ZodType<RawgCandidate>;

const rawgSearch = z.object({ results: z.array(rawgCandidate) });
const rawgDetail = z.object({ metacritic_url: z.string().nullish() });

/**
 * Metacritic and RAWG scores for a game, found by name on RAWG's API
 * (api.rawg.io/docs: GET /games with search_precise, GET /games/{id}).
 * An empty list means RAWG has no confident match.
 */
export async function fetchRawgScores(
  game: { name: string; slug: string; firstReleaseDate: string | null },
  apiKey: string,
  fetchImpl: Fetch = fetch,
): Promise<ExternalScore[]> {
  const search = new URLSearchParams({
    key: apiKey,
    search: game.name,
    search_precise: "true",
    page_size: "10",
  });
  const { results } = await getJson(
    "RAWG",
    `https://api.rawg.io/api/games?${search}`,
    rawgSearch,
    fetchImpl,
  );
  const match = pickRawgMatch(game, results);
  if (!match) return [];

  // Only the detail knows the Metacritic page's address; skip the call when there is no metascore.
  let metacriticUrl: string | null = null;
  if (match.metacritic !== null) {
    const detail = await getJson(
      "RAWG",
      `https://api.rawg.io/api/games/${match.id}?${new URLSearchParams({ key: apiKey })}`,
      rawgDetail,
      fetchImpl,
    );
    metacriticUrl = detail.metacritic_url || null;
  }
  return rawgScores(match, metacriticUrl);
}

const steamReviews = z.object({
  success: z.number(),
  query_summary: z.object({
    review_score_desc: z.string(),
    total_positive: z.number().int(),
    total_reviews: z.number().int(),
  }),
});

/**
 * Steam's user reviews for an app (partner.steamgames.com/doc/store/getreviews):
 * no key needed; off-topic review bombs are left out by default. All
 * languages and purchase types count, as the store page counts them.
 */
export async function fetchSteamScore(
  appId: string,
  fetchImpl: Fetch = fetch,
): Promise<ExternalScore | null> {
  if (!/^\d+$/.test(appId)) return null;
  const query = new URLSearchParams({
    json: "1",
    language: "all",
    purchase_type: "all",
    num_per_page: "0",
  });
  const data = await getJson(
    "Steam",
    `https://store.steampowered.com/appreviews/${appId}?${query}`,
    steamReviews,
    fetchImpl,
  );
  if (data.success !== 1) return null;
  return steamScore(appId, data.query_summary);
}
