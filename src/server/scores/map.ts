import type { ExternalScore } from "@/lib/external-scores";
import type { RawgCandidate } from "./match";

/** Metacritic's metascore and RAWG's own player rating, from one RAWG game. */
export function rawgScores(game: RawgCandidate, metacriticUrl: string | null): ExternalScore[] {
  const scores: ExternalScore[] = [];
  if (game.metacritic !== null && game.metacritic > 0) {
    scores.push({
      source: "metacritic",
      score: game.metacritic,
      outOf: 100,
      count: null,
      label: null,
      url: metacriticUrl,
    });
  }
  if (game.ratings_count > 0) {
    scores.push({
      source: "rawg",
      score: Math.round(game.rating * 100) / 100,
      outOf: 5,
      count: game.ratings_count,
      label: null,
      url: `https://rawg.io/games/${encodeURIComponent(game.slug)}`,
    });
  }
  return scores;
}

export type SteamSummary = {
  review_score_desc: string;
  total_positive: number;
  total_reviews: number;
};

/** Steam's share of positive reviews, with its own words for it ("Very Positive"). */
export function steamScore(appId: string, summary: SteamSummary): ExternalScore | null {
  if (summary.total_reviews <= 0) return null;
  return {
    source: "steam",
    score: Math.round((summary.total_positive / summary.total_reviews) * 100),
    outOf: 100,
    count: summary.total_reviews,
    label: summary.review_score_desc || null,
    url: `https://store.steampowered.com/app/${appId}/#app_reviews_hash`,
  };
}
