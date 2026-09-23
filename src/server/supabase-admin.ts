import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { serverEnv } from "./env";

let admin: SupabaseClient<Database> | undefined;

/**
 * Service-role client: bypasses row-level security. Only for server-owned
 * data (the shared catalogue, the IGDB token, the search cache); never for
 * anything a person owns, which always goes through their own session.
 */
export function adminClient(): SupabaseClient<Database> {
  admin ??= createClient<Database>(supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
