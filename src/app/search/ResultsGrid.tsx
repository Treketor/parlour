"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Select } from "@/components/ui/Select";
import type { CatalogueGame } from "@/lib/catalogue";
import type { EntryStatus } from "@/lib/data/library";
import { formatCount } from "@/lib/format";
import { transition } from "@/lib/motion";
import { SEARCH_SORTS, parseSearchSort, sortResults, type SearchSort } from "@/lib/search-sort";
import { SearchCard } from "./SearchCard";
import styles from "./search.module.css";

type ResultsGridProps = {
  query: string;
  games: CatalogueGame[];
  statuses: Record<string, EntryStatus>;
  habits: Record<number, number>;
  signedIn: boolean;
  initialSort: SearchSort;
};

export function ResultsGrid({
  query,
  games,
  statuses,
  habits,
  signedIn,
  initialSort,
}: ResultsGridProps) {
  const [sort, setSort] = useState<SearchSort>(initialSort);
  const sorted = useMemo(() => sortResults(games, sort), [games, sort]);
  const returnTo = `/search?q=${encodeURIComponent(query)}${sort === "best" ? "" : `&sort=${sort}`}`;

  function changeSort(next: SearchSort) {
    setSort(next);
    // Kept in the address so a reload or a shared link sorts the same, without
    // a server round trip: the results are already here.
    const url = new URL(window.location.href);
    if (next === "best") url.searchParams.delete("sort");
    else url.searchParams.set("sort", next);
    window.history.replaceState(null, "", url);
  }

  return (
    <section aria-labelledby="results-heading">
      <div className={styles.resultsBar}>
        <h2 id="results-heading" className={styles.resultsHeading}>
          {formatCount(games.length, "game")} for &ldquo;{query}&rdquo;
        </h2>
        <Select
          size="sm"
          label="Sort by"
          hideLabel
          value={sort}
          onChange={(event) => changeSort(parseSearchSort(event.target.value))}
          className={styles.sort}
        >
          {SEARCH_SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {/*
        A new sort fades the grid out and back in, in its new order. Cards
        travelling across a 40-card grid read as a blur rather than a move
        (DECISIONS.md 033).
      */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={sort}
          className={styles.grid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: transition.enter }}
          exit={{ opacity: 0, transition: transition.exit }}
        >
          {sorted.map((game) => (
            <li key={game.id}>
              <SearchCard
                game={game}
                statuses={statuses}
                habits={habits}
                signedIn={signedIn}
                returnTo={returnTo}
              />
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
}
