import { OWNERSHIP_STATES, type Ownership } from "./ownership";
import { PROGRESS_STATES, type Progress } from "./progress";
import { naturalDirection, type SortDirection, type SortKey, type SortableEntry } from "./sort";

/*
 * How the library is being looked at: layout, order and filters. It lives in
 * the address, so a reload, the back button or a shared link shows the same
 * view, and the server can render it without a flash of the default.
 */

export type LibraryLayout = "list" | "grid";

export type LibraryFilters = {
  /** Empty means every progress state. */
  progress: Progress[];
  ownership: Ownership | null;
  platformId: number | null;
  tag: string | null;
  text: string;
};

export type LibraryViewState = {
  layout: LibraryLayout;
  sort: { key: SortKey; direction: SortDirection };
  filters: LibraryFilters;
};

/** What browsing needs to know about an entry, beyond what sorting needs. */
export type FilterableEntry = SortableEntry & {
  ownership: Ownership;
  platformId: number;
  tags: ReadonlyArray<{ name: string }>;
};

export const LIBRARY_SORTS = [
  { value: "added", label: "Recently added" },
  { value: "title", label: "Title" },
  { value: "platform", label: "Platform" },
  { value: "progress", label: "Progress" },
  { value: "rating", label: "Rating" },
] as const satisfies ReadonlyArray<{ value: SortKey; label: string }>;

export const NO_FILTERS: LibraryFilters = {
  progress: [],
  ownership: null,
  platformId: null,
  tag: null,
  text: "",
};

export const DEFAULT_VIEW: LibraryViewState = {
  layout: "list",
  sort: { key: "added", direction: "desc" },
  filters: NO_FILTERS,
};

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function oneOf<T extends string>(allowed: readonly T[], value: string): T | null {
  return allowed.find((candidate) => candidate === value) ?? null;
}

/** A sort from a select or the address; anything unknown is the default order. */
export function parseLibrarySort(value: string): SortKey {
  return LIBRARY_SORTS.find((sort) => sort.value === value)?.value ?? DEFAULT_VIEW.sort.key;
}

/** Reads a view from query parameters. Anything unrecognised falls back to the default. */
export function parseLibraryView(params: Params): LibraryViewState {
  const sortKey = parseLibrarySort(first(params.sort));
  const direction = oneOf(["asc", "desc"] as const, first(params.dir));
  const platformId = Number(first(params.platform));

  // Repeated or unknown states are dropped rather than rejecting the whole view.
  const progress = PROGRESS_STATES.filter((state) =>
    first(params.progress).split(",").includes(state),
  );

  return {
    layout: first(params.view) === "grid" ? "grid" : "list",
    sort: { key: sortKey, direction: direction ?? naturalDirection(sortKey) },
    filters: {
      progress,
      ownership: oneOf(OWNERSHIP_STATES, first(params.own)),
      platformId: Number.isInteger(platformId) && platformId > 0 ? platformId : null,
      tag: first(params.tag) || null,
      text: first(params.q),
    },
  };
}

/** The shortest query string for a view: defaults are left out, so a plain library is just "/". */
export function libraryViewParams(view: LibraryViewState): URLSearchParams {
  const params = new URLSearchParams();
  const { layout, sort, filters } = view;

  if (layout !== DEFAULT_VIEW.layout) params.set("view", layout);
  if (sort.key !== DEFAULT_VIEW.sort.key) params.set("sort", sort.key);
  if (sort.direction !== naturalDirection(sort.key)) params.set("dir", sort.direction);
  // Written in the canonical order so the same filter always makes the same link.
  const progress = PROGRESS_STATES.filter((state) => filters.progress.includes(state));
  if (progress.length > 0) params.set("progress", progress.join(","));
  if (filters.ownership) params.set("own", filters.ownership);
  if (filters.platformId !== null) params.set("platform", String(filters.platformId));
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.text.trim()) params.set("q", filters.text.trim());
  return params;
}

export function hasFilters(filters: LibraryFilters): boolean {
  return (
    filters.progress.length > 0 ||
    filters.ownership !== null ||
    filters.platformId !== null ||
    filters.tag !== null ||
    filters.text.trim() !== ""
  );
}

/** Lower case with accents removed, so "pokemon" finds "Pokémon". */
function folded(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function filterEntries<T extends FilterableEntry>(
  entries: readonly T[],
  filters: LibraryFilters,
): T[] {
  const words = folded(filters.text).split(/\s+/).filter(Boolean);

  return entries.filter((entry) => {
    if (filters.progress.length > 0) {
      if (!entry.progress || !filters.progress.includes(entry.progress)) return false;
    }
    if (filters.ownership && entry.ownership !== filters.ownership) return false;
    if (filters.platformId !== null && entry.platformId !== filters.platformId) return false;
    if (filters.tag && !entry.tags.some((tag) => tag.name === filters.tag)) return false;
    if (words.length > 0) {
      // Every word has to appear somewhere, in any order: "zelda breath" works.
      const title = folded(entry.title);
      if (!words.every((word) => title.includes(word))) return false;
    }
    return true;
  });
}

/** How many entries are in each progress state, in the canonical order, leaving out empty states. */
export function progressCounts(
  entries: ReadonlyArray<{ progress?: Progress | undefined }>,
): Array<{ progress: Progress; count: number }> {
  return PROGRESS_STATES.map((progress) => ({
    progress,
    count: entries.filter((entry) => entry.progress === progress).length,
  })).filter((row) => row.count > 0);
}
