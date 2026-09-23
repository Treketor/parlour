/*
 * IGDB lookup tables that replaced its old enums, as served on 24 Sep 2026
 * (game_types, date_formats, release_date_regions, platform_types,
 * external_game_sources). They change rarely; hard-coding them saves a
 * request per lookup and keeps queries filterable by id.
 */

export const GAME_TYPES: Readonly<Record<number, string>> = {
  0: "Main Game",
  1: "DLC",
  2: "Expansion",
  3: "Bundle",
  4: "Standalone Expansion",
  5: "Mod",
  6: "Episode",
  7: "Season",
  8: "Remake",
  9: "Remaster",
  10: "Expanded Game",
  11: "Port",
  12: "Fork",
  13: "Pack / Addon",
  14: "Update",
};

/**
 * What search offers: things you play on their own. DLC, bundles, mods and
 * updates are left out; they belong on their parent game's page.
 */
export const SEARCHABLE_GAME_TYPES = [0, 4, 8, 9, 10, 11] as const;

export type DatePrecision = "day" | "month" | "year" | "quarter" | "tbd";

export const DATE_FORMAT_PRECISION: Readonly<Record<number, DatePrecision>> = {
  0: "day", // YYYYMMDD
  1: "month", // YYYYMM
  2: "year", // YYYY
  3: "quarter", // YYYYQ1
  4: "quarter",
  5: "quarter",
  6: "quarter",
  7: "tbd",
};

export const RELEASE_REGIONS: Readonly<Record<number, string>> = {
  1: "europe",
  2: "north_america",
  3: "australia",
  4: "new_zealand",
  5: "japan",
  6: "china",
  7: "asia",
  8: "worldwide",
  9: "korea",
  10: "brazil",
};

export const PLATFORM_TYPES: Readonly<Record<number, string>> = {
  1: "Console",
  2: "Arcade",
  3: "Platform",
  4: "Operating_system",
  5: "Portable_console",
  6: "Computer",
};

export type ExternalSource = "steam" | "gog" | "epic";

/** Only the stores Parlour uses; stage 9 matches prices through these. */
export const EXTERNAL_SOURCES: Readonly<Record<number, ExternalSource>> = {
  1: "steam",
  5: "gog",
  26: "epic",
};
