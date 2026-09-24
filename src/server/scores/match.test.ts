// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normaliseTitle, pickRawgMatch, type RawgCandidate } from "./match";

function candidate(overrides: Partial<RawgCandidate> & { name: string }): RawgCandidate {
  return {
    id: 1,
    slug: "x",
    released: "1998-11-21",
    metacritic: 99,
    rating: 4.5,
    ratings_count: 1000,
    ...overrides,
  };
}

const ocarina = {
  name: "The Legend of Zelda: Ocarina of Time",
  slug: "the-legend-of-zelda-ocarina-of-time",
  firstReleaseDate: "1998-11-21",
};

describe("normaliseTitle", () => {
  it("sets aside accents, punctuation, apostrophes and ampersands", () => {
    expect(normaliseTitle("Pokémon: Let’s Go, Pikachu!")).toBe("pokemon lets go pikachu");
    expect(normaliseTitle("Ratchet & Clank")).toBe(normaliseTitle("Ratchet and Clank"));
  });
});

describe("pickRawgMatch", () => {
  it("takes the same title from the same year", () => {
    const match = pickRawgMatch(ocarina, [
      candidate({ id: 2, name: "The Legend of Zelda: Ocarina of Time 3D", released: "2011-06-16" }),
      candidate({ id: 3, name: "The Legend of Zelda: Ocarina of Time" }),
    ]);
    expect(match?.id).toBe(3);
  });

  it("refuses a namesake from another decade", () => {
    const prey = { name: "Prey", slug: "prey", firstReleaseDate: "2017-05-05" };
    expect(pickRawgMatch(prey, [candidate({ name: "Prey", released: "2006-07-11" })])).toBeNull();
  });

  it("allows a year either way for regional releases", () => {
    expect(
      pickRawgMatch(ocarina, [candidate({ name: ocarina.name, released: "1999-01-01" })]),
    ).not.toBeNull();
  });

  it("prefers the candidate sharing IGDB's slug", () => {
    const match = pickRawgMatch(ocarina, [
      candidate({ id: 4, name: ocarina.name, slug: "ocarina-2" }),
      candidate({ id: 5, name: ocarina.name, slug: ocarina.slug }),
    ]);
    expect(match?.id).toBe(5);
  });

  it("returns nothing when no title matches", () => {
    expect(pickRawgMatch(ocarina, [candidate({ name: "Zelda Classic" })])).toBeNull();
  });
});
