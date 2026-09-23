"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameCard, GameCardSkeleton } from "@/components/ui/GameCard";
import {
  CatalogueList,
  ListHeader,
  ListRow,
  ListRowSkeleton,
  type SortState,
} from "@/components/ui/ListRow";
import { Notice } from "@/components/ui/Notice";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Tag } from "@/components/ui/Tag";
import { useShouldReduceMotion } from "@/components/Providers";
import { transition } from "@/lib/motion";
import type { Progress } from "@/lib/progress";
import { nextSort, sortEntries } from "@/lib/sort";
import styles from "../system.module.css";
import { sampleGames } from "./sample-data";
import { Section } from "./Section";

type LoadState = "loaded" | "loading" | "empty" | "error";

const loadOptions = [
  { value: "loaded", label: "Loaded" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
] as const;

const filterOptions: Array<{ label: string; states: Progress[] }> = [
  { label: "In progress", states: ["playing", "paused"] },
  { label: "Done", states: ["finished", "completed"] },
  { label: "Not started", states: ["want_to_play"] },
];

export function CatalogueSection() {
  const [sort, setSort] = useState<SortState>({ key: "added", direction: "desc" });
  const [filter, setFilter] = useState<string | null>(null);
  const [listState, setListState] = useState<LoadState>("loaded");
  const [gridState, setGridState] = useState<LoadState>("loaded");
  const reduceMotion = useShouldReduceMotion();

  const visible = useMemo(() => {
    const states = filterOptions.find((option) => option.label === filter)?.states;
    const filtered = states
      ? sampleGames.filter((game) => game.progress && states.includes(game.progress))
      : sampleGames;
    return sortEntries(filtered, sort.key, sort.direction);
  }, [sort, filter]);

  return (
    <Section
      id="catalogue"
      title="Catalogue"
      intro="Rows and cards are the two ways the library is browsed. Sorting and filtering move rows to their new places instead of redrawing the list. Loading placeholders use the same frames as the real thing, so nothing shifts when data lands."
    >
      <div className={styles.group}>
        <div className={styles.demoBar}>
          <h3 className={styles.subhead}>List</h3>
          <SegmentedControl
            label="List state"
            size="sm"
            value={listState}
            onChange={setListState}
            options={loadOptions}
          />
        </div>

        <div className={styles.inlineRow}>
          {filterOptions.map((option) => (
            <Tag
              key={option.label}
              selected={filter === option.label}
              onToggle={() =>
                setFilter((current) => (current === option.label ? null : option.label))
              }
            >
              {option.label}
            </Tag>
          ))}
        </div>

        <CatalogueList className={styles.catalogue}>
          <ListHeader sort={sort} onSort={(key) => setSort((current) => nextSort(current, key))} />
          {listState === "loading" &&
            sampleGames.slice(0, 5).map((game) => <ListRowSkeleton key={game.id} />)}
          {listState === "loaded" && (
            <motion.ul
              className={styles.rows}
              // Reduced motion: rows do not travel. The list remounts per order and
              // fades in, so a re-sort is still visible without anything moving.
              key={reduceMotion ? `${sort.key}-${sort.direction}-${filter}` : "list"}
              initial={reduceMotion ? { opacity: 0 } : false}
              animate={{ opacity: 1, transition: transition.enter }}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map((game) => (
                  <motion.li
                    key={game.id}
                    layout={reduceMotion ? false : "position"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: transition.enter }}
                    exit={{ opacity: 0, transition: transition.exit }}
                    transition={{ layout: transition.move }}
                  >
                    <ListRow game={game} href={`#${game.id}`} selected={game.id === "tunic"} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
          {listState === "empty" && (
            <Notice
              className={styles.inlineNotice}
              title="Nothing matches these filters"
              action={
                <Button size="sm" onClick={() => setListState("loaded")}>
                  Clear filters
                </Button>
              }
            >
              Your library has 8 games, but none are both in progress and on Xbox.
            </Notice>
          )}
          {listState === "error" && (
            <Notice
              tone="error"
              className={styles.inlineNotice}
              title="Your library did not load"
              action={
                <Button size="sm" onClick={() => setListState("loaded")}>
                  Try again
                </Button>
              }
            >
              The server did not respond. Your games are safe; this only affects loading them.
            </Notice>
          )}
        </CatalogueList>
      </div>

      <div className={styles.group}>
        <div className={styles.demoBar}>
          <h3 className={styles.subhead}>Grid</h3>
          <SegmentedControl
            label="Grid state"
            size="sm"
            value={gridState}
            onChange={setGridState}
            options={loadOptions}
          />
        </div>

        {gridState === "loaded" || gridState === "loading" ? (
          <div className={styles.cardGrid}>
            {sampleGames.map((game) =>
              gridState === "loading" ? (
                <GameCardSkeleton key={game.id} />
              ) : (
                <GameCard key={game.id} game={game} href={`#${game.id}`} />
              ),
            )}
          </div>
        ) : gridState === "empty" ? (
          <Notice
            title="Your library is empty"
            action={
              <Button variant="primary" size="sm" onClick={() => setGridState("loaded")}>
                Search for a game
              </Button>
            }
          >
            Search for a game you own or want to play, then add it for the platform you play it on.
          </Notice>
        ) : (
          <Notice
            tone="error"
            title="Covers could not be loaded"
            action={
              <Button size="sm" onClick={() => setGridState("loaded")}>
                Try again
              </Button>
            }
          >
            IGDB did not respond in time. Your library is unaffected.
          </Notice>
        )}
      </div>
    </Section>
  );
}
