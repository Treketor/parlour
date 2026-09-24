import type { CatalogueGame } from "./catalogue";
import { formatDate } from "./format";
import { platformLabel } from "./platforms";

/** Everything the game page shows. Safe to send to the browser. */
export type GameDetail = CatalogueGame & {
  genres: string[];
  releases: ReleaseRow[];
  screenshots: MediaImage[];
  artworks: MediaImage[];
  videos: Array<{ id: string; name: string | null }>;
  externalIds: Array<{ source: "steam" | "gog" | "epic"; uid: string }>;
};

export type MediaImage = { imageId: string; width: number | null; height: number | null };

export type ReleaseRow = {
  platformId: number | null;
  platform: string | null;
  /** ISO date; null when only a year, a quarter or nothing is known. */
  releasedOn: string | null;
  precision: "day" | "month" | "year" | "quarter" | "tbd";
  /** IGDB's own wording, e.g. "Q3 2026", used for the imprecise cases. */
  label: string | null;
  region: string | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A release date only as exact as IGDB knows it: "3 Mar 2017", "Mar 2017", "2017", "Q3 2026", "TBA". */
export function formatRelease(row: Pick<ReleaseRow, "releasedOn" | "precision" | "label">): string {
  const date = row.releasedOn ? new Date(`${row.releasedOn}T00:00:00Z`) : null;
  switch (row.precision) {
    case "day":
      return date ? formatDate(date) : "TBA";
    case "month":
      return date ? `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}` : "TBA";
    case "year":
      return date ? String(date.getUTCFullYear()) : (row.label ?? "TBA");
    case "quarter":
      return row.label ?? (date ? String(date.getUTCFullYear()) : "TBA");
    case "tbd":
      return "TBA";
  }
}

const REGION_LABELS: Readonly<Record<string, string>> = {
  worldwide: "Worldwide",
  europe: "Europe",
  north_america: "North America",
  australia: "Australia",
  new_zealand: "New Zealand",
  japan: "Japan",
  china: "China",
  asia: "Asia",
  korea: "Korea",
  brazil: "Brazil",
};

export function regionLabel(region: string | null): string {
  return region ? (REGION_LABELS[region] ?? region) : "Region not listed";
}

export type ReleaseLine = { platform: string; date: string; regions: string[] };

/**
 * The release table: one line per platform and date, with the regions that
 * got it that day. Platforms follow their first release, oldest first, and
 * dates within a platform run in order, undated ones last.
 */
export function releaseLines(rows: readonly ReleaseRow[]): ReleaseLine[] {
  const byPlatform = new Map<string, ReleaseRow[]>();
  for (const row of rows) {
    const platform = row.platform ? platformLabel(row.platform) : "Other";
    byPlatform.set(platform, [...(byPlatform.get(platform) ?? []), row]);
  }

  const order = (row: ReleaseRow) => row.releasedOn ?? "9999";
  const platforms = [...byPlatform.entries()].sort(([aName, a], [bName, b]) => {
    const first = (list: ReleaseRow[]) => list.map(order).sort()[0] ?? "9999";
    return first(a).localeCompare(first(b)) || aName.localeCompare(bName);
  });

  return platforms.flatMap(([platform, list]) => {
    const byDate = new Map<string, { sortKey: string; regions: Set<string> }>();
    for (const row of [...list].sort((a, b) => order(a).localeCompare(order(b)))) {
      const date = formatRelease(row);
      const line = byDate.get(date) ?? { sortKey: order(row), regions: new Set<string>() };
      line.regions.add(regionLabel(row.region));
      byDate.set(date, line);
    }
    return [...byDate.entries()].map(([date, { regions }]) => ({
      platform,
      date,
      // Worldwide says it all; anything listed beside it is repetition.
      regions: regions.has("Worldwide") ? ["Worldwide"] : [...regions],
    }));
  });
}

/** Each platform's first release only: the short form of the table. */
export function firstReleases(lines: readonly ReleaseLine[]): ReleaseLine[] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    if (seen.has(line.platform)) return false;
    seen.add(line.platform);
    return true;
  });
}

export type OutboundLink = { label: string; description: string; href: string };

/**
 * Where to look for help with a game. Searches rather than guessed pages:
 * a search always lands somewhere useful, a guessed address often 404s.
 */
export function guideLinks(name: string): OutboundLink[] {
  const query = encodeURIComponent(name);
  return [
    {
      label: "Walkthroughs",
      description: "Video playthroughs on YouTube",
      href: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} walkthrough`)}`,
    },
    {
      label: "Guides and FAQs",
      description: "Written guides on GameFAQs",
      href: `https://gamefaqs.gamespot.com/search?game=${query}`,
    },
    {
      label: "How long to beat",
      description: "Typical times on HowLongToBeat",
      href: `https://howlongtobeat.com/?q=${query}`,
    },
  ];
}

/** Store pages that can be addressed from an id alone. Only Steam's can. */
export function storeLinks(externalIds: GameDetail["externalIds"]): OutboundLink[] {
  const steam = externalIds.find((id) => id.source === "steam");
  if (!steam || !/^\d+$/.test(steam.uid)) return [];
  return [
    {
      label: "Steam",
      description: "Store page",
      href: `https://store.steampowered.com/app/${steam.uid}/`,
    },
  ];
}

/**
 * Where to read critic reviews when IGDB has too few. IGDB's critic data is
 * thin for older games (Ocarina of Time has none), so the page says so and
 * points to a search rather than showing nothing.
 */
export function criticSearchLink(name: string): OutboundLink {
  return {
    label: "Critic reviews on Metacritic",
    description: "Search Metacritic",
    href: `https://www.metacritic.com/search/${encodeURIComponent(name)}/`,
  };
}

export type ReleaseState =
  | { status: "released"; label: string }
  | { status: "upcoming"; label: string }
  | { status: "unannounced"; label: string };

/**
 * Whether a game is out yet, in words. An upcoming date is shown only as
 * exactly as it is known: IGDB stores "sometime in 2027" as 31 Dec 2027, and
 * "Coming 31 Dec 2027" would be a promise nobody made.
 */
export function releaseState(
  firstReleaseDate: string | null,
  releases: readonly ReleaseRow[],
  today: string,
): ReleaseState {
  if (firstReleaseDate && firstReleaseDate <= today) {
    return { status: "released", label: formatDate(new Date(`${firstReleaseDate}T00:00:00Z`)) };
  }
  const dated = releases
    .filter((row) => row.releasedOn !== null && row.precision !== "tbd")
    .sort((a, b) => (a.releasedOn ?? "").localeCompare(b.releasedOn ?? ""));
  const next = dated[0];
  if (next) return { status: "upcoming", label: `Coming ${formatRelease(next)}` };
  if (firstReleaseDate) {
    return { status: "upcoming", label: `Coming ${firstReleaseDate.slice(0, 4)}` };
  }
  return { status: "unannounced", label: "Release date not announced" };
}
