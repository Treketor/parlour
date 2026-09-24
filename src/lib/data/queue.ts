import type { SupabaseClient } from "@supabase/supabase-js";
import { igdbImageUrl } from "@/lib/igdb-images";
import { OWNERSHIP_STATES, type Ownership } from "@/lib/ownership";
import { platformLabel } from "@/lib/platforms";
import { PROGRESS_STATES, type Progress } from "@/lib/progress";
import type { Database } from "@/lib/supabase/database.types";
import { UnexpectedDataError } from "./library";

type Client = SupabaseClient<Database>;

/** Progress that means a game is done with: finishing one takes it off the queue. */
export const DONE_PROGRESS: readonly Progress[] = ["finished", "completed", "abandoned"];

export type QueueItem = {
  id: string;
  sortKey: string;
  entryId: string;
  slug: string;
  title: string;
  platform: string;
  thumbUrl: string | undefined;
  progress: Progress;
  ownership: Ownership;
};

/** The signed-in person's queue, first to play at the top. Row-level security scopes it. */
export async function listQueue(client: Client): Promise<QueueItem[]> {
  const { data, error } = await client
    .from("queue_items")
    .select(
      `id, sort_key, entry_id,
       library_entries(progress, ownership, games(slug, name, cover_image_id), platforms(name))`,
    )
    // The column's byte collation gives the same order JavaScript's string comparison does.
    .order("sort_key", { ascending: true });
  if (error) throw error;

  return data.map((row) => {
    const entry = row.library_entries;
    if (!entry?.games || !entry.platforms)
      throw new UnexpectedDataError("queue entry", row.entry_id);
    const progress = PROGRESS_STATES.find((state) => state === entry.progress);
    const ownership = OWNERSHIP_STATES.find((state) => state === entry.ownership);
    if (!progress) throw new UnexpectedDataError("progress", entry.progress);
    if (!ownership) throw new UnexpectedDataError("ownership", entry.ownership);
    return {
      id: row.id,
      sortKey: row.sort_key,
      entryId: row.entry_id,
      slug: entry.games.slug,
      title: entry.games.name,
      platform: platformLabel(entry.platforms.name),
      thumbUrl: entry.games.cover_image_id
        ? igdbImageUrl(entry.games.cover_image_id, "cover_small", true)
        : undefined,
      progress,
      ownership,
    };
  });
}

/** Each queued entry's place in line, counting from 1, for the library's editor. */
export async function queuePositions(client: Client): Promise<Record<string, number>> {
  const { data, error } = await client
    .from("queue_items")
    .select("entry_id")
    .order("sort_key", { ascending: true });
  if (error) throw error;
  return Object.fromEntries(data.map((row, index) => [row.entry_id, index + 1]));
}
