/*
 * Prices from IsThereAnyDeal, per region and currency (DECISIONS.md 045).
 * Types and pure helpers only; safe for the browser.
 */

export type Money = { amount: number; currency: string };

export type Deal = {
  shop: string;
  price: Money;
  regular: Money;
  /** Percentage off the regular price. */
  cut: number;
  /** A code needed at checkout for this price, if any. */
  voucher: string | null;
  /** How the game is delivered, e.g. a Steam key from a key shop. */
  drm: string[];
  /** IsThereAnyDeal's link, passed through untouched, affiliate tag and all. */
  url: string;
};

export type PricePoint = { at: string; lowest: number };

export type PriceData = {
  currency: string;
  /** Current prices, cheapest first. */
  deals: Deal[];
  lowest: { allTime: Money | null; pastYear: Money | null };
  /** The cheapest price anywhere over the past year, one point per change. */
  history: PricePoint[];
};

/*
 * The regions offered. IsThereAnyDeal prices many more countries; these are
 * the ones with their own storefront currency or a large player base.
 */
export const PRICE_REGIONS = [
  "AU",
  "AT",
  "BE",
  "BR",
  "CA",
  "DK",
  "FI",
  "FR",
  "DE",
  "IN",
  "IE",
  "IT",
  "JP",
  "MX",
  "NL",
  "NZ",
  "NO",
  "PL",
  "PT",
  "ZA",
  "KR",
  "ES",
  "SE",
  "CH",
  "TR",
  "GB",
  "US",
] as const;

export type PriceRegion = (typeof PRICE_REGIONS)[number];

export const DEFAULT_REGION: PriceRegion = "US";

export function parseRegion(value: string | null | undefined): PriceRegion | null {
  const upper = value?.trim().toUpperCase();
  return PRICE_REGIONS.find((region) => region === upper) ?? null;
}

/**
 * A first guess at the region from the browser's language list, e.g.
 * "en-GB,en;q=0.9" gives GB. Only used until a region is chosen.
 */
export function regionFromAcceptLanguage(header: string | null | undefined): PriceRegion | null {
  for (const part of (header ?? "").split(",")) {
    const tag = part.split(";")[0]?.trim() ?? "";
    const region = parseRegion(tag.split("-")[1]);
    if (region) return region;
  }
  return null;
}

/**
 * "£2.18", "€19.99", "US$19.99", "A$29.95": every dollar says whose it is,
 * because a bare "$" means a different amount in the US, Canada and Australia.
 */
export function formatMoney(money: Money): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: money.currency,
      currencyDisplay: "symbol",
    }).format(money.amount);
  } catch {
    return `${money.amount.toFixed(2)} ${money.currency}`;
  }
}

/** Figures in a region's own currency only: a UK list must not mix in a US dollar price. */
export function inCurrency<T extends { price: Money }>(items: readonly T[], currency: string): T[] {
  return items.filter((item) => item.price.currency === currency);
}

/** The currency most prices are given in, for when IsThereAnyDeal does not say outright. */
export function mainCurrency(prices: readonly Money[]): string | null {
  const counts = new Map<string, number>();
  for (const price of prices) counts.set(price.currency, (counts.get(price.currency) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export type PriceEvent = { at: string; shop: string; price: Money };

/**
 * The cheapest price across every shop over time, from IsThereAnyDeal's
 * log of price changes: each change updates that shop's price, and the
 * lowest current one is recorded whenever it moves. Oldest first.
 */
export function lowestOverTime(events: readonly PriceEvent[], currency: string): PricePoint[] {
  const byShop = new Map<string, number>();
  const points: PricePoint[] = [];
  const ordered = inCurrency(events, currency).sort((a, b) => a.at.localeCompare(b.at));

  for (const event of ordered) {
    byShop.set(event.shop, event.price.amount);
    const lowest = Math.min(...byShop.values());
    if (points.at(-1)?.lowest !== lowest) points.push({ at: event.at, lowest });
  }
  return points;
}

/** Where a visitor who is not signed in keeps their price region. */
export const PRICE_REGION_COOKIE = "parlour-region";

/**
 * The series from a date onwards, starting with the price that held on that
 * date. History is fetched from a month earlier than it is drawn, so every
 * shop has reported a price by the time the line starts; drawn from the
 * first event, the line opened on one shop's full price as a false spike.
 */
export function historyFrom(points: readonly PricePoint[], from: string): PricePoint[] {
  const before = points.filter((point) => point.at < from).at(-1);
  const after = points.filter((point) => point.at >= from);
  return before ? [{ at: from, lowest: before.lowest }, ...after] : after;
}
