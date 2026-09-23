// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Tables } from "@/lib/supabase/database.types";
import { UnexpectedDataError, toLibraryEntry } from "./library";

function row(overrides: Partial<Tables<"library_entries">> = {}): Tables<"library_entries"> {
  return {
    id: "00000000-0000-4000-8000-0000000000e1",
    user_id: "00000000-0000-4000-8000-00000000000a",
    game_id: 11737,
    platform_id: 6,
    ownership: "owned",
    progress: "playing",
    rating: 9,
    notes: "",
    started_on: "2026-09-01",
    finished_on: null,
    created_at: "2026-09-01T10:00:00+00:00",
    updated_at: "2026-09-20T18:30:00+00:00",
    ...overrides,
  };
}

describe("toLibraryEntry", () => {
  it("maps a row to the app's shape", () => {
    const entry = toLibraryEntry(row());
    expect(entry).toMatchObject({
      gameId: 11737,
      platformId: 6,
      ownership: "owned",
      progress: "playing",
      rating: 9,
      startedOn: "2026-09-01",
      finishedOn: null,
    });
    expect(entry.updatedAt.toISOString()).toBe("2026-09-20T18:30:00.000Z");
  });

  it("keeps unrated as null rather than 0", () => {
    expect(toLibraryEntry(row({ rating: null })).rating).toBeNull();
  });

  it.each([
    ["progress", { progress: "beaten" }],
    ["ownership", { ownership: "borrowed" }],
    ["rating", { rating: 11 }],
    ["rating", { rating: 0 }],
  ] as const)("refuses an unknown %s", (_, overrides) => {
    expect(() => toLibraryEntry(row(overrides))).toThrow(UnexpectedDataError);
  });
});
