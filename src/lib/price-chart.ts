import type { PricePoint } from "./prices";

/*
 * The price history chart, drawn as plain SVG on the server: a step line,
 * because a price holds until it changes, never glides between two.
 */

export type PriceChart = {
  /** SVG path data within a width by height box, y growing downwards. */
  path: string;
  low: number;
  high: number;
  from: string;
  to: string;
};

export function priceChart(
  points: readonly PricePoint[],
  until: string,
  size: { width: number; height: number },
): PriceChart | null {
  const first = points[0];
  if (!first) return null;

  const start = Date.parse(first.at);
  const end = Math.max(Date.parse(until), start + 1);
  const values = points.map((point) => point.lowest);
  const low = Math.min(...values);
  const high = Math.max(...values);
  // Zero at the bottom, so a sale's drop is drawn at its true depth, with headroom above.
  const ceiling = high * 1.1 || 1;

  const x = (at: string) => ((Date.parse(at) - start) / (end - start)) * size.width;
  const y = (price: number) => size.height - (price / ceiling) * size.height;
  const round = (value: number) => Math.round(value * 10) / 10;

  let path = `M${round(x(first.at))},${round(y(first.lowest))}`;
  for (const point of points.slice(1)) {
    path += `H${round(x(point.at))}V${round(y(point.lowest))}`;
  }
  path += `H${size.width}`;

  return { path, low, high, from: first.at, to: until };
}

/** "Checked 3 hours ago": how fresh a cached price is, in the largest whole unit. */
export function checkedAgo(fetchedAt: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(fetchedAt)) / 60000));
  if (minutes < 1) return "Checked just now";
  if (minutes < 60) return `Checked ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Checked ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Checked ${days} day${days === 1 ? "" : "s"} ago`;
}
