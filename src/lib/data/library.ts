import type { SupabaseClient } from "@supabase/supabase-js";
import { OWNERSHIP_STATES, type Ownership } from "@/lib/ownership";
import { PROGRESS_STATES, type Progress } from "@/lib/progress";
import { igdbImageUrl } from "@/lib/igdb-images";
import { platformLabel } from "@/lib/platforms";
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

export type EntryTag = { id: string; name: string };

/** One entry as the library page shows it: the game, the platform and my state. */
export type LibraryItem = {
  id: string;
  gameId: number;
  slug: string;
  title: string;
  year: number | null;
  coverUrl: string | undefined;
  /** A smaller cover for list rows, where the art is 2rem wide. */
  thumbUrl: string | undefined;
  platformId: number;
  platform: string;
  ownership: Ownership;
  progress: Progress;
  rating: Rating | null;
  notes: string;
  /** ISO dates, or null. */
  startedOn: string | null;
  finishedOn: string | null;
  tags: EntryTag[];
  addedAt: Date;
};

/**
 * Every entry the signed-in person has, with what browsing needs. The whole
 * library comes down at once and is filtered and sorted in the browser: a
 * personal library is hundreds of rows at most, and local filtering answers
 * on the keystroke instead of after a round trip (DECISIONS.md 034).
 */
export async function listLibrary(
  client: Client,
  /** Only this game's entries, for its page. */
  options: { gameId?: number } = {},
): Promise<LibraryItem[]> {
  let query = client
    .from("library_entries")
    .select(
      `id, game_id, platform_id, ownership, progress, rating, notes, started_on, finished_on, created_at,
       games(slug, name, first_release_date, cover_image_id),
       platforms(name),
       entry_tags(tags(id, name))`,
    )
    .order("created_at", { ascending: false });
  if (options.gameId !== undefined) query = query.eq("game_id", options.gameId);
  const { data, error } = await query;
  if (error) throw error;

  return data.map((row) => {
    // Foreign keys make both of these certain; a missing one means drift.
    if (!row.games) throw new UnexpectedDataError("game", row.game_id);
    if (!row.platforms) throw new UnexpectedDataError("platform", row.platform_id);
    const { games: game, platforms: platform } = row;

    return {
      id: row.id,
      gameId: row.game_id,
      slug: game.slug,
      title: game.name,
      year: game.first_release_date ? Number(game.first_release_date.slice(0, 4)) : null,
      coverUrl: game.cover_image_id
        ? igdbImageUrl(game.cover_image_id, "cover_big", true)
        : undefined,
      thumbUrl: game.cover_image_id ? igdbImageUrl(game.cover_image_id, "cover_small") : undefined,
      platformId: row.platform_id,
      platform: platformLabel(platform.name),
      ownership: oneOf(OWNERSHIP_STATES, "ownership", row.ownership),
      progress: oneOf(PROGRESS_STATES, "progress", row.progress),
      rating: ratingOrNull(row.rating),
      notes: row.notes,
      startedOn: row.started_on,
      finishedOn: row.finished_on,
      tags: row.entry_tags
        .flatMap((link) => (link.tags ? [link.tags] : []))
        .sort((a, b) => a.name.localeCompare(b.name)),
      addedAt: new Date(row.created_at),
    };
  });
}

/** Every tag the signed-in person has made, A to Z, including ones on no entry right now. */
export async function listTags(client: Client): Promise<EntryTag[]> {
  const { data, error } = await client.from("tags").select("id, name").order("name");
  if (error) throw error;
  return data;
}
