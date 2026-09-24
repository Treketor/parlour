// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  firstReleases,
  formatRelease,
  guideLinks,
  regionLabel,
  releaseLines,
  storeLinks,
  type ReleaseRow,
} from "./game-detail";

function release(overrides: Partial<ReleaseRow>): ReleaseRow {
  return {
    platformId: 130,
    platform: "Nintendo Switch",
    releasedOn: "2017-03-03",
    precision: "day",
    label: null,
    region: "worldwide",
    ...overrides,
  };
}

describe("formatRelease", () => {
  it("shows a date only as exact as it is known", () => {
    expect(formatRelease(release({}))).toBe("3 Mar 2017");
    expect(formatRelease(release({ precision: "month" }))).toBe("Mar 2017");
    expect(formatRelease(release({ precision: "year" }))).toBe("2017");
  });

  it("uses IGDB's wording for quarters and TBA for unknown dates", () => {
    expect(formatRelease(release({ precision: "quarter", label: "Q3 2026" }))).toBe("Q3 2026");
    expect(formatRelease(release({ precision: "tbd", releasedOn: null }))).toBe("TBA");
    expect(formatRelease(release({ precision: "day", releasedOn: null }))).toBe("TBA");
  });
});

describe("regionLabel", () => {
  it("names regions in words", () => {
    expect(regionLabel("north_america")).toBe("North America");
    expect(regionLabel(null)).toBe("Region not listed");
  });
});

describe("releaseLines", () => {
  it("groups regions that share a platform and a date", () => {
    expect(
      releaseLines([
        release({ region: "europe" }),
        release({ region: "north_america" }),
        release({ region: "japan", releasedOn: "2017-03-01" }),
      ]),
    ).toEqual([
      { platform: "Nintendo Switch", date: "1 Mar 2017", regions: ["Japan"] },
      { platform: "Nintendo Switch", date: "3 Mar 2017", regions: ["Europe", "North America"] },
    ]);
  });

  it("orders platforms by their first release and shortens Windows to PC", () => {
    const lines = releaseLines([
      release({ platform: "PC (Microsoft Windows)", releasedOn: "2019-05-01" }),
      release({ platform: "PlayStation 4", releasedOn: "2018-01-01" }),
    ]);
    expect(lines.map((line) => line.platform)).toEqual(["PlayStation 4", "PC"]);
  });

  it("lets worldwide stand alone", () => {
    expect(
      releaseLines([release({ region: "worldwide" }), release({ region: "europe" })])[0]?.regions,
    ).toEqual(["Worldwide"]);
  });

  it("puts undated releases last", () => {
    const lines = releaseLines([
      release({ platform: "PlayStation 5", releasedOn: null, precision: "tbd" }),
      release({ platform: "Nintendo Switch" }),
    ]);
    expect(lines.map((line) => line.date)).toEqual(["3 Mar 2017", "TBA"]);
  });
});

describe("guideLinks", () => {
  it("builds searches with the name encoded", () => {
    const links = guideLinks("Ori & the Blind Forest");
    expect(links[0]?.href).toBe(
      "https://www.youtube.com/results?search_query=Ori%20%26%20the%20Blind%20Forest%20walkthrough",
    );
    expect(links[1]?.href).toBe(
      "https://gamefaqs.gamespot.com/search?game=Ori%20%26%20the%20Blind%20Forest",
    );
  });
});

describe("storeLinks", () => {
  it("links a Steam app id and ignores other stores", () => {
    expect(storeLinks([{ source: "steam", uid: "367520" }])[0]?.href).toBe(
      "https://store.steampowered.com/app/367520/",
    );
    expect(storeLinks([{ source: "gog", uid: "1234" }])).toEqual([]);
    expect(storeLinks([{ source: "steam", uid: "../evil" }])).toEqual([]);
  });
});

describe("firstReleases", () => {
  it("keeps each platform's first line", () => {
    const lines = releaseLines([
      release({ region: "japan", releasedOn: "2017-03-01" }),
      release({ region: "europe" }),
      release({ platform: "Wii U", region: "worldwide" }),
    ]);
    expect(firstReleases(lines)).toEqual([
      { platform: "Nintendo Switch", date: "1 Mar 2017", regions: ["Japan"] },
      { platform: "Wii U", date: "3 Mar 2017", regions: ["Worldwide"] },
    ]);
  });
});
