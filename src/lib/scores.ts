/*
 * Third-party scores are shown only with how many ratings they come from, and
 * not at all below a minimum: a 95 from two people says nothing
 * (DECISIONS.md 003).
 */

export const MIN_CRITIC_RATINGS = 3;
export const MIN_USER_RATINGS = 10;

export type ShownScore = { value: number; count: number };

/** The score to show, rounded to a whole number, or null when there is too little behind it. */
export function scoreToShow(
  rating: number | null,
  count: number,
  minimum: number,
): ShownScore | null {
  if (rating === null || !Number.isFinite(rating) || count < minimum) return null;
  return { value: Math.round(rating), count };
}
