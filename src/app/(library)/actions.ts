"use server";

import {
  isEntryId,
  normaliseTagName,
  parseEntryUpdate,
  sameTagName,
  type EditResult,
} from "@/lib/data/edit-entry";
import type { EntryTag } from "@/lib/data/library";
import { DONE_PROGRESS } from "@/lib/data/queue";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

/*
 * Edits from the entry panel. Each runs under the person's own session, so
 * row-level security decides what they can touch; an entry that is not
 * theirs simply matches no rows. None of these revalidate: the panel has
 * already shown the change, re-rendering the whole library after every
 * rating tap would cost a query for nothing, and both the library and search
 * are rendered fresh on every visit anyway (DECISIONS.md 037).
 */

const NOT_UNDERSTOOD = { status: "failed", message: "That change was not understood." } as const;

/** Saves one or more fields of an entry. */
export async function updateEntry(input: unknown): Promise<EditResult> {
  const request = parseEntryUpdate(input);
  if (!request) return NOT_UNDERSTOOD;
  const { patch } = request;

  const row: TablesUpdate<"library_entries"> = {};
  if (patch.ownership !== undefined) row.ownership = patch.ownership;
  if (patch.progress !== undefined) row.progress = patch.progress;
  if (patch.rating !== undefined) row.rating = patch.rating;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.startedOn !== undefined) row.started_on = patch.startedOn;
  if (patch.finishedOn !== undefined) row.finished_on = patch.finishedOn;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_entries")
    .update(row)
    .eq("id", request.entryId)
    .select("id");

  // 23514: a check constraint. The message names which one.
  if (error?.code === "23514") {
    return {
      status: "failed",
      message: error.message.includes("progress_needs_ownership")
        ? "Only a game you own can have progress. Mark it as owned first."
        : "The finish date cannot be before the start date.",
    };
  }
  if (error || data.length === 0) {
    if (error) console.error("Updating an entry failed", error);
    return { status: "failed", message: "That change was not saved. Try again." };
  }

  // A game you have finished or given up on is no longer one to play next.
  if (patch.progress && DONE_PROGRESS.includes(patch.progress)) {
    const { data: removed, error: queueError } = await supabase
      .from("queue_items")
      .delete()
      .eq("entry_id", request.entryId)
      .select("id");
    if (queueError) console.error("Taking a finished game off the queue failed", queueError);
    if (removed && removed.length > 0) return { status: "saved", unqueued: true };
  }
  return { status: "saved" };
}

export type TagResult = { status: "tagged"; tag: EntryTag } | { status: "failed"; message: string };

/**
 * Tags an entry, creating the tag if it is new. An existing tag is matched
 * regardless of case, so typing "co-op" reuses "Co-op".
 */
export async function addTag(input: unknown): Promise<TagResult> {
  const { entryId, name } = (input ?? {}) as Record<string, unknown>;
  const tagName = normaliseTagName(name);
  if (!isEntryId(entryId) || tagName === null) return NOT_UNDERSTOOD;

  const supabase = await createClient();
  const tag = await findOrCreateTag(supabase, tagName);
  if (!tag) return { status: "failed", message: "The tag was not saved. Try again." };

  const { error } = await supabase.from("entry_tags").insert({ entry_id: entryId, tag_id: tag.id });
  // Already tagged (another tab, or a double press) is the outcome that was wanted.
  if (error && error.code !== "23505") {
    console.error("Tagging an entry failed", error);
    return { status: "failed", message: "The tag was not saved. Try again." };
  }
  return { status: "tagged", tag };
}

async function findOrCreateTag(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
): Promise<EntryTag | null> {
  const inserted = await supabase.from("tags").insert({ name }).select("id, name").single();
  if (inserted.data) return inserted.data;

  // 23505: the unique index on lower(name) says it exists already.
  if (inserted.error?.code !== "23505") {
    console.error("Creating a tag failed", inserted.error);
    return null;
  }
  const { data, error } = await supabase.from("tags").select("id, name");
  if (error) {
    console.error("Reading tags failed", error);
    return null;
  }
  return data.find((tag) => sameTagName(tag.name, name)) ?? null;
}

/** Takes a tag off an entry. The tag itself stays, for use on other games. */
export async function removeTag(input: unknown): Promise<EditResult> {
  const { entryId, tagId } = (input ?? {}) as Record<string, unknown>;
  if (!isEntryId(entryId) || !isEntryId(tagId)) return NOT_UNDERSTOOD;

  const supabase = await createClient();
  const { error } = await supabase
    .from("entry_tags")
    .delete()
    .eq("entry_id", entryId)
    .eq("tag_id", tagId);
  if (error) {
    console.error("Removing a tag failed", error);
    return { status: "failed", message: "The tag was not removed. Try again." };
  }
  return { status: "saved" };
}

/** Deletes a tag everywhere: it comes off every game that has it. */
export async function deleteTag(input: unknown): Promise<EditResult> {
  const { tagId } = (input ?? {}) as Record<string, unknown>;
  if (!isEntryId(tagId)) return NOT_UNDERSTOOD;

  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").delete().eq("id", tagId).select("id");
  if (error || data.length === 0) {
    if (error) console.error("Deleting a tag failed", error);
    return { status: "failed", message: "The tag was not deleted. Try again." };
  }
  return { status: "saved" };
}

/** Removes an entry and everything recorded on it: progress, rating, notes and tags. */
export async function removeEntry(input: unknown): Promise<EditResult> {
  const { entryId } = (input ?? {}) as Record<string, unknown>;
  if (!isEntryId(entryId)) return NOT_UNDERSTOOD;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_entries")
    .delete()
    .eq("id", entryId)
    .select("id");
  if (error || data.length === 0) {
    if (error) console.error("Removing an entry failed", error);
    return { status: "failed", message: "It was not removed. Try again." };
  }
  return { status: "saved" };
}
