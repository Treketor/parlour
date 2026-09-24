/*
 * IGDB orders search results by name similarity alone. For a franchise like
 * "pokemon" that surfaces dozens of fan games and ROM hacks with no ratings
 * before any official release (Pokémon Red sat at position 30). So search
 * asks IGDB for a wide set of candidates and ranks them here: mostly by how
 * widely a game is rated, with a smaller boost for how well the title matches.
 * DECISIONS.md 031.
 */

export type Candidate = {
  id: number;
  name: string;
  /** IGDB users plus critics. */
  ratingCount: number;
  /** Follows before release: the only popularity signal an unreleased game has. */
  hypes: number;
};

/** How many ranked results a search returns. */
export const RESULT_LIMIT = 40;

// Title match is worth this much, in powers of ten of ratings: an exact title
// counts like having 10x the ratings, a prefix match like 3x.
const EXACT_BOOST = 1;
const PREFIX_BOOST = 0.5;

export function comparable(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function score(candidate: Candidate, query: string): number {
  const title = comparable(candidate.name);
  const boost = title === query ? EXACT_BOOST : title.startsWith(query) ? PREFIX_BOOST : 0;
  return Math.log10(1 + candidate.ratingCount + candidate.hypes) + boost;
}

/** Candidate ids, best first; IGDB's own order breaks ties. */
export function rankCandidates(
  query: string,
  candidates: readonly Candidate[],
  limit = RESULT_LIMIT,
): number[] {
  const wanted = comparable(query);
  return candidates
    .map((candidate, index) => ({ id: candidate.id, index, score: score(candidate, wanted) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ id }) => id);
}
