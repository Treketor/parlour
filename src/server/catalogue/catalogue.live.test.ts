import { describe, expect, it } from "vitest";
import { adminClient } from "../supabase-admin";
import { getCatalogue } from ".";

/*
 * End to end against IGDB and the real database: token, rate limiter, query,
 * mapping, store_igdb_games(), search cache and read-back. Run with
 * `npm run test:live`. It writes real catalogue rows, which is what using the
 * app would do anyway.
 */

describe("catalogue, live", () => {
  it("searches IGDB and stores what it finds", async () => {
    const results = await getCatalogue().search("Outer Wilds");

    const outerWilds = results.find((game) => game.id === 11737);
    expect(outerWilds).toMatchObject({ name: "Outer Wilds", slug: "outer-wilds" });
    expect(outerWilds?.platforms.map((platform) => platform.abbreviation)).toContain("PC");
    expect(outerWilds?.coverImageId).toBeTruthy();
  });

  it("answers the same search from the cache", async () => {
    const { data } = await adminClient()
      .from("igdb_search_cache")
      .select("game_ids, expires_at")
      .eq("query", "outer wilds")
      .single();

    expect(data?.game_ids).toContain(11737);
    expect(new Date(data?.expires_at ?? 0).getTime()).toBeGreaterThan(Date.now());
  });

  it("stored the related records", async () => {
    const admin = adminClient();
    const [media, releases, external, token] = await Promise.all([
      admin.from("game_media").select("kind").eq("game_id", 11737),
      admin.from("release_dates").select("precision").eq("game_id", 11737),
      admin.from("game_external_ids").select("source, uid").eq("game_id", 11737),
      admin.from("provider_tokens").select("expires_at").eq("provider", "igdb").single(),
    ]);

    expect(media.data?.some((row) => row.kind === "cover")).toBe(true);
    expect(media.data?.some((row) => row.kind === "screenshot")).toBe(true);
    expect(releases.data?.length).toBeGreaterThan(0);
    expect(external.data?.some((row) => row.source === "steam")).toBe(true);
    expect(new Date(token.data?.expires_at ?? 0).getTime()).toBeGreaterThan(Date.now());
  });

  it("stores an unreleased game with its dates marked to be decided", async () => {
    const [game] = await getCatalogue().ensure([81249]);
    expect(game).toMatchObject({ name: "The Elder Scrolls VI", firstReleaseDate: null });
  });
});
