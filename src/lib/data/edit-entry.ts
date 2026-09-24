import { OWNERSHIP_STATES, type Ownership } from "@/lib/ownership";
import { PROGRESS_STATES, type Progress } from "@/lib/progress";
import { isRating, type Rating } from "@/lib/rating";

/*
 * Checks for edits sent from the entry panel. The database constraints say
 * the same things; checking here first turns a bad request into a clear
 * refusal instead of a database error, and keeps the rules testable.
 */

/** Matches the check constraint on library_entries.notes. */
export const NOTES_MAX_LENGTH = 20000;

/** Matches the check constraint on tags.name. */
export const TAG_MAX_LENGTH = 40;

export type EntryPatch = {
  ownership?: Ownership;
  progress?: Progress;
  rating?: Rating | null;
  notes?: string;
  /** ISO dates (YYYY-MM-DD), or null to clear. */
  startedOn?: string | null;
  finishedOn?: string | null;
};

export type EditResult =
  | {
      status: "saved";
      /** True when the change took the game off the queue (it was finished or given up). */
      unqueued?: boolean;
    }
  | { status: "failed"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isEntryId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** A real calendar date in ISO form: "2026-02-30" is refused, not rolled over. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Checks an edit; any unknown field or bad value refuses the whole request. */
export function parseEntryUpdate(input: unknown): { entryId: string; patch: EntryPatch } | null {
  if (typeof input !== "object" || input === null) return null;
  const { entryId, patch } = input as Record<string, unknown>;
  if (!isEntryId(entryId) || typeof patch !== "object" || patch === null) return null;

  const fields = patch as Record<string, unknown>;
  const result: EntryPatch = {};

  for (const [key, value] of Object.entries(fields)) {
    switch (key) {
      case "ownership": {
        const ownership = OWNERSHIP_STATES.find((state) => state === value);
        if (!ownership) return null;
        result.ownership = ownership;
        break;
      }
      case "progress": {
        const progress = PROGRESS_STATES.find((state) => state === value);
        if (!progress) return null;
        result.progress = progress;
        break;
      }
      case "rating":
        if (value !== null && !isRating(value)) return null;
        result.rating = value;
        break;
      case "notes":
        if (typeof value !== "string" || value.length > NOTES_MAX_LENGTH) return null;
        result.notes = value;
        break;
      case "startedOn":
      case "finishedOn":
        if (value !== null && !isIsoDate(value)) return null;
        result[key] = value;
        break;
      default:
        return null;
    }
  }

  if (Object.keys(result).length === 0) return null;
  if (!datesInOrder(result.startedOn, result.finishedOn)) return null;
  return { entryId, patch: result };
}

/** A finish date cannot come before a start date; either may be missing. */
export function datesInOrder(
  startedOn: string | null | undefined,
  finishedOn: string | null | undefined,
): boolean {
  return !startedOn || !finishedOn || finishedOn >= startedOn;
}

/** Tidies a tag name as typed; null when nothing usable is left. */
export function normaliseTagName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const tidy = name.trim().replace(/\s+/g, " ");
  if (tidy.length === 0 || tidy.length > TAG_MAX_LENGTH) return null;
  return tidy;
}

/** Tag names are unique regardless of case: "Co-op" and "co-op" are one tag, as lower() says in the database. */
export function sameTagName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/*
 * Which progress goes with which ownership (DECISIONS.md 038). Progress is
 * what you have done with a copy you have: a game you only want to own, or
 * passed on, has not been started, so "Playing" with "Not interested" is
 * refused here and by a check constraint in the database.
 */

/** Only a game you own on this platform has progress beyond "Want to play". */
export function tracksProgress(ownership: Ownership): boolean {
  return ownership === "owned";
}

/** Whether an entry can move to this ownership without contradicting its progress. */
export function ownershipFits(ownership: Ownership, progress: Progress): boolean {
  return ownership === "owned" || progress === "want_to_play";
}

/** Whether progress means anything for this ownership at all: a game passed on has none. */
export function showsProgress(ownership: Ownership): boolean {
  return ownership !== "not_interested";
}

/**
 * The dates that can be recorded for a progress: a start once begun, a
 * finish once done. They are offered, never asked for (DECISIONS.md 039).
 */
export function datesFor(progress: Progress): { started: boolean; finished: boolean } {
  const finished = progress === "finished" || progress === "completed";
  return { started: progress !== "want_to_play", finished };
}
