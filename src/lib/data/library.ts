import type { SupabaseClient } from "@supabase/supabase-js";
import { OWNERSHIP_STATES, type Ownership } from "@/lib/ownership";
import { PROGRESS_STATES, type Progress } from "@/lib/progress";
import { isRating, type Rating } from "@/lib/rating";
import type { Database, Tables } from "@/lib/supabase/database.types";

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
