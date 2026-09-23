import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CatalogueGame } from "@/lib/catalogue";
import { libraryStatusFor, type EntryStatus } from "@/lib/data/library";
import { formatCount } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getCatalogue } from "@/server/catalogue";
import { MIN_QUERY_LENGTH } from "@/server/catalogue/service";
import { IgdbError } from "@/server/igdb/errors";
import { GameResult } from "./GameResult";
import styles from "./search.module.css";

export async function SearchResults({ query }: { query: string }) {
  if (query.length < MIN_QUERY_LENGTH) {
    return <p className={styles.hint}>Type at least {MIN_QUERY_LENGTH} characters to search.</p>;
  }

  const returnTo = `/search?q=${encodeURIComponent(query)}`;

  let games: CatalogueGame[];
  try {
    games = await getCatalogue().search(query);
  } catch (error) {
    if (!(error instanceof IgdbError)) throw error;
    return (
      <Notice
        tone="error"
        title={error.kind === "rate-limit" ? "Too many searches at once" : "IGDB did not respond"}
        action={<ButtonLink href={returnTo}>Try again</ButtonLink>}
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
    <section aria-labelledby="results-heading">
      <h2 id="results-heading" className={styles.resultsHeading}>
        {formatCount(games.length, "game")} for &ldquo;{query}&rdquo;
      </h2>
      <ol className={styles.results}>
        {games.map((game) => (
          <GameResult
            key={game.id}
            game={game}
            statuses={statuses}
            signedIn={signedIn}
            returnTo={returnTo}
          />
        ))}
      </ol>
    </section>
  );
}

/** The shape of a results list, so nothing moves when the real results arrive. */
export function SearchResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Searching">
      <p className={styles.resultsHeading}>
        <Skeleton variant="text" width="9rem" />
      </p>
      <ol className={styles.results}>
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className={styles.result}>
            <span className={styles.resultCover}>
              <Skeleton />
            </span>
            <div className={styles.resultBody}>
              <div className={styles.resultHead}>
                <span className={styles.resultTitle}>
                  <Skeleton variant="text" width="45%" />
                </span>
                <span className={styles.resultMeta}>
                  <Skeleton variant="text" width="30%" />
                </span>
              </div>
              <ul className={styles.platforms}>
                {Array.from({ length: 2 }, (_, row) => (
                  <li key={row} className={styles.platformRow}>
                    <span className={styles.platformName}>
                      <Skeleton variant="text" width="7rem" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
