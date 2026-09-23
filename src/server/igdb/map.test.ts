// @vitest-environment node
import { describe, expect, it } from "vitest";
import searchOuterWilds from "./fixtures/search-outer-wilds.json";
import unreleased from "./fixtures/game-unreleased.json";
import { cleanText, mapGames, unixToDate } from "./map";
import { igdbGames } from "./schema";

const search = igdbGames.parse(searchOuterWilds);
const tba = igdbGames.parse(unreleased);

describe("saved IGDB responses", () => {
  it("parse with the schema the client uses", () => {
    expect(search.length).toBeGreaterThan(0);
    expect(tba).toHaveLength(1);
  });
});

describe("mapGames", () => {
  const batch = mapGames(search);
  const outerWilds = batch.games.find((game) => game.id === 11737);

  it("maps the core fields of a released game", () => {
    expect(outerWilds).toMatchObject({
      slug: "outer-wilds",
      name: "Outer Wilds",
      game_type: "Main Game",
      first_release_date: "2019-05-28",
    });
    expect(outerWilds?.cover_image_id).toBeTruthy();
  });

  it("keeps scores to two decimals and always carries their counts", () => {
    expect(outerWilds?.critic_rating).toBe(
      Math.round((outerWilds?.critic_rating ?? 0) * 100) / 100,
    );
    expect(outerWilds?.critic_rating_count).toBeGreaterThan(0);
  });

  it("strips invisible characters from titles", () => {
    const textAdventure = batch.games.find((game) => game.id === 304188);
    expect(textAdventure?.name.startsWith("Outer Wilds")).toBe(true);
  });

  it("collects each platform and genre once across the batch", () => {
    const ids = batch.platforms.map((platform) => platform.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(batch.platforms.find((platform) => platform.id === 6)).toMatchObject({
      name: "PC (Microsoft Windows)",
      abbreviation: "PC",
      platform_type: "Operating_system",
    });
  });

  it("orders screenshots and puts the cover first in media", () => {
    const media = outerWilds?.media ?? [];
    expect(media[0]?.kind).toBe("cover");
    const screenshots = media.filter((item) => item.kind === "screenshot");
    expect(screenshots.map((item) => item.position)).toEqual(screenshots.map((_, index) => index));
  });

  it("keeps only the stores Parlour uses from external ids", () => {
    const sources = new Set(outerWilds?.external_ids.map((external) => external.source));
    for (const source of sources) expect(["steam", "gog", "epic"]).toContain(source);
    expect(sources.has("steam")).toBe(true);
  });

  it("only links release dates to platforms the game lists", () => {
    const platformIds = new Set(outerWilds?.platform_ids);
    for (const release of outerWilds?.release_dates ?? []) {
      if (release.platform_id !== null) expect(platformIds.has(release.platform_id)).toBe(true);
    }
  });

  it("gives an unreleased game no dates, marking each release as to be decided", () => {
    const game = mapGames(tba).games[0];
    expect(game?.first_release_date).toBeNull();
    expect(game?.release_dates.length).toBeGreaterThan(0);
    for (const release of game?.release_dates ?? []) {
      expect(release).toMatchObject({ precision: "tbd", released_on: null, label: "TBD" });
    }
  });
});

describe("mapGames edge cases", () => {
  it("does not invent a full date from a year-only release", () => {
    const [game] = mapGames([
      {
        id: 1,
        name: "Year Only",
        slug: "year-only",
        platforms: [{ id: 6, name: "PC", slug: "win" }],
        release_dates: [{ id: 9, date: 1767225600, date_format: 2, human: "2026", platform: 6 }],
      },
    ]).games;
    expect(game?.release_dates[0]).toMatchObject({
      precision: "year",
      released_on: null,
      label: "2026",
    });
  });

  it("drops the platform link when a release names an unlisted platform", () => {
    const [game] = mapGames([
      {
        id: 2,
        name: "Odd Release",
        slug: "odd-release",
        platforms: [{ id: 6, name: "PC", slug: "win" }],
        release_dates: [{ id: 10, date: 1767225600, date_format: 0, platform: 999 }],
      },
    ]).games;
    expect(game?.release_dates[0]?.platform_id).toBeNull();
    expect(game?.release_dates[0]?.released_on).toBe("2026-01-01");
  });

  it("clamps scores into 0 to 100", () => {
    const [game] = mapGames([
      { id: 3, name: "Odd Score", slug: "odd-score", rating: 100.4, aggregated_rating: -2 },
    ]).games;
    expect(game).toMatchObject({ igdb_rating: 100, critic_rating: 0, igdb_rating_count: 0 });
  });
});

describe("helpers", () => {
  it("cleanText removes zero-width characters and trims", () => {
    expect(cleanText("\u200B Outer Wilds\uFEFF ")).toBe("Outer Wilds");
  });

  it("unixToDate reads IGDB timestamps as UTC calendar dates", () => {
    expect(unixToDate(1571097600)).toBe("2019-10-15");
  });
});
