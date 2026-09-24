// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  criticSearchLink,
  firstReleases,
  formatRelease,
  isUpcoming,
  guideLinks,
  regionLabel,
  releaseState,
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
      { platform: "Nintendo Switch", date: "1 Mar 2017", regions: ["Japan"], on: "2017-03-01" },
      {
        platform: "Nintendo Switch",
        date: "3 Mar 2017",
        regions: ["Europe", "North America"],
        on: "2017-03-03",
      },
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
      { platform: "Nintendo Switch", date: "1 Mar 2017", regions: ["Japan"], on: "2017-03-01" },
      { platform: "Wii U", date: "3 Mar 2017", regions: ["Worldwide"], on: "2017-03-03" },
    ]);
  });
});

describe("criticSearchLink", () => {
  it("searches Metacritic for the name", () => {
    expect(criticSearchLink("The Legend of Zelda: Ocarina of Time").href).toBe(
      "https://www.metacritic.com/search/The%20Legend%20of%20Zelda%3A%20Ocarina%20of%20Time/",
    );
  });
});

describe("releaseState", () => {
  const today = "2026-09-24";

  it("gives a released game its date", () => {
    expect(releaseState("2017-03-03", [release({})], today)).toEqual({
      status: "released",
      label: "3 Mar 2017",
    });
  });

  it("gives an upcoming game its date only as exactly as it is known", () => {
    const yearOnly = release({ releasedOn: "2027-12-31", precision: "year" });
    expect(releaseState("2027-12-31", [yearOnly], today)).toEqual({
      status: "upcoming",
      label: "Coming 2027",
    });
    const quarter = release({ releasedOn: "2026-12-31", precision: "quarter", label: "Q4 2026" });
    expect(releaseState("2026-12-31", [quarter], today).label).toBe("Coming Q4 2026");
    const day = release({ releasedOn: "2026-11-05" });
    expect(releaseState("2026-11-05", [day], today).label).toBe("Coming 5 Nov 2026");
  });

  it("says when no date has been announced", () => {
    expect(releaseState(null, [release({ releasedOn: null, precision: "tbd" })], today)).toEqual({
      status: "unannounced",
      label: "Release date not announced",
    });
  });
});

describe("isUpcoming", () => {
  it("marks future and unannounced dates", () => {
    const [future, undated] = releaseLines([
      release({ platform: "PlayStation 5", releasedOn: "2026-11-19" }),
      release({ platform: "PC", releasedOn: null, precision: "tbd" }),
    ]);
    expect(future && isUpcoming(future, "2026-09-24")).toBe(true);
    expect(undated && isUpcoming(undated, "2026-09-24")).toBe(true);
    expect(future && isUpcoming(future, "2026-12-01")).toBe(false);
  });
});
