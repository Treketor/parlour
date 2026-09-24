// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  gamesByIdQuery,
  normaliseSearch,
  quote,
  searchCandidatesQuery,
  gameBySlugQuery,
  isGameSlug,
} from "./query";

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

describe("searchCandidatesQuery", () => {
  it("asks widely for playable game types, without editions, with only ranking fields", () => {
    const query = searchCandidatesQuery("hades");
    expect(query).toContain('search "hades";');
    expect(query).toContain("fields name,total_rating_count,hypes;");
    expect(query).toContain("where game_type = (0,4,8,9,10,11) & version_parent = null;");
    expect(query).toContain("limit 200;");
  });

  it("clamps the limit to what IGDB allows", () => {
    expect(searchCandidatesQuery("x", 9000)).toContain("limit 500;");
    expect(searchCandidatesQuery("x", 0)).toContain("limit 1;");
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

describe("gameBySlugQuery", () => {
  it("asks for one game by slug with every stored field", () => {
    const query = gameBySlugQuery("outer-wilds");
    expect(query).toContain('where slug = "outer-wilds";');
    expect(query).toContain("limit 1;");
    expect(query).toContain("release_dates.release_region");
  });

  it("refuses anything that is not a slug", () => {
    expect(isGameSlug("prey--1")).toBe(true);
    expect(isGameSlug("-zelda")).toBe(false);
    expect(isGameSlug('zelda"; fields *')).toBe(false);
    expect(isGameSlug("Zelda")).toBe(false);
    expect(isGameSlug("zelda-2")).toBe(true);
    expect(() => gameBySlugQuery("bad slug")).toThrow();
  });
});
