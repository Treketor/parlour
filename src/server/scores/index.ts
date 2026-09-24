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
