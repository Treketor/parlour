import "server-only";
import { SCORE_SOURCES, type ExternalScore } from "@/lib/external-scores";
import { serverEnv } from "../env";
import { adminClient } from "../supabase-admin";
import { fetchRawgScores, fetchSteamScore } from "./providers";
import { createScoreService, type ScoreService, type ScoreStore } from "./service";

const databaseStore: ScoreStore = {
  async read(gameId) {
    const [scores, check] = await Promise.all([
      adminClient()
        .from("game_scores")
        .select("source, score, out_of, count, label, url")
        .eq("game_id", gameId),
      adminClient()
        .from("game_score_checks")
        .select("checked_at")
        .eq("game_id", gameId)
        .maybeSingle(),
    ]);
    if (scores.error) throw scores.error;
    if (check.error) throw check.error;

    return {
      checkedAt: check.data ? new Date(check.data.checked_at) : null,
      scores: scores.data.flatMap((row): ExternalScore[] => {
        const source = SCORE_SOURCES.find((known) => known === row.source);
        const outOf = row.out_of === 5 || row.out_of === 100 ? row.out_of : null;
        if (!source || outOf === null) return [];
        return [
          {
            source,
            score: Number(row.score),
            outOf,
            count: row.count,
            label: row.label,
            url: row.url,
          },
        ];
      }),
    };
  },

  async write(gameId, scores, checked) {
    if (checked) {
      const { error } = await adminClient().rpc("store_game_scores", {
        target_game_id: gameId,
        scores: scores.map((score) => ({
          source: score.source,
          score: score.score,
          out_of: score.outOf,
          count: score.count,
          label: score.label,
          url: score.url,
        })),
      });
      if (error) throw error;
    }
    // A failed lookup writes nothing: the last good scores stay, and the
    // missing check means the next visit tries again.
  },
};

let service: ScoreService | undefined;

/** Outside review scores for the game page, cached weekly in Postgres. Server only. */
export function getScoreService(): ScoreService {
  const rawgKey = serverEnv.rawgApiKey;
  service ??= createScoreService({
    store: databaseStore,
    sources: {
      rawg: rawgKey ? (game) => fetchRawgScores(game, rawgKey) : null,
      steam: (appId) => fetchSteamScore(appId),
    },
  });
  return service;
}

/** Search results given a Metacritic lookup after each search; enough to cover the first screen. */
const SEARCH_FILL_LIMIT = 12;

/**
 * What search can show without asking anyone: the metascores already known
 * for these games. Games never checked are looked up after the response has
 * gone (DECISIONS.md 046), so their scores are there next time.
 */
export async function metascoresFor(ids: readonly number[]): Promise<{
  metascores: Record<number, number>;
  fill: () => Promise<void>;
}> {
  if (ids.length === 0) return { metascores: {}, fill: async () => {} };

  const [scores, checks, games] = await Promise.all([
    adminClient()
      .from("game_scores")
      .select("game_id, score")
      .eq("source", "metacritic")
      .in("game_id", [...ids]),
    adminClient()
      .from("game_score_checks")
      .select("game_id")
      .in("game_id", [...ids]),
    adminClient()
      .from("games")
      .select("id, name, slug, first_release_date, game_external_ids(source, uid)")
      .in("id", [...ids]),
  ]);
  if (scores.error) throw scores.error;
  if (checks.error) throw checks.error;
  if (games.error) throw games.error;

  const checked = new Set(checks.data.map((row) => row.game_id));
  const unchecked = ids
    .filter((id) => !checked.has(id))
    .slice(0, SEARCH_FILL_LIMIT)
    .flatMap((id) => games.data.filter((game) => game.id === id));

  return {
    metascores: Object.fromEntries(scores.data.map((row) => [row.game_id, Number(row.score)])),
    async fill() {
      // One at a time: a background top-up should never burst against RAWG's limits.
      for (const game of unchecked) {
        try {
          await getScoreService().scoresFor({
            id: game.id,
            name: game.name,
            slug: game.slug,
            firstReleaseDate: game.first_release_date,
            steamAppIds: game.game_external_ids
              .filter((external) => external.source === "steam")
              .map((external) => external.uid),
          });
        } catch (error) {
          console.error("Filling search scores failed", error);
        }
      }
    },
  };
}
