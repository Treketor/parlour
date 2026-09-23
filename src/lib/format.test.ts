// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatDate } from "./format";

describe("formatDate", () => {
  it("formats day, three-letter month and year", () => {
    expect(formatDate(new Date("2026-09-12"))).toBe("12 Sep 2026");
    expect(formatDate(new Date("2025-06-04"))).toBe("4 Jun 2025");
  });

  it("uses UTC so the date does not shift with the viewer's timezone", () => {
    expect(formatDate(new Date("2026-01-01T23:30:00Z"))).toBe("1 Jan 2026");
  });
});
