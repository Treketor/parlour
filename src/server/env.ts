import "server-only";

/*
 * Secrets. Importing this from browser code fails the build (server-only),
 * so none of these can end up in a client bundle by accident.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env.local (see .env.example).`);
  }
  return value;
}

export const serverEnv = {
  get twitchClientId() {
    return required("TWITCH_CLIENT_ID");
  },
  get twitchClientSecret() {
    return required("TWITCH_CLIENT_SECRET");
  },
  get supabaseSecretKey() {
    return required("SUPABASE_SECRET_KEY");
  },
  /** Optional: without it, the game page's prices section is left out. */
  get itadApiKey(): string | undefined {
    return process.env.ITAD_API_KEY || undefined;
  },
  /** Optional: without it, Metacritic and RAWG scores are simply not looked up. */
  get rawgApiKey(): string | undefined {
    return process.env.RAWG_API_KEY || undefined;
  },
};
