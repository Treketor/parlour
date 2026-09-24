import type { SupabaseClient } from "@supabase/supabase-js";
import { OWNERSHIP_STATES, type Ownership } from "@/lib/ownership";
import { PROGRESS_STATES, type Progress } from "@/lib/progress";
import { isRating, type Rating } from "@/lib/rating";
import type { Database, Tables } from "@/lib/supabase/database.types";
import { entryKey } from "./add-entry";

type Client = SupabaseClient<Database>;

export type LibraryEntry = {
  id: string;
  gameId: number;
  platformId: number;
  ownership: Ownership;
  progress: Progress;
  rating: Rating | null;
  notes: string;
  startedOn: string | null;
  finishedOn: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Thrown when a row does not match what the app understands. The database
 * constraints should make this impossible; if it happens, the schema and the
 * app have drifted, and failing loudly beats rendering nonsense.
 */
export class UnexpectedDataError extends Error {
  constructor(field: string, value: unknown) {
    super(`Unexpected ${field} from the database: ${JSON.stringify(value)}`);
    this.name = "UnexpectedDataError";
  }
}

function oneOf<T extends string>(allowed: readonly T[], field: string, value: string): T {
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) throw new UnexpectedDataError(field, value);
  return match;
}

function ratingOrNull(value: number | null): Rating | null {
  if (value === null) return null;
  if (!isRating(value)) throw new UnexpectedDataError("rating", value);
  return value;
}

export function toLibraryEntry(row: Tables<"library_entries">): LibraryEntry {
  return {
    id: row.id,
    gameId: row.game_id,
    platformId: row.platform_id,
    ownership: oneOf(OWNERSHIP_STATES, "ownership", row.ownership),
    progress: oneOf(PROGRESS_STATES, "progress", row.progress),
    rating: ratingOrNull(row.rating),
    notes: row.notes,
    startedOn: row.started_on,
    finishedOn: row.finished_on,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/** How many entries the signed-in person has. Row-level security scopes it. */
export async function countLibraryEntries(client: Client): Promise<number> {
  const { count, error } = await client
    .from("library_entries")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export type EntryStatus = { entryId: string; ownership: Ownership; progress: Progress };

/**
 * The signed-in person's entries for these games, keyed by game and platform,
 * so search results can show what is already in the library.
 */
export async function libraryStatusFor(
  client: Client,
  gameIds: readonly number[],
): Promise<Map<string, EntryStatus>> {
  if (gameIds.length === 0) return new Map();

  const { data, error } = await client
    .from("library_entries")
    .select("id, game_id, platform_id, ownership, progress")
    .in("game_id", [...gameIds]);
  if (error) throw error;

  return new Map(
    data.map((row) => [
      entryKey(row.game_id, row.platform_id),
      {
        entryId: row.id,
        ownership: oneOf(OWNERSHIP_STATES, "ownership", row.ownership),
        progress: oneOf(PROGRESS_STATES, "progress", row.progress),
      },
    ]),
  );
}

/** How many entries the signed-in person has on each platform, to guess the platform they would pick. */
export async function platformHabits(client: Client): Promise<Record<number, number>> {
  const { data, error } = await client.from("library_entries").select("platform_id");
  if (error) throw error;
  const counts: Record<number, number> = {};
  for (const row of data) counts[row.platform_id] = (counts[row.platform_id] ?? 0) + 1;
  return counts;
}
