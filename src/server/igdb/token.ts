import { z } from "zod";
import { IgdbError } from "./errors";

/*
 * One app token, shared. Twitch keeps at most 25 live tokens per app and
 * switches off the oldest past that, so fetching a token per request or per
 * server instance would eventually disable tokens still in use. The token is
 * kept in the database and in memory, and renewed a day before it expires.
 */

export type StoredToken = { accessToken: string; expiresAt: Date };

export type TokenStore = {
  read(): Promise<StoredToken | null>;
  write(token: StoredToken): Promise<void>;
};

export type TokenProvider = {
  /** A token that is valid for at least another day. */
  get(): Promise<string>;
  /** Called when IGDB rejects `rejected`; returns a different, working token. */
  replace(rejected: string): Promise<string>;
};

type TokenProviderOptions = {
  clientId: string;
  clientSecret: string;
  store: TokenStore;
  fetch?: typeof fetch;
  now?: () => number;
};

const RENEW_BEFORE_MS = 24 * 60 * 60 * 1000;
const TOKEN_URL = "https://id.twitch.tv/oauth2/token";

const tokenResponse = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
  token_type: z.string(),
});

export function createTokenProvider({
  clientId,
  clientSecret,
  store,
  fetch: fetchImpl = fetch,
  now = Date.now,
}: TokenProviderOptions): TokenProvider {
  let cached: StoredToken | null = null;
  // Concurrent callers share one lookup instead of each requesting a token.
  let pending: Promise<StoredToken> | null = null;

  const usable = (token: StoredToken | null): token is StoredToken =>
    token !== null && token.expiresAt.getTime() - now() > RENEW_BEFORE_MS;

  async function requestNew(): Promise<StoredToken> {
    const url = new URL(TOKEN_URL);
    url.search = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }).toString();

    const response = await fetchImpl(url, { method: "POST" });
    if (!response.ok) {
      throw new IgdbError(
        `Twitch refused the app credentials (${response.status})`,
        "auth",
        response.status,
      );
    }
    const parsed = tokenResponse.safeParse(await response.json());
    if (!parsed.success)
      throw new IgdbError("Twitch sent an unexpected token response", "bad-response");

    const token = {
      accessToken: parsed.data.access_token,
      expiresAt: new Date(now() + parsed.data.expires_in * 1000),
    };
    await store.write(token);
    return token;
  }

  function once(load: () => Promise<StoredToken>): Promise<StoredToken> {
    pending ??= load()
      .then((token) => {
        cached = token;
        return token;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  }

  return {
    async get() {
      if (usable(cached)) return cached.accessToken;
      const token = await once(async () => {
        const stored = await store.read();
        return usable(stored) ? stored : requestNew();
      });
      return token.accessToken;
    },

    async replace(rejected) {
      cached = null;
      const token = await once(async () => {
        // Another server instance may already have renewed it.
        const stored = await store.read();
        return usable(stored) && stored.accessToken !== rejected ? stored : requestNew();
      });
      return token.accessToken;
    },
  };
}
