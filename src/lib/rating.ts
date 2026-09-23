/*
 * Personal ratings are whole numbers from 1 to 10; null means unrated and is
 * never stored as 0. See DECISIONS.md 003.
 */

export const RATING_MIN = 1;
export const RATING_MAX = 10;

export type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export function isRating(value: unknown): value is Rating {
  return (
    Number.isInteger(value) && (value as number) >= RATING_MIN && (value as number) <= RATING_MAX
  );
}

export function clampRating(value: number): Rating {
  const clamped = Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(value)));
  return clamped as Rating;
}

/**
 * Keyboard model for the rating scale. Returns the next rating, or `undefined`
 * when the key is not one the scale handles (so the browser keeps it).
 *
 * Arrows step, Home and End jump, digit keys set directly with 0 meaning 10
 * (matching the number row), Backspace and Delete clear.
 */
export function ratingForKey(current: Rating | null, key: string): Rating | null | undefined {
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return current === null ? RATING_MIN : clampRating(current + 1);
    case "ArrowLeft":
    case "ArrowDown":
      // Stepping down from unrated has nowhere sensible to go; leave it unrated.
      return current === null ? null : clampRating(current - 1);
    case "PageUp":
      return clampRating((current ?? 0) + 3);
    case "PageDown":
      return current === null ? null : clampRating(current - 3);
    case "Home":
      return RATING_MIN;
    case "End":
      return RATING_MAX;
    case "Backspace":
    case "Delete":
      return null;
    default:
      if (/^[0-9]$/.test(key)) return key === "0" ? RATING_MAX : (Number(key) as Rating);
      return undefined;
  }
}

/**
 * Maps a horizontal pointer position within the scale to a rating, so a press
 * lands where the finger is and dragging scrubs across values.
 */
export function ratingAtPosition(offsetX: number, width: number): Rating {
  if (width <= 0) return RATING_MIN;
  const fraction = offsetX / width;
  return clampRating(Math.floor(fraction * RATING_MAX) + 1);
}

export function describeRating(rating: Rating | null): string {
  return rating === null ? "Not rated" : `${rating} out of ${RATING_MAX}`;
}
