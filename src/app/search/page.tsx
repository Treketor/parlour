import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { Notice } from "@/components/ui/Notice";
import { SearchForm } from "./SearchForm";
import styles from "./search.module.css";

export const metadata: Metadata = {
  title: "Search",
};

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const query = firstValue((await searchParams).q);

  return (
    <>
      <PageHeader title="Search" meta="Every game on IGDB, listed once per platform" />
      <SearchForm initialQuery={query} />

      <div className={styles.results}>
        {query ? (
          // Replaced by real results when IGDB is connected (stage 5).
          <Notice title="Search is not connected yet">
            Parlour cannot look up &ldquo;{query}&rdquo; until game data from IGDB is connected.
            Nothing has been searched and nothing was saved.
          </Notice>
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
