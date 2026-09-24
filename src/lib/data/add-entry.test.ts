// @vitest-environment node
import { describe, expect, it } from "vitest";
import { entryKey, parseAddEntry, parseChangeOwnership } from "./add-entry";

describe("parseAddEntry", () => {
  it("accepts a well-formed request", () => {
    expect(parseAddEntry({ gameId: 11737, platformId: 6, ownership: "owned" })).toEqual({
      gameId: 11737,
      platformId: 6,
      ownership: "owned",
    });
  });

  it("accepts numeric strings, as form data sends them", () => {
    expect(
      parseAddEntry({ gameId: "11737", platformId: "6", ownership: "want_to_own" }),
    ).toMatchObject({
      gameId: 11737,
      platformId: 6,
    });
  });

  it.each([
    ["an unknown ownership", { gameId: 1, platformId: 6, ownership: "borrowed" }],
    ["a negative id", { gameId: -1, platformId: 6, ownership: "owned" }],
    ["a fractional id", { gameId: 1.5, platformId: 6, ownership: "owned" }],
    ["a missing platform", { gameId: 1, ownership: "owned" }],
    ["something that is not an object", "11737"],
    ["null", null],
    ["a boolean id", { gameId: true, platformId: 6, ownership: "owned" }],
    ["an empty id", { gameId: "", platformId: 6, ownership: "owned" }],
  ])("refuses %s", (_, input) => {
    expect(parseAddEntry(input)).toBeNull();
  });
});

describe("entryKey", () => {
  it("identifies a game on a platform", () => {
    expect(entryKey(11737, 6)).toBe("11737:6");
  });
});

describe("parseChangeOwnership", () => {
  it("accepts an entry id and a known ownership", () => {
    expect(
      parseChangeOwnership({
        entryId: "345974fc-5850-4658-a275-d1d6f66bf3bc",
        ownership: "want_to_own",
      }),
    ).toEqual({ entryId: "345974fc-5850-4658-a275-d1d6f66bf3bc", ownership: "want_to_own" });
  });

  it.each([
    ["an id that is not a uuid", { entryId: "1; drop table", ownership: "owned" }],
    [
      "an unknown ownership",
      { entryId: "345974fc-5850-4658-a275-d1d6f66bf3bc", ownership: "lent" },
    ],
    ["nothing", null],
  ])("refuses %s", (_, input) => {
    expect(parseChangeOwnership(input)).toBeNull();
  });
});
