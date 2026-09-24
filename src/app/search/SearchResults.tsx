import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CatalogueGame } from "@/lib/catalogue";
import { libraryStatusFor, platformHabits, type EntryStatus } from "@/lib/data/library";
import type { SearchLayout, SearchSort } from "@/lib/search-sort";
import { createClient } from "@/lib/supabase/server";
import { getCatalogue } from "@/server/catalogue";
import { MIN_QUERY_LENGTH } from "@/server/catalogue/service";
import { IgdbError } from "@/server/igdb/errors";
import { after } from "next/server";
import { metascoresFor } from "@/server/scores";
import { ResultsGrid } from "./ResultsGrid";
import styles from "./search.module.css";

type SearchResultsProps = { query: string; sort: SearchSort; layout: SearchLayout };

export async function SearchResults({ query, sort, layout }: SearchResultsProps) {
  if (query.length < MIN_QUERY_LENGTH) {
    return <p className={styles.hint}>Type at least {MIN_QUERY_LENGTH} characters to search.</p>;
  }

  let games: CatalogueGame[];
  try {
    games = await getCatalogue().search(query);
  } catch (error) {
    if (!(error instanceof IgdbError)) throw error;
    return (
      <Notice
        tone="error"
        title={error.kind === "rate-limit" ? "Too many searches at once" : "IGDB did not respond"}
        action={<ButtonLink href={`/search?q=${encodeURIComponent(query)}`}>Try again</ButtonLink>}
      >
        {error.kind === "rate-limit"
          ? "IGDB asked Parlour to slow down. Wait a few seconds, then try again."
          : "Game data comes from IGDB, and it did not answer. Your library is not affected."}
      </Notice>
    );
  }

  if (games.length === 0) {
    return (
      <Notice title={`No games match “${query}”`}>
        Check the spelling, or try fewer words: the main title usually finds it. DLC and bundles are
        not listed separately.
      </Notice>
    );
  }

  // Known metascores lead each card's score; the rest are looked up once the page has gone.
  const { metascores, fill } = await metascoresFor(games.map((game) => game.id)).catch(
    (error: unknown) => {
      console.error("Search scores could not be read", error);
      return { metascores: {}, fill: async () => {} };
    },
  );
  after(fill);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const signedIn = Boolean(auth?.claims);
  const [statuses, habits]: [Map<string, EntryStatus>, Record<number, number>] = signedIn
    ? await Promise.all([
        libraryStatusFor(
          supabase,
          games.map((game) => game.id),
        ),
        platformHabits(supabase),
      ])
    : [new Map(), {}];

  return (
    <ResultsGrid
      query={query}
      games={games}
      statuses={Object.fromEntries(statuses)}
      habits={habits}
      signedIn={signedIn}
      initialSort={sort}
      initialLayout={layout}
      metascores={metascores}
    />
  );
}

/** The shape of the results, so nothing moves when the real ones arrive. */
export function SearchResultsSkeleton({ layout }: { layout: SearchLayout }) {
  return (
    <div aria-busy="true" aria-label="Searching">
      <div className={styles.resultsBar}>
        <p className={styles.resultsHeading}>
          <Skeleton variant="text" width="9rem" />
        </p>
      </div>
      <ul className={layout === "grid" ? styles.grid : styles.rows}>
        {Array.from({ length: 10 }, (_, index) => (
          <li key={index}>
            {layout === "grid" ? (
              <div className={styles.card}>
                <span className={styles.cardCover}>
                  <Skeleton />
                </span>
                <div className={styles.cardText}>
                  <span className={styles.cardTitle}>
                    <Skeleton variant="text" width="80%" />
                  </span>
                  <span className={styles.cardMeta}>
                    <Skeleton variant="text" width="55%" />
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.row}>
                <span className={styles.rowCover}>
                  <Skeleton />
                </span>
                <div className={styles.rowText}>
                  <span className={styles.rowTitle}>
                    <Skeleton variant="text" width="40%" />
                  </span>
                  <span className={styles.cardMeta}>
                    <Skeleton variant="text" width="25%" />
                  </span>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
