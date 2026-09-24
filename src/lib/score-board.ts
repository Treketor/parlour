import { MIN_USER_REVIEWS, type ExternalScore } from "./external-scores";
import { MIN_CRITIC_REVIEWS, MIN_RATINGS, sourceScore } from "./scores";

/*
 * The game page's scores: critics and players, each led by the most
 * credible source that has something to say (DECISIONS.md 042). Critics:
 * Metacritic, then IGDB's critic aggregate. Players: Steam's reviews, the
 * largest pool of verified owners, then IGDB, then RAWG.
 */

export type BoardScore = {
  source: string;
  /** As the source states it: "99", "96%", "4.4/5". */
  value: string;
  /** On a 0 to 100 scale, for the colour band. */
  percent: number;
  /** What it rests on: "From 1,860 ratings", "Overwhelmingly Positive, 150,000 reviews". */
  basis: string;
  url: string | null;
};

export type ScoreColumn = { primary: BoardScore | null; others: BoardScore[] };

export type ScoreBoard = { critics: ScoreColumn; players: ScoreColumn };

type IgdbScores = {
  igdbRating: number | null;
  igdbRatingCount: number;
  criticRating: number | null;
  criticRatingCount: number;
};

function counted(count: number, noun: string): string {
  return `${count.toLocaleString("en-GB")} ${count === 1 ? noun : `${noun}s`}`;
}

function fromExternal(score: ExternalScore): BoardScore | null {
  switch (score.source) {
    case "metacritic":
      return {
        source: "Metacritic",
        value: String(Math.round(score.score)),
        percent: score.score,
        basis: "Metascore",
        url: score.url,
      };
    case "steam":
      if ((score.count ?? 0) < MIN_USER_REVIEWS) return null;
      return {
        source: "Steam",
        value: `${Math.round(score.score)}%`,
        percent: score.score,
        basis: [score.label, counted(score.count ?? 0, "review")].filter(Boolean).join(", "),
        url: score.url,
      };
    case "rawg":
      if ((score.count ?? 0) < MIN_USER_REVIEWS) return null;
      return {
        source: "RAWG",
        value: `${score.score.toFixed(1)}/5`,
        percent: (score.score / score.outOf) * 100,
        basis: `From ${counted(score.count ?? 0, "rating")}`,
        url: score.url,
      };
  }
}

function column(candidates: ReadonlyArray<BoardScore | null>): ScoreColumn {
  const present = candidates.filter((score): score is BoardScore => score !== null);
  return { primary: present[0] ?? null, others: present.slice(1) };
}

export function scoreBoard(igdb: IgdbScores, external: readonly ExternalScore[]): ScoreBoard {
  const find = (source: ExternalScore["source"]) => {
    const score = external.find((candidate) => candidate.source === source);
    return score ? fromExternal(score) : null;
  };

  const igdbCritics = sourceScore(igdb.criticRating, igdb.criticRatingCount, MIN_CRITIC_REVIEWS);
  const igdbPlayers = sourceScore(igdb.igdbRating, igdb.igdbRatingCount, MIN_RATINGS);

  return {
    critics: column([
      find("metacritic"),
      igdbCritics === null
        ? null
        : {
            source: "IGDB critics",
            value: String(igdbCritics),
            percent: igdbCritics,
            basis: `From ${counted(igdb.criticRatingCount, "review")}`,
            url: null,
          },
    ]),
    players: column([
      find("steam"),
      igdbPlayers === null
        ? null
        : {
            source: "IGDB players",
            value: String(igdbPlayers),
            percent: igdbPlayers,
            basis: `From ${counted(igdb.igdbRatingCount, "rating")}`,
            url: null,
          },
      find("rawg"),
    ]),
  };
}
