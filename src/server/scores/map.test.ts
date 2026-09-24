// @vitest-environment node
import { describe, expect, it } from "vitest";
import { rawgScores, steamScore } from "./map";

describe("rawgScores", () => {
  const game = {
    id: 1,
    slug: "the-witcher-3-wild-hunt",
    name: "The Witcher 3: Wild Hunt",
    released: "2015-05-18",
    metacritic: 92,
    rating: 4.656,
    ratings_count: 6400,
  };

  it("gives the metascore and RAWG's own rating", () => {
    expect(rawgScores(game, "https://www.metacritic.com/game/the-witcher-3-wild-hunt/")).toEqual([
      {
        source: "metacritic",
        score: 92,
        outOf: 100,
        count: null,
        label: null,
        url: "https://www.metacritic.com/game/the-witcher-3-wild-hunt/",
      },
      {
        source: "rawg",
        score: 4.66,
        outOf: 5,
        count: 6400,
        label: null,
        url: "https://rawg.io/games/the-witcher-3-wild-hunt",
      },
    ]);
  });

  it("leaves out what RAWG does not have", () => {
    expect(rawgScores({ ...game, metacritic: null, ratings_count: 0 }, null)).toEqual([]);
  });
});

describe("steamScore", () => {
  it("turns positive reviews into a percentage with Steam's words", () => {
    expect(
      steamScore("49520", {
        review_score_desc: "Very Positive",
        total_positive: 93_000,
        total_reviews: 100_000,
      }),
    ).toEqual({
      source: "steam",
      score: 93,
      outOf: 100,
      count: 100_000,
      label: "Very Positive",
      url: "https://store.steampowered.com/app/49520/#app_reviews_hash",
    });
  });

  it("is null for a game with no reviews", () => {
    expect(
      steamScore("1", {
        review_score_desc: "No user reviews",
        total_positive: 0,
        total_reviews: 0,
      }),
    ).toBeNull();
  });
});
