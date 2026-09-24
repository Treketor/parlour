import "server-only";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_REGION,
  PRICE_REGION_COOKIE,
  parseRegion,
  regionFromAcceptLanguage,
  type PriceRegion,
} from "@/lib/prices";
import { decodePreference } from "@/lib/preference-cookie";
import { createClient } from "@/lib/supabase/server";

/**
 * The region prices are shown for: the one saved on your profile, then the
 * one chosen on this device, then a guess from the browser's languages,
 * then the United States. The guess is only a starting point; the picker
 * beside the prices changes it.
 */
export async function priceRegion(): Promise<PriceRegion> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (auth?.claims) {
    const { data } = await supabase.from("profiles").select("country").maybeSingle();
    const saved = parseRegion(data?.country);
    if (saved) return saved;
  }

  const chosen = parseRegion(decodePreference((await cookies()).get(PRICE_REGION_COOKIE)?.value));
  if (chosen) return chosen;

  return regionFromAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_REGION;
}
