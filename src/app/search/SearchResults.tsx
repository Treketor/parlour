import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CatalogueGame } from "@/lib/catalogue";
import { libraryStatusFor, type EntryStatus } from "@/lib/data/library";
import type { SearchSort } from "@/lib/search-sort";
import { createClient } from "@/lib/supabase/server";
import { getCatalogue } from "@/server/catalogue";
import { MIN_QUERY_LENGTH } from "@/server/catalogue/service";
import { IgdbError } from "@/server/igdb/errors";
import { ResultsGrid } from "./ResultsGrid";
import styles from "./search.module.css";

export async function SearchResults({ query, sort }: { query: string; sort: SearchSort }) {
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

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const signedIn = Boolean(auth?.claims);
  const statuses: Map<string, EntryStatus> = signedIn
    ? await libraryStatusFor(
        supabase,
        games.map((game) => game.id),
      )
    : new Map();

  return (
    <ResultsGrid
      query={query}
      games={games}
      statuses={Object.fromEntries(statuses)}
      signedIn={signedIn}
      initialSort={sort}
    />
  );
}

/** The shape of the results grid, so nothing moves when the real results arrive. */
export function SearchResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Searching">
      <div className={styles.resultsBar}>
        <p className={styles.resultsHeading}>
          <Skeleton variant="text" width="9rem" />
        </p>
      </div>
      <ul className={styles.grid}>
        {Array.from({ length: 10 }, (_, index) => (
          <li key={index}>
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
          </li>
        ))}
      </ul>
    </div>
  );
}
