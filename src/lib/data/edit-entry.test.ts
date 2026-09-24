// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  NOTES_MAX_LENGTH,
  datesInOrder,
  isIsoDate,
  normaliseTagName,
  parseEntryUpdate,
  sameTagName,
  datesFor,
  ownershipFits,
  showsProgress,
  tracksProgress,
} from "./edit-entry";

const entryId = "7d0c9a3e-2f5b-4c1d-9a8e-3b6f1e2d4c5a";

describe("parseEntryUpdate", () => {
  it("accepts each editable field", () => {
    expect(
      parseEntryUpdate({
        entryId,
        patch: {
          ownership: "owned",
          progress: "finished",
          rating: 8,
          notes: "Played it on a train.",
          startedOn: "2026-01-02",
          finishedOn: "2026-02-03",
        },
      }),
    ).toEqual({
      entryId,
      patch: {
        ownership: "owned",
        progress: "finished",
        rating: 8,
        notes: "Played it on a train.",
        startedOn: "2026-01-02",
        finishedOn: "2026-02-03",
      },
    });
  });

  it("accepts clearing the rating and dates", () => {
    expect(
      parseEntryUpdate({ entryId, patch: { rating: null, startedOn: null, finishedOn: null } }),
    ).toEqual({ entryId, patch: { rating: null, startedOn: null, finishedOn: null } });
  });

  it.each([
    ["an empty patch", {}],
    ["an unknown field", { userId: "someone-else" }],
    ["an unknown progress", { progress: "napping" }],
    ["a rating of 0", { rating: 0 }],
    ["a fractional rating", { rating: 7.5 }],
    ["a rating as text", { rating: "8" }],
    ["an impossible date", { startedOn: "2026-02-30" }],
    ["a date with a time", { startedOn: "2026-02-03T10:00:00Z" }],
    ["notes that are too long", { notes: "x".repeat(NOTES_MAX_LENGTH + 1) }],
    ["a finish before the start", { startedOn: "2026-03-01", finishedOn: "2026-02-01" }],
  ])("refuses %s", (_, patch) => {
    expect(parseEntryUpdate({ entryId, patch })).toBeNull();
  });

  it("refuses a malformed entry id", () => {
    expect(parseEntryUpdate({ entryId: "1", patch: { rating: 5 } })).toBeNull();
    expect(parseEntryUpdate(null)).toBeNull();
  });
});

describe("isIsoDate", () => {
  it("accepts real dates, including 29 February in a leap year", () => {
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("26-1-2")).toBe(false);
  });
});

describe("datesInOrder", () => {
  it("allows missing dates and the same day", () => {
    expect(datesInOrder(null, "2026-01-01")).toBe(true);
    expect(datesInOrder("2026-01-01", undefined)).toBe(true);
    expect(datesInOrder("2026-01-01", "2026-01-01")).toBe(true);
    expect(datesInOrder("2026-01-02", "2026-01-01")).toBe(false);
  });
});

describe("normaliseTagName", () => {
  it("trims and collapses spaces", () => {
    expect(normaliseTagName("  Couch   co-op ")).toBe("Couch co-op");
  });

  it("refuses empty and over-long names", () => {
    expect(normaliseTagName("   ")).toBeNull();
    expect(normaliseTagName("x".repeat(41))).toBeNull();
    expect(normaliseTagName(42)).toBeNull();
  });
});

describe("sameTagName", () => {
  it("ignores case", () => {
    expect(sameTagName("Co-op", "co-op")).toBe(true);
    expect(sameTagName("Co-op", "Coop")).toBe(false);
  });
});

describe("progress and ownership", () => {
  it("tracks progress only for games you own", () => {
    expect(tracksProgress("owned")).toBe(true);
    expect(tracksProgress("want_to_own")).toBe(false);
    expect(tracksProgress("not_interested")).toBe(false);
  });

  it("refuses ownership that contradicts progress", () => {
    expect(ownershipFits("owned", "playing")).toBe(true);
    expect(ownershipFits("want_to_own", "want_to_play")).toBe(true);
    expect(ownershipFits("want_to_own", "playing")).toBe(false);
    expect(ownershipFits("not_interested", "finished")).toBe(false);
  });

  it("hides progress for a game passed on", () => {
    expect(showsProgress("not_interested")).toBe(false);
    expect(showsProgress("want_to_own")).toBe(true);
  });
});

describe("datesFor", () => {
  it("shows no dates before a game is started", () => {
    expect(datesFor("want_to_play")).toEqual({ started: false, finished: false });
  });

  it("shows a start date once begun and a finish date once done", () => {
    expect(datesFor("playing")).toEqual({ started: true, finished: false });
    expect(datesFor("abandoned")).toEqual({ started: true, finished: false });
    expect(datesFor("completed")).toEqual({ started: true, finished: true });
  });
});
