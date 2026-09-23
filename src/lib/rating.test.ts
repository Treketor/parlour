// @vitest-environment node
import { describe, expect, it } from "vitest";
import { clampRating, describeRating, isRating, ratingAtPosition, ratingForKey } from "./rating";

describe("isRating", () => {
  it("accepts whole numbers from 1 to 10", () => {
    expect([1, 5, 10].every(isRating)).toBe(true);
  });

  it.each([0, 11, 7.5, -1, Number.NaN, "7", null])("rejects %s", (value) => {
    expect(isRating(value)).toBe(false);
  });
});

describe("clampRating", () => {
  it("rounds and clamps into range", () => {
    expect(clampRating(0)).toBe(1);
    expect(clampRating(14)).toBe(10);
    expect(clampRating(6.6)).toBe(7);
  });
});

describe("ratingForKey", () => {
  it("steps up from unrated to the minimum", () => {
    expect(ratingForKey(null, "ArrowRight")).toBe(1);
    expect(ratingForKey(null, "ArrowUp")).toBe(1);
  });

  it("stays unrated when stepping down from unrated", () => {
    expect(ratingForKey(null, "ArrowLeft")).toBeNull();
  });

  it("steps within bounds", () => {
    expect(ratingForKey(5, "ArrowRight")).toBe(6);
    expect(ratingForKey(5, "ArrowDown")).toBe(4);
    expect(ratingForKey(10, "ArrowRight")).toBe(10);
    expect(ratingForKey(1, "ArrowLeft")).toBe(1);
  });

  it("pages in steps of three", () => {
    expect(ratingForKey(9, "PageUp")).toBe(10);
    expect(ratingForKey(null, "PageUp")).toBe(3);
    expect(ratingForKey(2, "PageDown")).toBe(1);
  });

  it("jumps to the ends", () => {
    expect(ratingForKey(4, "Home")).toBe(1);
    expect(ratingForKey(4, "End")).toBe(10);
  });

  it("sets directly from digit keys, with 0 meaning 10", () => {
    expect(ratingForKey(null, "7")).toBe(7);
    expect(ratingForKey(3, "0")).toBe(10);
  });

  it("clears on Backspace and Delete", () => {
    expect(ratingForKey(8, "Backspace")).toBeNull();
    expect(ratingForKey(8, "Delete")).toBeNull();
  });

  it("ignores keys it does not handle", () => {
    expect(ratingForKey(8, "Tab")).toBeUndefined();
    expect(ratingForKey(8, "a")).toBeUndefined();
  });
});

describe("ratingAtPosition", () => {
  it("maps each tenth of the width to one value", () => {
    expect(ratingAtPosition(0, 200)).toBe(1);
    expect(ratingAtPosition(19.9, 200)).toBe(1);
    expect(ratingAtPosition(20, 200)).toBe(2);
    expect(ratingAtPosition(199, 200)).toBe(10);
  });

  it("clamps positions outside the scale while dragging", () => {
    expect(ratingAtPosition(-40, 200)).toBe(1);
    expect(ratingAtPosition(260, 200)).toBe(10);
  });

  it("does not divide by zero before layout", () => {
    expect(ratingAtPosition(10, 0)).toBe(1);
  });
});

describe("describeRating", () => {
  it("names unrated explicitly", () => {
    expect(describeRating(null)).toBe("Not rated");
    expect(describeRating(7)).toBe("7 out of 10");
  });
});
