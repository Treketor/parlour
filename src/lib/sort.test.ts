// @vitest-environment node
import { describe, expect, it } from "vitest";
import { nextSort, sortEntries, sortableTitle, type SortableEntry } from "./sort";

function entry(overrides: Partial<SortableEntry> & { title: string }): SortableEntry {
  return { platform: "PC", addedAt: new Date("2026-01-01"), ...overrides };
}

const titles = (entries: SortableEntry[]) => entries.map((item) => item.title);

describe("sortableTitle", () => {
  it("drops a leading article", () => {
    expect(sortableTitle("The Elder Scrolls VI")).toBe("Elder Scrolls VI");
    expect(sortableTitle("A Short Hike")).toBe("Short Hike");
  });

  it("leaves titles that only start with the letters alone", () => {
    expect(sortableTitle("Theme Hospital")).toBe("Theme Hospital");
    expect(sortableTitle("Anodyne")).toBe("Anodyne");
  });
});

describe("sortEntries", () => {
  it("sorts titles ignoring articles and case, with numbers in natural order", () => {
    const sorted = sortEntries(
      [
        entry({ title: "the Witness" }),
        entry({ title: "Hades II" }),
        entry({ title: "Hades" }),
        entry({ title: "Outer Wilds" }),
        entry({ title: "Mario Kart 8" }),
        entry({ title: "Mario Kart 64" }),
      ],
      "title",
      "asc",
    );
    expect(titles(sorted)).toEqual([
      "Hades",
      "Hades II",
      "Mario Kart 8",
      "Mario Kart 64",
      "Outer Wilds",
      "the Witness",
    ]);
  });

  it("keeps unrated entries last in both directions", () => {
    const entries = [
      entry({ title: "B", rating: 5 }),
      entry({ title: "A", rating: null }),
      entry({ title: "C", rating: 9 }),
    ];
    expect(titles(sortEntries(entries, "rating", "desc"))).toEqual(["C", "B", "A"]);
    expect(titles(sortEntries(entries, "rating", "asc"))).toEqual(["B", "C", "A"]);
  });

  it("orders progress by the lifecycle, not alphabetically", () => {
    const entries = [
      entry({ title: "A", progress: "abandoned" }),
      entry({ title: "B", progress: "want_to_play" }),
      entry({ title: "C", progress: "playing" }),
    ];
    expect(titles(sortEntries(entries, "progress", "asc"))).toEqual(["B", "C", "A"]);
  });

  it("breaks ties by title so the order is stable", () => {
    const entries = [entry({ title: "Zeta", rating: 7 }), entry({ title: "Alpha", rating: 7 })];
    expect(titles(sortEntries(entries, "rating", "desc"))).toEqual(["Alpha", "Zeta"]);
  });

  it("sorts by date added", () => {
    const entries = [
      entry({ title: "Old", addedAt: new Date("2020-01-01") }),
      entry({ title: "New", addedAt: new Date("2026-01-01") }),
    ];
    expect(titles(sortEntries(entries, "added", "desc"))).toEqual(["New", "Old"]);
  });

  it("does not mutate its input", () => {
    const entries = [entry({ title: "B" }), entry({ title: "A" })];
    sortEntries(entries, "title", "asc");
    expect(titles(entries)).toEqual(["B", "A"]);
  });
});

describe("nextSort", () => {
  it("flips direction when the same column is chosen again", () => {
    expect(nextSort({ key: "title", direction: "asc" }, "title")).toEqual({
      key: "title",
      direction: "desc",
    });
  });

  it("starts ratings and dates highest or newest first", () => {
    expect(nextSort({ key: "title", direction: "asc" }, "rating").direction).toBe("desc");
    expect(nextSort({ key: "title", direction: "asc" }, "added").direction).toBe("desc");
    expect(nextSort({ key: "rating", direction: "desc" }, "platform").direction).toBe("asc");
  });
});
