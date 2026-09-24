/*
 * Finding the same game on RAWG. RAWG is searched by name, and search
 * results include remasters, fan games and namesakes, so a candidate is
 * accepted only when its title is the same once punctuation is set aside
 * and its release year is within one of IGDB's. Better no score than the
 * wrong game's.
 */

export type RawgCandidate = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  metacritic: number | null;
  rating: number;
  ratings_count: number;
};

/**
 * "Pokémon: Let's Go, Pikachu!" and "Pokemon Lets Go Pikachu" compare equal.
 * A trailing year in brackets is dropped: RAWG names a game "Ocarina of Time
 * (1998)" to tell it from a later namesake, and the year is checked separately.
 */
export function normaliseTitle(name: string): string {
  return name
    .replace(/\s*\((?:19|20)\d{2}\)\s*$/, "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function year(date: string | null): number | null {
  const value = date ? Number(date.slice(0, 4)) : Number.NaN;
  return Number.isFinite(value) ? value : null;
}

export function pickRawgMatch(
  game: { name: string; slug: string; firstReleaseDate: string | null },
  candidates: readonly RawgCandidate[],
): RawgCandidate | null {
  const title = normaliseTitle(game.name);
  const released = year(game.firstReleaseDate);

  const matches = candidates.filter((candidate) => {
    // The same slug in both databases counts as the same title, however it is styled.
    const sameTitle = normaliseTitle(candidate.name) === title || candidate.slug === game.slug;
    if (!sameTitle) return false;
    const candidateYear = year(candidate.released);
    // Either side may not know the year yet; then the title has to carry it.
    return released === null || candidateYear === null || Math.abs(candidateYear - released) <= 1;
  });

  // The two databases often share slugs; when one does, it settles a tie.
  return matches.find((candidate) => candidate.slug === game.slug) ?? matches[0] ?? null;
}
