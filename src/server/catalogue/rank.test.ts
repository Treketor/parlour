// @vitest-environment node
import { describe, expect, it } from "vitest";
import pokemon from "../igdb/fixtures/candidates-pokemon.json";
import { igdbCandidates } from "../igdb/schema";
import { toCandidate } from "../igdb/map";
import { comparable, rankCandidates, type Candidate } from "./rank";

function candidate(id: number, name: string, ratingCount = 0, hypes = 0): Candidate {
  return { id, name, ratingCount, hypes };
}

describe("rankCandidates", () => {
  it("puts official Pokémon games above unrated fan games (real IGDB response)", () => {
    const candidates = igdbCandidates.parse(pokemon).map(toCandidate);
    const byId = new Map(candidates.map((item) => [item.id, item]));

    const top = rankCandidates("pokemon", candidates, 10).map((id) => byId.get(id));

    for (const game of top) expect(game?.ratingCount).toBeGreaterThanOrEqual(100);
    const mostRated = Math.max(...candidates.map((item) => item.ratingCount));
    expect(top[0]?.ratingCount).toBe(mostRated);
  });

  it("puts the widely rated game first among exact title matches", () => {
    expect(
      rankCandidates("hades", [candidate(1, "Hades", 0), candidate(2, "Hades", 1757)]),
    ).toEqual([2, 1]);
  });

  it("does not let an unrated exact title beat a well-rated prefix match", () => {
    const ids = rankCandidates("hades", [candidate(1, "Hades", 0), candidate(2, "Hades II", 172)]);
    expect(ids).toEqual([2, 1]);
  });

  it("lets title match decide between games with similar ratings", () => {
    const ids = rankCandidates("tunic", [
      candidate(1, "Tunic Trails", 120),
      candidate(2, "Tunic", 100),
    ]);
    expect(ids).toEqual([2, 1]);
  });

  it("counts follows for unreleased games", () => {
    const ids = rankCandidates("elder scrolls", [
      candidate(1, "The Elder Scrolls Fan Remake", 2),
      candidate(2, "The Elder Scrolls VI", 0, 900),
    ]);
    expect(ids).toEqual([2, 1]);
  });

  it("keeps IGDB's order when nothing else separates two games", () => {
    expect(
      rankCandidates("outer", [candidate(5, "Outer Wilds"), candidate(6, "Outer Worlds")]),
    ).toEqual([5, 6]);
  });

  it("returns at most the limit", () => {
    const many = Array.from({ length: 60 }, (_, index) => candidate(index + 1, `Game ${index}`));
    expect(rankCandidates("game", many)).toHaveLength(40);
  });
});

describe("comparable", () => {
  it("ignores case, accents and punctuation", () => {
    expect(comparable("Pokémon: Let's Go, Eevee!")).toBe("pokemon let s go eevee");
  });
});
