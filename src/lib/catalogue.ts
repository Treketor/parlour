/** A game as the app shows it in lists and search results. Safe to send to the browser. */
export type CatalogueGame = {
  id: number;
  slug: string;
  name: string;
  summary: string | null;
  /** ISO date, or null when unreleased or unknown. */
  firstReleaseDate: string | null;
  coverImageId: string | null;
  gameType: string | null;
  platforms: Array<{ id: number; name: string; abbreviation: string | null }>;
  /** IGDB user score, 0 to 100; always shown with its count. */
  igdbRating: number | null;
  igdbRatingCount: number;
  /** Critic aggregate, 0 to 100; always shown with its count. */
  criticRating: number | null;
  criticRatingCount: number;
};
