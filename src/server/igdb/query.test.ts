// @vitest-environment node
import { describe, expect, it } from "vitest";
import { gamesByIdQuery, normaliseSearch, quote, searchGamesQuery } from "./query";

describe("quote", () => {
  it("wraps plain text in double quotes", () => {
    expect(quote("outer wilds")).toBe('"outer wilds"');
  });

  it("escapes quotes and backslashes so a search cannot break out of its string", () => {
    expect(quote('x"; fields *; where id = 1; "')).toBe('"x\\"; fields *; where id = 1; \\""');
    expect(quote("back\\slash")).toBe('"back\\\\slash"');
  });

  it("flattens newlines", () => {
    expect(quote("two\nlines")).toBe('"two lines"');
  });
});

describe("normaliseSearch", () => {
  it("trims, collapses whitespace and lower-cases", () => {
    expect(normaliseSearch("  Outer   WILDS \t")).toBe("outer wilds");
  });

  it("caps very long input", () => {
    expect(normaliseSearch("a".repeat(300))).toHaveLength(100);
  });
});

describe("searchGamesQuery", () => {
  it("searches playable game types only, without editions", () => {
    const query = searchGamesQuery("hades");
    expect(query).toContain('search "hades";');
    expect(query).toContain("where game_type = (0,4,8,9,10,11) & version_parent = null;");
    expect(query).toContain("limit 20;");
  });

  it("clamps the limit to what IGDB allows", () => {
    expect(searchGamesQuery("x", 9000)).toContain("limit 500;");
    expect(searchGamesQuery("x", 0)).toContain("limit 1;");
  });
});

describe("gamesByIdQuery", () => {
  it("asks for each id once, with a matching limit", () => {
    expect(gamesByIdQuery([11737, 11737, 81249])).toMatch(/where id = \(11737,81249\); limit 2;$/);
  });

  it("refuses an empty or invalid id list", () => {
    expect(() => gamesByIdQuery([])).toThrow();
    expect(() => gamesByIdQuery([-1, 1.5, Number.NaN])).toThrow();
  });
});
