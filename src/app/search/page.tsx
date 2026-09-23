import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { firstParam } from "@/lib/search-params";
import { SearchForm } from "./SearchForm";
import { SearchResults, SearchResultsSkeleton } from "./SearchResults";
import styles from "./search.module.css";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const query = firstParam((await searchParams).q);

  return (
    <>
      <PageHeader title="Search" meta="Every game on IGDB, listed once per platform" />
      <SearchForm initialQuery={query} />

      <div className={styles.resultsArea}>
        {query ? (
          // Keyed by the query, so a new search shows the skeleton instead of stale results.
          <Suspense key={query} fallback={<SearchResultsSkeleton />}>
            <SearchResults query={query} />
          </Suspense>
        ) : (
          <div className={styles.idle}>
            <p>Search by title. Results list each platform separately, because versions differ.</p>
            <p>
              Pick the platform you play on, and the game joins your library with its own progress,
              rating and notes.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
