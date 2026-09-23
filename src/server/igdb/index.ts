import "server-only";
import { adminClient } from "../supabase-admin";
import { serverEnv } from "../env";
import { createIgdbClient, type IgdbClient } from "./client";
import { createRateLimiter } from "./rate-limit";
import { createTokenProvider, type TokenStore } from "./token";

/** The token lives in public.provider_tokens, readable only with the service role. */
const databaseTokenStore: TokenStore = {
  async read() {
    const { data, error } = await adminClient()
      .from("provider_tokens")
      .select("access_token, expires_at")
      .eq("provider", "igdb")
      .maybeSingle();
    if (error) throw error;
    return data ? { accessToken: data.access_token, expiresAt: new Date(data.expires_at) } : null;
  },
  async write(token) {
    const { error } = await adminClient().from("provider_tokens").upsert({
      provider: "igdb",
      access_token: token.accessToken,
      expires_at: token.expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
};

let client: IgdbClient | undefined;

/** One client per server instance, so its rate limiter sees every request that instance makes. */
export function igdb(): IgdbClient {
  client ??= createIgdbClient({
    clientId: serverEnv.twitchClientId,
    tokens: createTokenProvider({
      clientId: serverEnv.twitchClientId,
      clientSecret: serverEnv.twitchClientSecret,
      store: databaseTokenStore,
    }),
    limit: createRateLimiter({ perSecond: 4, maxInFlight: 8 }),
  });
  return client;
}
