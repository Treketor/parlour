import { PROGRESS_STATES, type Progress } from "./progress";
import type { Rating } from "./rating";

export type SortDirection = "asc" | "desc";

export type SortableEntry = {
  title: string;
  platform: string;
  progress?: Progress | undefined;
  rating?: Rating | null | undefined;
  addedAt: Date;
};

export type SortKey = "title" | "platform" | "progress" | "rating" | "added";

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

/** "The Elder Scrolls VI" files under E, as it would on a shelf. */
export function sortableTitle(title: string): string {
  return title.replace(/^(the|a|an)\s+/i, "");
}

function compareMissingLast<T>(
  a: T | null | undefined,
  b: T | null | undefined,
  direction: SortDirection,
  compare: (a: T, b: T) => number,
): number {
  // Missing values stay at the bottom in both directions: an unrated game is
  // not "lower" than a 1, it just has no rating.
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const result = compare(a, b);
  return direction === "asc" ? result : -result;
}

export function compareEntries(
  a: SortableEntry,
  b: SortableEntry,
  key: SortKey,
  direction: SortDirection,
): number {
  const flip = direction === "asc" ? 1 : -1;
  let result: number;

  switch (key) {
    case "title":
      result = flip * collator.compare(sortableTitle(a.title), sortableTitle(b.title));
      break;
    case "platform":
      result = flip * collator.compare(a.platform, b.platform);
      break;
    case "progress":
      result = compareMissingLast(a.progress, b.progress, direction, (x, y) => {
        return PROGRESS_STATES.indexOf(x) - PROGRESS_STATES.indexOf(y);
      });
      break;
    case "rating":
      result = compareMissingLast(a.rating, b.rating, direction, (x, y) => x - y);
      break;
    case "added":
      result = flip * (a.addedAt.getTime() - b.addedAt.getTime());
      break;
  }

  // Ties fall back to title so the order is stable and predictable.
  return result || collator.compare(sortableTitle(a.title), sortableTitle(b.title));
}

export function sortEntries<T extends SortableEntry>(
  entries: readonly T[],
  key: SortKey,
  direction: SortDirection,
): T[] {
  return [...entries].sort((a, b) => compareEntries(a, b, key, direction));
}

/** Clicking the active column flips it; a new column starts in its natural direction. */
export function nextSort(
  current: { key: SortKey; direction: SortDirection },
  key: SortKey,
): { key: SortKey; direction: SortDirection } {
  if (current.key === key) {
    return { key, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  // Ratings and dates are most useful highest or newest first.
  return { key, direction: key === "rating" || key === "added" ? "desc" : "asc" };
}
