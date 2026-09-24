/*
 * Third-party scores are shown only with how many ratings they come from, and
 * not at all below a minimum: a 95 from two people says nothing
 * (DECISIONS.md 003).
 */

export const MIN_RATINGS = 10;

export type ShownScore = { value: number; count: number };

/**
 * One score from IGDB's player and critic averages, each weighted by how many
 * ratings it rests on, so neither a handful of critics nor a handful of
 * players can dominate. Null when fewer than MIN_RATINGS stand behind it.
 */
export function combinedScore(
  players: { rating: number | null; count: number },
  critics: { rating: number | null; count: number },
): ShownScore | null {
  const parts = [players, critics].filter(
    (part): part is { rating: number; count: number } =>
      part.rating !== null && Number.isFinite(part.rating) && part.count > 0,
  );
  const count = parts.reduce((sum, part) => sum + part.count, 0);
  if (count < MIN_RATINGS) return null;

  const weighted = parts.reduce((sum, part) => sum + part.rating * part.count, 0) / count;
  return { value: Math.round(weighted), count };
}

/** "7", "940", "1.8k", "12k": short enough to sit beside a score. */
export function compactCount(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  return `${thousands < 10 ? Math.floor(thousands * 10) / 10 : Math.floor(thousands)}k`;
}

export type ScoreTier = "high" | "mid" | "low";

/** Colour band for a score: 85 and up, 70 to 84, below 70. */
export function scoreTier(value: number): ScoreTier {
  if (value >= 85) return "high";
  if (value >= 70) return "mid";
  return "low";
}
