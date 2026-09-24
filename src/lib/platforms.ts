/*
 * Which platform a game card starts on, and the order of its platform picker.
 * IGDB lists platforms in no useful order, so a card could open on Google
 * Stadia or Mac for a game almost everyone owns on PC or a console
 * (DECISIONS.md 033).
 */

type Platform = { id: number; name: string };

// IGDB platform ids, most commonly owned first.
const PREFERRED = [
  6, // PC (Microsoft Windows)
  167, // PlayStation 5
  130, // Nintendo Switch
  508, // Nintendo Switch 2
  169, // Xbox Series X|S
  48, // PlayStation 4
  49, // Xbox One
];

// Ports people rarely buy a game on, and services that no longer exist.
const RARELY_OWNED = [
  14, // Mac
  3, // Linux
  39, // iOS
  34, // Android
  82, // Web browser
  163, // SteamVR
  165, // PlayStation VR
  170, // Google Stadia
];

/** A platform counts as a habit only with this many games on it; one or two is chance. */
export const MIN_HABIT = 3;

/**
 * Most likely platform first: the one you use most in your own library,
 * then the common-ownership order, then the rest by console generation,
 * newest first, with rarely owned ports last.
 */
export function orderPlatforms<T extends Platform & { generation?: number | null }>(
  platforms: readonly T[],
  habits: Readonly<Record<number, number>> = {},
): T[] {
  const habit = (platform: T) => {
    const count = habits[platform.id] ?? 0;
    return count >= MIN_HABIT ? count : 0;
  };
  const tier = (platform: T) => {
    const preferred = PREFERRED.indexOf(platform.id);
    if (preferred !== -1) return preferred;
    const rare = RARELY_OWNED.indexOf(platform.id);
    if (rare !== -1) return 1000 + rare;
    return 100 - (platform.generation ?? 0);
  };

  return [...platforms].sort(
    (a, b) => habit(b) - habit(a) || tier(a) - tier(b) || a.name.localeCompare(b.name),
  );
}

/**
 * A platform name short enough for a list column. IGDB names Windows
 * "PC (Microsoft Windows)"; everyone else just says PC.
 */
export function platformLabel(name: string): string {
  return name === "PC (Microsoft Windows)" ? "PC" : name;
}
