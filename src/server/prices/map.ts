import {
  historyFrom,
  inCurrency,
  lowestOverTime,
  mainCurrency,
  type Deal,
  type PriceData,
} from "@/lib/prices";
import { normaliseTitle } from "../scores/match";
import type { ItadHistory, ItadLookup, ItadPrices } from "./itad";

/**
 * Whether a lookup found this game rather than a namesake, its DLC or a
 * soundtrack: a title lookup for "Breath of the Wild" answers with a DLC
 * entry, because the game itself is not sold on PC.
 */
export function isSameGame(
  found: ItadLookup | null,
  name: string,
): found is NonNullable<ItadLookup> {
  return (
    found !== null &&
    found !== undefined &&
    (found.type === null || found.type === "game") &&
    normaliseTitle(found.title) === normaliseTitle(name)
  );
}

/**
 * IsThereAnyDeal's answer as the page shows it: prices in the region's own
 * currency only, cheapest first, the lowest prices it has seen, and the
 * cheapest price anywhere over time. Null when no shop sells it here.
 */
export function toPriceData(
  prices: ItadPrices | null,
  history: ItadHistory,
  /** Where the drawn history starts; earlier events only establish each shop's price. */
  from: string,
): PriceData | null {
  if (!prices) return null;

  const currency =
    prices.historyLow?.all?.currency ?? mainCurrency(prices.deals.map((deal) => deal.price));
  if (!currency) return null;

  const deals: Deal[] = inCurrency(prices.deals, currency)
    .map((deal) => ({
      shop: deal.shop.name,
      price: deal.price,
      regular: deal.regular,
      cut: deal.cut,
      voucher: deal.voucher ?? null,
      drm: deal.drm.map((drm) => drm.name),
      url: deal.url,
    }))
    .sort((a, b) => a.price.amount - b.price.amount || a.shop.localeCompare(b.shop));

  const low = (value: { amount: number; currency: string } | null | undefined) =>
    value && value.currency === currency ? value : null;

  return {
    currency,
    deals,
    lowest: { allTime: low(prices.historyLow?.all), pastYear: low(prices.historyLow?.y1) },
    history: historyFrom(
      lowestOverTime(
        history.map((event) => ({
          at: event.timestamp,
          shop: event.shop.name,
          price: event.deal.price,
        })),
        currency,
      ),
      from,
    ),
  };
}
