import type { CatalogueGame } from "@/lib/catalogue";

/*
 * IGDB orders search results by how closely the name matches, and nothing
 * else, so two games both called "Hades" come back in no useful order. This
 * keeps IGDB's order as the last word but puts exact title matches first,
 * then titles starting with the search, and within each of those puts games
 * more people have rated first.
 */

function comparable(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchTier(name: string, query: string): number {
  const title = comparable(name);
  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  return 2;
}

function popularity(game: CatalogueGame): number {
  return game.igdbRatingCount + game.criticRatingCount;
}

export function rankResults(query: string, games: readonly CatalogueGame[]): CatalogueGame[] {
  const wanted = comparable(query);
  return games
    .map((game, index) => ({ game, index, tier: matchTier(game.name, wanted) }))
    .sort((a, b) => a.tier - b.tier || popularity(b.game) - popularity(a.game) || a.index - b.index)
    .map(({ game }) => game);
}
