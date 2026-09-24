// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  formatMoney,
  inCurrency,
  historyFrom,
  lowestOverTime,
  mainCurrency,
  parseRegion,
  regionFromAcceptLanguage,
  type PriceEvent,
} from "./prices";

describe("parseRegion", () => {
  it("accepts offered regions in any case and refuses the rest", () => {
    expect(parseRegion("gb")).toBe("GB");
    expect(parseRegion(" US ")).toBe("US");
    expect(parseRegion("XX")).toBeNull();
    expect(parseRegion(undefined)).toBeNull();
  });
});

describe("regionFromAcceptLanguage", () => {
  it("takes the first language with a region Parlour offers", () => {
    expect(regionFromAcceptLanguage("en-GB,en;q=0.9")).toBe("GB");
    expect(regionFromAcceptLanguage("en,de-DE;q=0.8")).toBe("DE");
    expect(regionFromAcceptLanguage("en")).toBeNull();
    expect(regionFromAcceptLanguage(null)).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats with the currency's own symbol", () => {
    expect(formatMoney({ amount: 2.18, currency: "GBP" })).toBe("£2.18");
    expect(formatMoney({ amount: 19.99, currency: "EUR" })).toBe("€19.99");
    expect(formatMoney({ amount: 19.99, currency: "USD" })).toBe("US$19.99");
    expect(formatMoney({ amount: 29.95, currency: "AUD" })).toBe("A$29.95");
  });

  it("falls back to the code for a currency it does not know", () => {
    expect(formatMoney({ amount: 5, currency: "not-a-code" })).toBe("5.00 not-a-code");
  });
});

describe("inCurrency and mainCurrency", () => {
  const prices = [
    { price: { amount: 2, currency: "GBP" } },
    { price: { amount: 27.49, currency: "USD" } },
    { price: { amount: 5, currency: "GBP" } },
  ];

  it("keeps only the region's currency", () => {
    expect(inCurrency(prices, "GBP")).toHaveLength(2);
  });

  it("finds the currency most prices use", () => {
    expect(mainCurrency(prices.map((item) => item.price))).toBe("GBP");
    expect(mainCurrency([])).toBeNull();
  });
});

describe("lowestOverTime", () => {
  const gbp = (amount: number) => ({ amount, currency: "GBP" });
  const events: PriceEvent[] = [
    { at: "2026-03-01T00:00:00Z", shop: "Steam", price: gbp(19.99) },
    { at: "2026-01-01T00:00:00Z", shop: "GOG", price: gbp(24.99) },
    { at: "2026-05-01T00:00:00Z", shop: "Steam", price: gbp(4.99) },
    { at: "2026-05-08T00:00:00Z", shop: "Steam", price: gbp(19.99) },
    { at: "2026-06-01T00:00:00Z", shop: "Elsewhere", price: { amount: 1, currency: "USD" } },
  ];

  it("follows the cheapest shop, oldest first, in one currency", () => {
    expect(lowestOverTime(events, "GBP")).toEqual([
      { at: "2026-01-01T00:00:00Z", lowest: 24.99 },
      { at: "2026-03-01T00:00:00Z", lowest: 19.99 },
      { at: "2026-05-01T00:00:00Z", lowest: 4.99 },
      { at: "2026-05-08T00:00:00Z", lowest: 19.99 },
    ]);
  });

  it("records a point only when the lowest price moves", () => {
    const flat = lowestOverTime(
      [
        { at: "2026-01-01T00:00:00Z", shop: "A", price: gbp(10) },
        { at: "2026-02-01T00:00:00Z", shop: "B", price: gbp(12) },
      ],
      "GBP",
    );
    expect(flat).toEqual([{ at: "2026-01-01T00:00:00Z", lowest: 10 }]);
  });
});

describe("historyFrom", () => {
  const points = [
    { at: "2025-08-01T00:00:00Z", lowest: 17.99 },
    { at: "2025-08-20T00:00:00Z", lowest: 4.99 },
    { at: "2025-10-01T00:00:00Z", lowest: 2.54 },
  ];

  it("starts on the price that held when the window opens", () => {
    expect(historyFrom(points, "2025-09-24T00:00:00Z")).toEqual([
      { at: "2025-09-24T00:00:00Z", lowest: 4.99 },
      { at: "2025-10-01T00:00:00Z", lowest: 2.54 },
    ]);
  });

  it("keeps everything when nothing came before", () => {
    expect(historyFrom(points, "2025-01-01T00:00:00Z")).toEqual(points);
  });
});
