import type { CatalogueGame } from "./catalogue";

export const SEARCH_SORTS = [
  { value: "best", label: "Best match" },
  { value: "rated", label: "Most rated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title, A to Z" },
] as const;

export type SearchSort = (typeof SEARCH_SORTS)[number]["value"];

export const SEARCH_LAYOUTS = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
] as const;

export type SearchLayout = (typeof SEARCH_LAYOUTS)[number]["value"];

/** Covers first: search is where you recognise a game by its art. */
export function parseSearchLayout(value: string | null | undefined): SearchLayout {
  return value === "list" ? "list" : "grid";
}

/** The address for a search; the default sort and layout are left out. */
export function searchParamsFor(view: {
  query: string;
  sort: SearchSort;
  layout: SearchLayout;
}): URLSearchParams {
  const params = new URLSearchParams({ q: view.query });
  if (view.sort !== "best") params.set("sort", view.sort);
  if (view.layout !== "grid") params.set("view", view.layout);
  return params;
}

export function parseSearchSort(value: string | null | undefined): SearchSort {
  return SEARCH_SORTS.find((sort) => sort.value === value)?.value ?? "best";
}

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function ratingCount(game: CatalogueGame): number {
  return game.igdbRatingCount + game.criticRatingCount;
}

/**
 * Reorders results for display. "Best match" is the order search returned.
 * Games without a release date go last whichever way dates are sorted: an
 * unannounced date is neither new nor old.
 */
export function sortResults(games: readonly CatalogueGame[], sort: SearchSort): CatalogueGame[] {
  const indexed = games.map((game, index) => ({ game, index }));
  const byDate =
    (direction: 1 | -1) => (a: (typeof indexed)[number], b: (typeof indexed)[number]) => {
      const x = a.game.firstReleaseDate;
      const y = b.game.firstReleaseDate;
      if (x === y) return a.index - b.index;
      if (x === null) return 1;
      if (y === null) return -1;
      return direction * (x < y ? -1 : 1);
    };

  switch (sort) {
    case "best":
      return [...games];
    case "rated":
      indexed.sort((a, b) => ratingCount(b.game) - ratingCount(a.game) || a.index - b.index);
      break;
    case "newest":
      indexed.sort(byDate(-1));
      break;
    case "oldest":
      indexed.sort(byDate(1));
      break;
    case "title":
      indexed.sort((a, b) => collator.compare(a.game.name, b.game.name) || a.index - b.index);
      break;
  }
  return indexed.map(({ game }) => game);
}

/** The last search, so coming back to Search picks up where it was left. */
export const LAST_SEARCH_COOKIE = "parlour-search";

/**
 * Where to send a bare visit to Search: the remembered search, if it is
 * one. Anything that does not hold a real query is ignored, so a bad cookie
 * can never cause a redirect loop.
 */
export function rememberedSearch(cookie: string | undefined): string | null {
  if (!cookie) return null;
  const saved = new URLSearchParams(cookie);
  const query = saved.get("q")?.trim() ?? "";
  if (query === "") return null;
  return searchParamsFor({
    query,
    sort: parseSearchSort(saved.get("sort")),
    layout: parseSearchLayout(saved.get("view")),
  }).toString();
}
