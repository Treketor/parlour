// @vitest-environment node
import { describe, expect, it } from "vitest";
import { checkedAgo, priceChart } from "./price-chart";

const size = { width: 100, height: 100 };

describe("priceChart", () => {
  it("draws a step line to the end of the span", () => {
    const chart = priceChart(
      [
        { at: "2026-01-01T00:00:00Z", lowest: 20 },
        { at: "2026-01-11T00:00:00Z", lowest: 10 },
      ],
      "2026-01-21T00:00:00Z",
      size,
    );
    // Ceiling is 22: 20 sits at 100 - 20/22*100 = 9.1, 10 at 54.5.
    expect(chart?.path).toBe("M0,9.1H50V54.5H100");
    expect(chart).toMatchObject({ low: 10, high: 20 });
  });

  it("draws a single price as a flat line", () => {
    expect(
      priceChart([{ at: "2026-01-01T00:00:00Z", lowest: 5 }], "2026-02-01T00:00:00Z", size)?.path,
    ).toBe("M0,9.1H100");
  });

  it("has nothing to draw without prices", () => {
    expect(priceChart([], "2026-01-01T00:00:00Z", size)).toBeNull();
  });
});

describe("checkedAgo", () => {
  const now = Date.parse("2026-09-24T12:00:00Z");

  it("says how long ago in the largest whole unit", () => {
    expect(checkedAgo("2026-09-24T11:59:40Z", now)).toBe("Checked just now");
    expect(checkedAgo("2026-09-24T11:59:00Z", now)).toBe("Checked 1 minute ago");
    expect(checkedAgo("2026-09-24T09:00:00Z", now)).toBe("Checked 3 hours ago");
    expect(checkedAgo("2026-09-22T12:00:00Z", now)).toBe("Checked 2 days ago");
  });
});
