import { OWNERSHIP_STATES, type Ownership } from "@/lib/ownership";

export type AddEntryRequest = { gameId: number; platformId: number; ownership: Ownership };

export type AddEntryResult =
  | { status: "added"; entryId: string }
  | { status: "exists" }
  | { status: "signed-out" }
  | { status: "failed"; message: string };

function positiveId(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const number =
    typeof value === "number" ? value : Number(value.trim() === "" ? Number.NaN : value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

/** Checks an add request from the browser; anything malformed is refused, not coerced. */
export function parseAddEntry(input: unknown): AddEntryRequest | null {
  if (typeof input !== "object" || input === null) return null;
  const { gameId, platformId, ownership } = input as Record<string, unknown>;
  const game = positiveId(gameId);
  const platform = positiveId(platformId);
  const owned = OWNERSHIP_STATES.find((state) => state === ownership);
  if (game === null || platform === null || owned === undefined) return null;
  return { gameId: game, platformId: platform, ownership: owned };
}

/** Key for a game on a platform, used to look up library status in search results. */
export function entryKey(gameId: number, platformId: number): string {
  return `${gameId}:${platformId}`;
}
