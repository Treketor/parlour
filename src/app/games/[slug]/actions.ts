"use server";

import { cookies } from "next/headers";
import { PRICE_REGION_COOKIE, parseRegion } from "@/lib/prices";
import { createClient } from "@/lib/supabase/server";

const ONE_YEAR_S = 60 * 60 * 24 * 365;

export type RegionResult = { status: "saved" } | { status: "failed"; message: string };

/**
 * Remembers the region prices are shown for: on your profile when signed
 * in, so it follows you to other devices, and on this device either way.
 */
export async function setPriceRegion(input: unknown): Promise<RegionResult> {
  const region = parseRegion(typeof input === "string" ? input : null);
  if (!region) return { status: "failed", message: "That region is not offered." };

  (await cookies()).set(PRICE_REGION_COOKIE, region, {
    path: "/",
    maxAge: ONE_YEAR_S,
    sameSite: "lax",
  });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (typeof userId === "string") {
    const { error } = await supabase.from("profiles").update({ country: region }).eq("id", userId);
    if (error) {
      console.error("Saving the price region failed", error);
      return { status: "failed", message: "The region was not saved. Try again." };
    }
  }
  return { status: "saved" };
}
