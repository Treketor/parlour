// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { CatalogueGame } from "./catalogue";
import { parseSearchSort, sortResults } from "./search-sort";

function game(id: number, name: string, date: string | null, ratings = 0): CatalogueGame {
  return {
    id,
    slug: `g${id}`,
    name,
    summary: null,
    firstReleaseDate: date,
    coverImageId: null,
    gameType: null,
    platforms: [],
    igdbRating: null,
    igdbRatingCount: ratings,
    criticRating: null,
    criticRatingCount: 0,
  };
}

const games = [
  game(1, "Pokémon Red Version", "1996-02-27", 604),
  game(2, "Pokémon Legends: Z-A", null, 72),
  game(3, "Pokémon Emerald Version", "2004-09-16", 634),
  game(4, "Pokémon Violet", "2022-11-18", 129),
];
const ids = (list: CatalogueGame[]) => list.map((item) => item.id);

describe("sortResults", () => {
  it("keeps search order for best match", () => {
    expect(ids(sortResults(games, "best"))).toEqual([1, 2, 3, 4]);
  });

  it("sorts by how many ratings a game has", () => {
    expect(ids(sortResults(games, "rated"))).toEqual([3, 1, 4, 2]);
  });

  it("puts games without a date last whichever way dates run", () => {
    expect(ids(sortResults(games, "newest"))).toEqual([4, 3, 1, 2]);
    expect(ids(sortResults(games, "oldest"))).toEqual([1, 3, 4, 2]);
  });

  it("sorts titles alphabetically, ignoring accents", () => {
    expect(ids(sortResults(games, "title"))).toEqual([3, 2, 1, 4]);
  });

  it("does not change the input", () => {
    sortResults(games, "title");
    expect(ids(games)).toEqual([1, 2, 3, 4]);
  });
});

describe("parseSearchSort", () => {
  it("accepts known sorts and falls back to best match", () => {
    expect(parseSearchSort("newest")).toBe("newest");
    expect(parseSearchSort("nonsense")).toBe("best");
    expect(parseSearchSort(null)).toBe("best");
  });
});
