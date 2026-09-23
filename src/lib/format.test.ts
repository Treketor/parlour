// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatCount, formatDate } from "./format";

describe("formatDate", () => {
  it("formats day, three-letter month and year", () => {
    expect(formatDate(new Date("2026-09-12"))).toBe("12 Sep 2026");
    expect(formatDate(new Date("2025-06-04"))).toBe("4 Jun 2025");
  });

  it("uses UTC so the date does not shift with the viewer's timezone", () => {
    expect(formatDate(new Date("2026-01-01T23:30:00Z"))).toBe("1 Jan 2026");
  });
});

describe("formatCount", () => {
  it("uses the singular only for exactly one", () => {
    expect(formatCount(1, "game")).toBe("1 game");
    expect(formatCount(0, "game")).toBe("0 games");
    expect(formatCount(12, "game")).toBe("12 games");
  });

  it("separates thousands and accepts an irregular plural", () => {
    expect(formatCount(1204, "game")).toBe("1,204 games");
    expect(formatCount(2, "entry", "entries")).toBe("2 entries");
  });
});
