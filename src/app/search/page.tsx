import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { firstParam } from "@/lib/search-params";
import { decodePreference } from "@/lib/preference-cookie";
import {
  LAST_SEARCH_COOKIE,
  parseSearchLayout,
  parseSearchSort,
  rememberedSearch,
} from "@/lib/search-sort";
import { SearchForm } from "./SearchForm";
import { SearchResults, SearchResultsSkeleton } from "./SearchResults";
import styles from "./search.module.css";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  // A bare visit (the menu, "Add a game") returns to the last search. Searching
  // for nothing sends q="" and lands on the empty page on purpose.
  if (params.q === undefined) {
    const last = rememberedSearch(
      decodePreference((await cookies()).get(LAST_SEARCH_COOKIE)?.value),
    );
    if (last) redirect(`/search?${last}`);
  }
  const query = firstParam(params.q);
  const sort = parseSearchSort(firstParam(params.sort));
  const layout = parseSearchLayout(firstParam(params.view));

  return (
    <>
      <PageHeader title="Search" meta="Every game on IGDB, best matches first" />
      <SearchForm initialQuery={query} />

      <div className={styles.resultsArea}>
        {query ? (
          // Keyed by the query, so a new search shows the skeleton instead of stale results.
          <Suspense key={query} fallback={<SearchResultsSkeleton layout={layout} />}>
            <SearchResults query={query} sort={sort} layout={layout} />
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
