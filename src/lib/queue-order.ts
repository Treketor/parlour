import { generateKeyBetween } from "fractional-indexing";

/*
 * Queue order as fractional-index keys (DECISIONS.md 022, 047): a key sorts
 * between its neighbours, so adding or moving a game writes one row and
 * never renumbers the rest. Keys use digits and ASCII letters only, which
 * sort the same in JavaScript and in Postgres's byte ("C") collation.
 */

/** Where a newly queued game goes: after everything, or first in line. */
export type QueuePlace = "next" | "last";

export function keyFor(
  place: QueuePlace,
  ends: { first: string | null; last: string | null },
): string {
  return place === "next"
    ? generateKeyBetween(null, ends.first)
    : generateKeyBetween(ends.last, null);
}

/**
 * The key for an item dropped between two others (either may be missing at
 * the ends). Null when the neighbours are out of order, which means the
 * queue changed elsewhere since it was drawn.
 */
export function keyBetween(before: string | null, after: string | null): string | null {
  if (before !== null && after !== null && before >= after) return null;
  return generateKeyBetween(before, after);
}

/** Byte order, as Postgres sorts the column. */
export function compareKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Places in line by entry id, counting from 1. */
export type QueuePositions = Readonly<Record<string, number>>;

/** The places after queueing an entry: first in line moves everyone down one. */
export function withQueued(
  positions: QueuePositions,
  entryId: string,
  place: QueuePlace,
): QueuePositions {
  if (positions[entryId] !== undefined) return positions;
  if (place === "last") {
    return { ...positions, [entryId]: Object.keys(positions).length + 1 };
  }
  const shifted = Object.fromEntries(
    Object.entries(positions).map(([id, position]) => [id, position + 1]),
  );
  return { ...shifted, [entryId]: 1 };
}

/** The places after taking an entry off: everyone behind it moves up one. */
export function withoutQueued(positions: QueuePositions, entryId: string): QueuePositions {
  const removed = positions[entryId];
  if (removed === undefined) return positions;
  return Object.fromEntries(
    Object.entries(positions)
      .filter(([id]) => id !== entryId)
      .map(([id, position]) => [id, position > removed ? position - 1 : position]),
  );
}
