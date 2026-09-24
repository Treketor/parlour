import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { firstParam } from "@/lib/search-params";
import { parseSearchSort } from "@/lib/search-sort";
import { SearchForm } from "./SearchForm";
import { SearchResults, SearchResultsSkeleton } from "./SearchResults";
import styles from "./search.module.css";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const query = firstParam(params.q);
  const sort = parseSearchSort(firstParam(params.sort));

  return (
    <>
      <PageHeader title="Search" meta="Every game on IGDB, best matches first" />
      <SearchForm initialQuery={query} />

      <div className={styles.resultsArea}>
        {query ? (
          // Keyed by the query, so a new search shows the skeleton instead of stale results.
          <Suspense key={query} fallback={<SearchResultsSkeleton />}>
            <SearchResults query={query} sort={sort} />
          </Suspense>
        ) : (
          <div className={styles.idle}>
            <p>Search by title. Well-known games come first; fan projects sink below them.</p>
            <p>
              On each game, pick the platform you play it on before adding it. Each platform is its
              own entry, with its own progress, rating and notes.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
