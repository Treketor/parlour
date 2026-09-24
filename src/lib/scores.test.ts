// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  MIN_CRITIC_REVIEWS,
  MIN_RATINGS,
  combinedScore,
  compactCount,
  scoreTier,
  sourceScore,
} from "./scores";

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

describe("scoreTier", () => {
  it.each([
    [94, "high"],
    [85, "high"],
    [84, "mid"],
    [70, "mid"],
    [69, "low"],
  ] as const)("%d is %s", (value, tier) => {
    expect(scoreTier(value)).toBe(tier);
  });
});

describe("sourceScore", () => {
  it("rounds a score with enough ratings behind it", () => {
    expect(sourceScore(86.4, 12, MIN_RATINGS)).toBe(86);
    expect(sourceScore(91.6, 3, MIN_CRITIC_REVIEWS)).toBe(92);
  });

  it("withholds a score with too few ratings or none at all", () => {
    expect(sourceScore(90, 9, MIN_RATINGS)).toBeNull();
    expect(sourceScore(90, 2, MIN_CRITIC_REVIEWS)).toBeNull();
    expect(sourceScore(null, 40, MIN_RATINGS)).toBeNull();
  });
});
