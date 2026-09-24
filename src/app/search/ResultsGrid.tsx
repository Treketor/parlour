"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import type { CatalogueGame } from "@/lib/catalogue";
import type { EntryStatus } from "@/lib/data/library";
import { formatCount } from "@/lib/format";
import { transition } from "@/lib/motion";
import { setPreferenceCookie } from "@/lib/preference-cookie";
import {
  LAST_SEARCH_COOKIE,
  SEARCH_LAYOUTS,
  SEARCH_SORTS,
  parseSearchSort,
  searchParamsFor,
  sortResults,
  type SearchLayout,
  type SearchSort,
} from "@/lib/search-sort";
import { SearchCard, SearchRow } from "./SearchCard";
import { useSearchSession } from "./useSearchEntry";
import styles from "./search.module.css";

type ResultsGridProps = {
  query: string;
  games: CatalogueGame[];
  statuses: Record<string, EntryStatus>;
  habits: Record<number, number>;
  signedIn: boolean;
  initialSort: SearchSort;
  initialLayout: SearchLayout;
  /** Metacritic scores already known, by game id. */
  metascores: Record<number, number>;
};

export function ResultsGrid({
  query,
  games,
  statuses,
  habits,
  signedIn,
  initialSort,
  initialLayout,
  metascores,
}: ResultsGridProps) {
  const [sort, setSort] = useState<SearchSort>(initialSort);
  const [layout, setLayout] = useState<SearchLayout>(initialLayout);
  const session = useSearchSession(statuses);
  const sorted = useMemo(() => sortResults(games, sort), [games, sort]);
  const returnTo = `/search?${searchParamsFor({ query, sort, layout })}`;

  useEffect(() => {
    setPreferenceCookie(LAST_SEARCH_COOKIE, searchParamsFor({ query, sort, layout }).toString());
  }, [query, sort, layout]);

  function show(next: { sort: SearchSort; layout: SearchLayout }) {
    setSort(next.sort);
    setLayout(next.layout);
    // Kept in the address so a reload or a shared link shows the same thing,
    // without a server round trip: the results are already here.
    const url = new URL(window.location.href);
    url.search = searchParamsFor({ query, ...next }).toString();
    window.history.replaceState(null, "", url);
  }

  return (
    <section aria-labelledby="results-heading">
      <div className={styles.resultsBar}>
        <h2 id="results-heading" className={styles.resultsHeading}>
          {formatCount(games.length, "game")} for &ldquo;{query}&rdquo;
        </h2>
        <div className={styles.arrange}>
          <Select
            size="sm"
            label="Sort by"
            hideLabel
            options={SEARCH_SORTS}
            value={sort}
            onChange={(next) => show({ sort: parseSearchSort(next), layout })}
            className={styles.sort}
          />
          <SegmentedControl
            label="Layout"
            size="sm"
            options={SEARCH_LAYOUTS}
            value={layout}
            onChange={(next) => show({ sort, layout: next })}
          />
        </div>
      </div>

      {/*
        A new sort or layout fades the results out and back in. Cards
        travelling across a 40-card grid read as a blur rather than a move
        (DECISIONS.md 033), and a card and a row share no shape to morph.
      */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={`${layout}-${sort}`}
          className={layout === "grid" ? styles.grid : styles.rows}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: transition.enter }}
          exit={{ opacity: 0, transition: transition.exit }}
        >
          {sorted.map((game) => {
            const props = {
              game,
              session,
              habits,
              signedIn,
              returnTo,
              metascore: metascores[game.id] ?? null,
            };
            return (
              <li key={game.id}>
                {layout === "grid" ? <SearchCard {...props} /> : <SearchRow {...props} />}
              </li>
            );
          })}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
}
