/** A failure talking to Twitch or IGDB, with enough context to log and decide what to show. */
export class IgdbError extends Error {
  constructor(
    message: string,
    readonly kind: "auth" | "rate-limit" | "unavailable" | "bad-response" | "bad-request",
    readonly status?: number,
  ) {
    super(message);
    this.name = "IgdbError";
  }
}
