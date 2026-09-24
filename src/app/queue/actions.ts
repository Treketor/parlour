"use server";

import { isEntryId } from "@/lib/data/edit-entry";
import { keyBetween, keyFor, type QueuePlace } from "@/lib/queue-order";
import { createClient } from "@/lib/supabase/server";

/*
 * The queue, changed one row at a time under the person's own session, so
 * row-level security keeps it to their own entries (DECISIONS.md 047).
 */

export type QueueResult =
  | { status: "saved" }
  | { status: "stale"; message: string }
  | { status: "failed"; message: string };

const NOT_UNDERSTOOD = { status: "failed", message: "That change was not understood." } as const;

type Client = Awaited<ReturnType<typeof createClient>>;

async function end(supabase: Client, ascending: boolean): Promise<string | null> {
  const { data, error } = await supabase
    .from("queue_items")
    .select("sort_key")
    .order("sort_key", { ascending })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.sort_key ?? null;
}

/** Queues a library entry, first in line or at the back. Already queued stays where it is. */
export async function queueEntry(input: unknown): Promise<QueueResult> {
  const { entryId, place } = (input ?? {}) as Record<string, unknown>;
  if (!isEntryId(entryId) || (place !== "next" && place !== "last")) return NOT_UNDERSTOOD;

  const supabase = await createClient();
  // Two tabs adding at once can pick the same key; the unique index refuses
  // the second, and a fresh read of the ends settles it.
  for (let attempt = 0; attempt < 2; attempt++) {
    const ends = { first: await end(supabase, true), last: await end(supabase, false) };
    const { error } = await supabase
      .from("queue_items")
      .insert({ entry_id: entryId, sort_key: keyFor(place as QueuePlace, ends) });
    if (!error) return { status: "saved" };
    if (error.code !== "23505") {
      console.error("Queueing an entry failed", error);
      return { status: "failed", message: "It was not queued. Try again." };
    }
    if (error.message.includes("entry_id")) return { status: "saved" };
  }
  return { status: "failed", message: "It was not queued. Try again." };
}

/**
 * Moves a queued game between two others, given by id (either may be
 * missing at the ends). The neighbours' keys are read here rather than
 * trusted from the browser, and if they no longer sit in that order, the
 * queue has changed elsewhere and the move is refused as stale.
 */
export async function moveQueueItem(input: unknown): Promise<QueueResult> {
  const { itemId, beforeId, afterId } = (input ?? {}) as Record<string, unknown>;
  const neighbour = (id: unknown) => id === null || isEntryId(id);
  if (!isEntryId(itemId) || !neighbour(beforeId) || !neighbour(afterId)) return NOT_UNDERSTOOD;

  const supabase = await createClient();
  const ids = [beforeId, afterId].filter((id): id is string => typeof id === "string");
  const { data, error } = ids.length
    ? await supabase.from("queue_items").select("id, sort_key").in("id", ids)
    : { data: [], error: null };
  if (error) {
    console.error("Reading the queue failed", error);
    return { status: "failed", message: "It was not moved. Try again." };
  }

  const keyOf = (id: unknown) =>
    typeof id === "string" ? (data.find((row) => row.id === id)?.sort_key ?? undefined) : null;
  const before = keyOf(beforeId);
  const after = keyOf(afterId);
  const key = before === undefined || after === undefined ? null : keyBetween(before, after);
  if (key === null) {
    return { status: "stale", message: "Your queue changed in another tab. It has been reloaded." };
  }

  const { data: moved, error: moveError } = await supabase
    .from("queue_items")
    .update({ sort_key: key })
    .eq("id", itemId)
    .select("id");
  if (moveError || moved.length === 0) {
    if (moveError) console.error("Moving a queue item failed", moveError);
    return { status: "failed", message: "It was not moved. Try again." };
  }
  return { status: "saved" };
}

/** Takes an entry off the queue. The entry itself stays in the library. */
export async function unqueueEntry(input: unknown): Promise<QueueResult> {
  const { entryId } = (input ?? {}) as Record<string, unknown>;
  if (!isEntryId(entryId)) return NOT_UNDERSTOOD;

  const supabase = await createClient();
  const { error } = await supabase.from("queue_items").delete().eq("entry_id", entryId);
  if (error) {
    console.error("Unqueueing an entry failed", error);
    return { status: "failed", message: "It was not taken off the queue. Try again." };
  }
  return { status: "saved" };
}
