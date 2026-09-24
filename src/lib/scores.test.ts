// @vitest-environment node
import { describe, expect, it } from "vitest";
import { combinedScore, compactCount } from "./scores";

describe("combinedScore", () => {
  it("weights each average by how many ratings it rests on", () => {
    // Hades: players 89 from 1,757, critics 94 from 17.
    expect(combinedScore({ rating: 89, count: 1757 }, { rating: 94, count: 17 })).toEqual({
      value: 89,
      count: 1774,
    });
  });

  it("works with only one kind of score", () => {
    expect(combinedScore({ rating: null, count: 0 }, { rating: 84.7, count: 12 })).toEqual({
      value: 85,
      count: 12,
    });
  });

  it("shows nothing with fewer than ten ratings behind it", () => {
    expect(combinedScore({ rating: 95, count: 4 }, { rating: 90, count: 5 })).toBeNull();
  });

  it("ignores a count with no score attached", () => {
    expect(combinedScore({ rating: null, count: 50 }, { rating: 80, count: 3 })).toBeNull();
  });
});

describe("compactCount", () => {
  it.each([
    [7, "7"],
    [940, "940"],
    [1000, "1k"],
    [1774, "1.7k"],
    [12_450, "12k"],
  ])("%d reads as %s", (count, text) => {
    expect(compactCount(count)).toBe(text);
  });
});
