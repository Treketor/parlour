import "server-only";
import type { z } from "zod";
import { serverEnv } from "../env";
import { adminClient } from "../supabase-admin";
import { createItadClient, historyResponse, pricesItem } from "./itad";
import { createPriceService, type PriceService, type PriceStore } from "./service";

const PAYLOADS: Record<"prices" | "history", z.ZodType> = {
  prices: pricesItem.nullable(),
  history: historyResponse,
};

const databaseStore: PriceStore = {
  async readId(gameId) {
    const { data, error } = await adminClient()
      .from("game_price_ids")
      .select("itad_id, checked_at")
      .eq("game_id", gameId)
      .maybeSingle();
    if (error) throw error;
    return data ? { itadId: data.itad_id, checkedAt: new Date(data.checked_at) } : null;
  },

  async writeId(gameId, itadId) {
    const { error } = await adminClient()
      .from("game_price_ids")
      .upsert({ game_id: gameId, itad_id: itadId, checked_at: new Date().toISOString() });
    if (error) throw error;
  },

  async read(gameId, country, kind) {
    const { data, error } = await adminClient()
      .from("price_cache")
      .select("payload, fetched_at")
      .eq("game_id", gameId)
      .eq("country", country)
      .eq("kind", kind)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    // A payload that no longer fits the schema is treated as missing and fetched again.
    const payload = PAYLOADS[kind].safeParse(data.payload);
    return payload.success ? { payload: payload.data, fetchedAt: new Date(data.fetched_at) } : null;
  },

  async write(gameId, country, kind, payload) {
    const { error } = await adminClient()
      .from("price_cache")
      .upsert({
        game_id: gameId,
        country,
        kind,
        payload: payload as never,
        fetched_at: new Date().toISOString(),
      });
    if (error) throw error;
  },
};

let service: PriceService | null | undefined;

/** Prices from IsThereAnyDeal, cached in Postgres; null when no ITAD key is configured. */
export function getPriceService(): PriceService | null {
  if (service !== undefined) return service;
  const key = serverEnv.itadApiKey;
  service = key ? createPriceService({ store: databaseStore, itad: createItadClient(key) }) : null;
  return service;
}
