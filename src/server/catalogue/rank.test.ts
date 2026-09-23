// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { CatalogueGame } from "@/lib/catalogue";
import { rankResults } from "./rank";

function game(id: number, name: string, ratings = 0): CatalogueGame {
  return {
    id,
    slug: `game-${id}`,
    name,
    summary: null,
    firstReleaseDate: null,
    coverImageId: null,
    gameType: "Main Game",
    platforms: [],
    igdbRating: null,
    igdbRatingCount: ratings,
    criticRating: null,
    criticRatingCount: 0,
  };
}

const ids = (games: CatalogueGame[]) => games.map((item) => item.id);

describe("rankResults", () => {
  it("puts the widely rated game first among exact title matches", () => {
    const results = rankResults("hades", [game(1, "Hades", 0), game(2, "Hades", 1757)]);
    expect(ids(results)).toEqual([2, 1]);
  });

  it("ranks exact matches, then prefix matches, then the rest", () => {
    const results = rankResults("hades", [
      game(1, "H.A.D.E.S Zero", 500),
      game(2, "Hades II", 900),
      game(3, "Hades", 10),
    ]);
    expect(ids(results)).toEqual([3, 2, 1]);
  });

  it("ignores case, accents and punctuation when matching titles", () => {
    const results = rankResults("pokemon", [game(1, "Pokémon Go Plus"), game(2, "POKÉMON")]);
    expect(ids(results)).toEqual([2, 1]);
  });

  it("keeps IGDB's order when nothing else separates two games", () => {
    const results = rankResults("outer", [game(5, "Outer Wilds"), game(6, "Outer Worlds")]);
    expect(ids(results)).toEqual([5, 6]);
  });
});
