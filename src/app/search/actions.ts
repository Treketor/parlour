"use server";

import { revalidatePath } from "next/cache";
import { parseAddEntry, type AddEntryResult } from "@/lib/data/add-entry";
import { createClient } from "@/lib/supabase/server";
import { getCatalogue } from "@/server/catalogue";
import { IgdbError } from "@/server/igdb/errors";

/**
 * Adds a game on one platform to the signed-in person's library. The game is
 * made sure of first (library entries reference stored games), and the insert
 * runs under the person's own session, so row-level security still applies.
 */
export async function addToLibrary(input: unknown): Promise<AddEntryResult> {
  const request = parseAddEntry(input);
  if (!request) return { status: "failed", message: "That request was not understood." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return { status: "signed-out" };

  try {
    const [game] = await getCatalogue().ensure([request.gameId]);
    if (!game?.platforms.some((platform) => platform.id === request.platformId)) {
      return { status: "failed", message: "That game is not listed on this platform." };
    }
  } catch (error) {
    if (error instanceof IgdbError) {
      return { status: "failed", message: "IGDB did not respond. Try again in a moment." };
    }
    throw error;
  }

  const { data, error } = await supabase
    .from("library_entries")
    .insert({
      game_id: request.gameId,
      platform_id: request.platformId,
      ownership: request.ownership,
    })
    .select("id")
    .single();

  // Unique (user, game, platform): it is already there, perhaps added in another tab.
  if (error?.code === "23505") return { status: "exists" };
  if (error) {
    console.error("Adding to library failed", error);
    return { status: "failed", message: "It could not be added. Try again." };
  }

  revalidatePath("/");
  return { status: "added", entryId: data.id };
}
