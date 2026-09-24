// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { ExternalScore } from "./external-scores";
import { scoreBoard } from "./score-board";

const igdb = { igdbRating: 91.5, igdbRatingCount: 2167, criticRating: null, criticRatingCount: 0 };

const metacritic: ExternalScore = {
  source: "metacritic",
  score: 99,
  outOf: 100,
  count: null,
  label: null,
  url: "https://www.metacritic.com/game/x/",
};
const steam: ExternalScore = {
  source: "steam",
  score: 96,
  outOf: 100,
  count: 150_000,
  label: "Overwhelmingly Positive",
  url: null,
};
const rawg: ExternalScore = {
  source: "rawg",
  score: 4.46,
  outOf: 5,
  count: 3000,
  label: null,
  url: null,
};

describe("scoreBoard", () => {
  it("leads critics with Metacritic and players with Steam", () => {
    const board = scoreBoard({ ...igdb, criticRating: 95, criticRatingCount: 27 }, [
      metacritic,
      steam,
      rawg,
    ]);
    expect(board.critics.primary).toMatchObject({ source: "Metacritic", value: "99" });
    expect(board.critics.others.map((score) => score.source)).toEqual(["IGDB critics"]);
    expect(board.players.primary).toMatchObject({
      source: "Steam",
      value: "96%",
      basis: "Overwhelmingly Positive, 150,000 reviews",
    });
    expect(board.players.others.map((score) => score.value)).toEqual(["92", "4.5/5"]);
  });

  it("falls back to IGDB when the outside sources have nothing", () => {
    const board = scoreBoard(igdb, []);
    expect(board.critics.primary).toBeNull();
    expect(board.players.primary).toMatchObject({
      source: "IGDB players",
      basis: "From 2,167 ratings",
    });
  });

  it("puts RAWG's stars on the same colour scale", () => {
    const board = scoreBoard({ ...igdb, igdbRating: null, igdbRatingCount: 0 }, [rawg]);
    expect(board.players.primary?.percent).toBeCloseTo(89.2);
  });

  it("leaves out user scores with too few reviews behind them", () => {
    const board = scoreBoard({ ...igdb, igdbRating: null, igdbRatingCount: 0 }, [
      { ...steam, count: 4 },
    ]);
    expect(board.players.primary).toBeNull();
  });
});
