// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEW,
  NO_FILTERS,
  filterEntries,
  hasFilters,
  libraryPreferences,
  narrowColumns,
  parseColumns,
  libraryViewParams,
  withLibraryPreferences,
  parseLibraryView,
  progressCounts,
  type FilterableEntry,
  type LibraryViewState,
} from "./library-view";

function entry(overrides: Partial<FilterableEntry> & { title: string }): FilterableEntry {
  return {
    platform: "PC",
    platformId: 6,
    ownership: "owned",
    progress: "want_to_play",
    addedAt: new Date("2026-01-01"),
    tags: [],
    ...overrides,
  };
}

const titles = (entries: FilterableEntry[]) => entries.map((item) => item.title);

describe("parseLibraryView", () => {
  it("gives the default view for no parameters", () => {
    expect(parseLibraryView({})).toEqual(DEFAULT_VIEW);
  });

  it("reads every parameter", () => {
    expect(
      parseLibraryView({
        view: "grid",
        sort: "rating",
        dir: "asc",
        progress: "playing,paused",
        own: "want_to_own",
        platform: "167",
        tag: "Co-op",
        q: " zelda ",
      }),
    ).toEqual({
      layout: "grid",
      columns: null,
      sort: { key: "rating", direction: "asc" },
      filters: {
        progress: ["playing", "paused"],
        ownership: "want_to_own",
        platformId: 167,
        tag: "Co-op",
        text: "zelda",
      },
    } satisfies LibraryViewState);
  });

  it("starts a sort in its natural direction when none is given", () => {
    expect(parseLibraryView({ sort: "title" }).sort).toEqual({ key: "title", direction: "asc" });
    expect(parseLibraryView({ sort: "rating" }).sort).toEqual({ key: "rating", direction: "desc" });
  });

  it("ignores values it does not know", () => {
    expect(
      parseLibraryView({
        view: "table",
        sort: "price",
        dir: "sideways",
        progress: "playing,napping",
        own: "borrowed",
        platform: "-3",
      }),
    ).toEqual({
      ...DEFAULT_VIEW,
      filters: { ...NO_FILTERS, progress: ["playing"] },
    });
  });

  it("takes the first of repeated parameters", () => {
    expect(parseLibraryView({ view: ["grid", "list"] }).layout).toBe("grid");
  });
});

describe("libraryViewParams", () => {
  it("leaves the default view out entirely", () => {
    expect(libraryViewParams(DEFAULT_VIEW).toString()).toBe("");
  });

  it("only writes a direction that differs from the natural one", () => {
    const view = { ...DEFAULT_VIEW, sort: { key: "title", direction: "asc" } } as const;
    expect(libraryViewParams(view).toString()).toBe("sort=title");
    const flipped = { ...DEFAULT_VIEW, sort: { key: "title", direction: "desc" } } as const;
    expect(libraryViewParams(flipped).toString()).toBe("sort=title&dir=desc");
  });

  it("writes progress in the canonical order", () => {
    const view = {
      ...DEFAULT_VIEW,
      filters: { ...NO_FILTERS, progress: ["paused", "playing"] },
    } satisfies LibraryViewState;
    expect(libraryViewParams(view).get("progress")).toBe("playing,paused");
  });

  it("round-trips through parseLibraryView", () => {
    const view: LibraryViewState = {
      layout: "covers",
      columns: 8,
      sort: { key: "platform", direction: "desc" },
      filters: {
        progress: ["finished", "completed"],
        ownership: "owned",
        platformId: 130,
        tag: "Co-op",
        text: "mario kart",
      },
    };
    const params = Object.fromEntries(libraryViewParams(view));
    expect(parseLibraryView(params)).toEqual(view);
  });
});

describe("hasFilters", () => {
  it("is false for no filters and for blank text", () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
    expect(hasFilters({ ...NO_FILTERS, text: "  " })).toBe(false);
  });

  it("is true for any one filter", () => {
    expect(hasFilters({ ...NO_FILTERS, platformId: 6 })).toBe(true);
    expect(hasFilters({ ...NO_FILTERS, progress: ["playing"] })).toBe(true);
  });
});

describe("filterEntries", () => {
  const library = [
    entry({ title: "Pokémon White Version 2", platformId: 20, progress: "finished" }),
    entry({ title: "The Last of Us Part II", platformId: 167, progress: "playing" }),
    entry({
      title: "Borderlands 2",
      platformId: 12,
      ownership: "want_to_own",
      tags: [{ name: "Co-op" }],
    }),
    entry({ title: "The Legend of Zelda: Breath of the Wild", platformId: 130 }),
  ];

  it("keeps everything with no filters", () => {
    expect(filterEntries(library, NO_FILTERS)).toHaveLength(4);
  });

  it("matches titles ignoring accents and case", () => {
    expect(titles(filterEntries(library, { ...NO_FILTERS, text: "POKEMON" }))).toEqual([
      "Pokémon White Version 2",
    ]);
  });

  it("matches every word, in any order", () => {
    expect(titles(filterEntries(library, { ...NO_FILTERS, text: "breath zelda" }))).toEqual([
      "The Legend of Zelda: Breath of the Wild",
    ]);
    expect(filterEntries(library, { ...NO_FILTERS, text: "zelda mario" })).toEqual([]);
  });

  it("keeps any of the chosen progress states", () => {
    expect(
      titles(filterEntries(library, { ...NO_FILTERS, progress: ["playing", "finished"] })),
    ).toEqual(["Pokémon White Version 2", "The Last of Us Part II"]);
  });

  it("combines filters", () => {
    expect(
      titles(
        filterEntries(library, {
          ...NO_FILTERS,
          ownership: "want_to_own",
          tag: "Co-op",
          platformId: 12,
        }),
      ),
    ).toEqual(["Borderlands 2"]);
    expect(filterEntries(library, { ...NO_FILTERS, ownership: "owned", tag: "Co-op" })).toEqual([]);
  });
});

describe("progressCounts", () => {
  it("counts states in the canonical order and leaves out empty ones", () => {
    const counts = progressCounts([
      { progress: "finished" },
      { progress: "playing" },
      { progress: "finished" },
    ]);
    expect(counts).toEqual([
      { progress: "playing", count: 1 },
      { progress: "finished", count: 2 },
    ]);
  });
});

describe("libraryPreferences", () => {
  it("keeps the layout and order but not the filters", () => {
    const view: LibraryViewState = {
      layout: "grid",
      columns: null,
      sort: { key: "title", direction: "desc" },
      filters: { ...NO_FILTERS, text: "zelda", platformId: 130 },
    };
    expect(libraryPreferences(view)).toBe("view=grid&sort=title&dir=desc");
    expect(libraryPreferences(DEFAULT_VIEW)).toBe("");
  });
});

describe("withLibraryPreferences", () => {
  it("fills in the remembered layout and order", () => {
    expect(
      parseLibraryView(withLibraryPreferences({ q: "mario" }, "view=grid&sort=title")),
    ).toEqual({
      layout: "grid",
      columns: null,
      sort: { key: "title", direction: "asc" },
      filters: { ...NO_FILTERS, text: "mario" },
    });
  });

  it("lets an address that chooses a layout or order win", () => {
    expect(withLibraryPreferences({ sort: "rating" }, "view=grid")).toEqual({ sort: "rating" });
  });

  it("leaves the parameters alone with nothing remembered", () => {
    expect(withLibraryPreferences({ q: "x" }, undefined)).toEqual({ q: "x" });
  });
});

describe("columns", () => {
  it("reads a chosen count and the covers layout from the address", () => {
    expect(parseLibraryView({ view: "covers", cols: "8" })).toMatchObject({
      layout: "covers",
      columns: 8,
    });
  });

  it("treats a count that is not offered as automatic", () => {
    expect(parseColumns("2")).toBeNull();
    expect(parseColumns("11")).toBeNull();
    expect(parseColumns("six")).toBeNull();
  });

  it("remembers the count with the layout", () => {
    expect(libraryPreferences({ ...DEFAULT_VIEW, layout: "covers", columns: 6 })).toBe(
      "view=covers&cols=6",
    );
  });

  it("halves the count on a phone, never below two", () => {
    expect(narrowColumns(10)).toBe(5);
    expect(narrowColumns(7)).toBe(4);
    expect(narrowColumns(3)).toBe(2);
  });
});
