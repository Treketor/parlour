import type { ExternalScore, ScoreSource } from "@/lib/external-scores";
import { ScoreSourceError } from "./providers";

/*
 * Outside scores, looked up at most once a week per game (DECISIONS.md 042).
 * A source that fails keeps its last good scores and leaves the game due for
 * another look; a source that answers "nothing" is remembered as nothing.
 */

export const SCORE_CHECK_MS = 7 * 24 * 60 * 60 * 1000;

export type ScoreStore = {
  read(gameId: number): Promise<{ scores: ExternalScore[]; checkedAt: Date | null }>;
  write(gameId: number, scores: ExternalScore[], checked: boolean): Promise<void>;
};

export type ScoreGame = {
  id: number;
  name: string;
  slug: string;
  firstReleaseDate: string | null;
  /** IGDB can list several (the game, a VR edition, a soundtrack); the busiest one is the game. */
  steamAppIds: readonly string[];
};

/** Enough to cover a game and its editions without a burst of requests per page. */
const MAX_STEAM_APPS = 3;

type Sources = {
  rawg: ((game: ScoreGame) => Promise<ExternalScore[]>) | null;
  steam: (appId: string) => Promise<ExternalScore | null>;
};

type Dependencies = { store: ScoreStore; sources: Sources; now?: () => number };

export function createScoreService({ store, sources, now = Date.now }: Dependencies) {
  async function scoresFor(game: ScoreGame): Promise<ExternalScore[]> {
    const stored = await store.read(game.id);
    const fresh = stored.checkedAt !== null && now() - stored.checkedAt.getTime() < SCORE_CHECK_MS;
    if (fresh) return stored.scores;

    const kept = (sources: readonly ScoreSource[]) =>
      stored.scores.filter((score) => sources.includes(score.source));

    const lookups: Array<Promise<{ ok: boolean; scores: ExternalScore[] }>> = [];
    const settle = (
      work: Promise<ExternalScore[]>,
      owns: readonly ScoreSource[],
    ): Promise<{ ok: boolean; scores: ExternalScore[] }> =>
      work.then(
        (scores) => ({ ok: true, scores }),
        (error: unknown) => {
          if (!(error instanceof ScoreSourceError)) throw error;
          return { ok: false, scores: kept(owns) };
        },
      );

    const appIds = game.steamAppIds.slice(0, MAX_STEAM_APPS);
    if (appIds.length > 0) {
      lookups.push(
        settle(
          Promise.all(appIds.map((appId) => sources.steam(appId))).then((scores) => {
            const busiest = scores
              .filter((score): score is ExternalScore => score !== null)
              .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0];
            return busiest ? [busiest] : [];
          }),
          ["steam"],
        ),
      );
    }
    // Without a RAWG key there is nothing to ask; its old scores, if any, stay.
    lookups.push(
      sources.rawg
        ? settle(sources.rawg(game), ["metacritic", "rawg"])
        : Promise.resolve({ ok: true, scores: kept(["metacritic", "rawg"]) }),
    );

    const results = await Promise.all(lookups);
    const scores = results.flatMap((result) => result.scores);
    await store.write(
      game.id,
      scores,
      results.every((result) => result.ok),
    );
    return scores;
  }

  return { scoresFor };
}

export type ScoreService = ReturnType<typeof createScoreService>;
