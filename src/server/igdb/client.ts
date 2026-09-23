import type { z } from "zod";
import { IgdbError } from "./errors";
import type { RateLimiter } from "./rate-limit";
import type { TokenProvider } from "./token";

/*
 * Every IGDB request goes through here: rate-limited, authenticated with the
 * shared token, retried on rate limits and server errors with backoff, and
 * validated against a schema before anything else sees the data.
 */

export type IgdbClient = {
  query<T>(endpoint: string, body: string, schema: z.ZodType<T>): Promise<T>;
};

type ClientOptions = {
  clientId: string;
  tokens: TokenProvider;
  limit: RateLimiter;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
};

const BASE_URL = "https://api.igdb.com/v4";

function retryDelay(response: Response | null, attempt: number): number {
  const retryAfter = Number(response?.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 10_000);
  return 250 * 2 ** attempt;
}

export function createIgdbClient({
  clientId,
  tokens,
  limit,
  fetch: fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxAttempts = 4,
}: ClientOptions): IgdbClient {
  return {
    async query(endpoint, body, schema) {
      let token = await tokens.get();
      let replacedToken = false;
      let lastStatus: number | undefined;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        let response: Response | null = null;
        try {
          response = await limit(() =>
            fetchImpl(`${BASE_URL}/${endpoint}`, {
              method: "POST",
              headers: {
                "Client-ID": clientId,
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              body,
            }),
          );
        } catch {
          // Network failure: treat like a server error and try again.
        }

        lastStatus = response?.status;

        if (response?.ok) {
          const parsed = schema.safeParse(await response.json());
          if (!parsed.success) {
            throw new IgdbError(
              `IGDB /${endpoint} sent data in an unexpected shape`,
              "bad-response",
            );
          }
          return parsed.data;
        }

        if (response?.status === 401 && !replacedToken) {
          token = await tokens.replace(token);
          replacedToken = true;
          continue;
        }

        if (
          response &&
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          throw new IgdbError(
            `IGDB rejected the /${endpoint} query (${response.status})`,
            response.status === 401 ? "auth" : "bad-request",
            response.status,
          );
        }

        if (attempt < maxAttempts - 1) await sleep(retryDelay(response, attempt));
      }

      throw new IgdbError(
        `IGDB /${endpoint} did not answer after ${maxAttempts} attempts`,
        lastStatus === 429 ? "rate-limit" : "unavailable",
        lastStatus,
      );
    },
  };
}
