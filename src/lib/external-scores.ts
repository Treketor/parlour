/*
 * Review scores from outside IGDB (DECISIONS.md 042). Safe to send to the
 * browser: this is the shape the game page draws.
 */

export const SCORE_SOURCES = ["metacritic", "steam", "rawg"] as const;
export type ScoreSource = (typeof SCORE_SOURCES)[number];

export type ExternalScore = {
  source: ScoreSource;
  /** On the source's own scale, given by outOf. */
  score: number;
  outOf: 5 | 100;
  /** Reviews or ratings behind it; null when the source does not say (a metascore). */
  count: number | null;
  /** The source's own words, e.g. Steam's "Overwhelmingly Positive". */
  label: string | null;
  url: string | null;
};

/** Below this many user reviews a percentage or an average says little; Metacritic sets its own bar. */
export const MIN_USER_REVIEWS = 10;
