// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MIN_CRITIC_RATINGS, scoreToShow } from "./scores";

describe("scoreToShow", () => {
  it("rounds to a whole number and keeps the count", () => {
    expect(scoreToShow(84.71, 7, MIN_CRITIC_RATINGS)).toEqual({ value: 85, count: 7 });
  });

  it("hides a score with too few ratings behind it", () => {
    expect(scoreToShow(95, 2, MIN_CRITIC_RATINGS)).toBeNull();
  });

  it("shows a score at exactly the minimum", () => {
    expect(scoreToShow(70, 3, MIN_CRITIC_RATINGS)).toEqual({ value: 70, count: 3 });
  });

  it("hides a missing score", () => {
    expect(scoreToShow(null, 100, MIN_CRITIC_RATINGS)).toBeNull();
  });
});
