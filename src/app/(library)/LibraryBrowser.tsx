"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useLayoutTransition, useShouldReduceMotion } from "@/components/Providers";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { CatalogueList, ListHeader, ListRow } from "@/components/ui/ListRow";
import { Notice } from "@/components/ui/Notice";
import { ProgressGlyph } from "@/components/ui/ProgressGlyph";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Tag } from "@/components/ui/Tag";
import { TextField } from "@/components/ui/TextField";
import { SearchIcon } from "@/components/ui/icons";
import type { LibraryItem } from "@/lib/data/library";
import { formatCount } from "@/lib/format";
import {
  LIBRARY_SORTS,
  NO_FILTERS,
  filterEntries,
  hasFilters,
  libraryViewParams,
  parseLibrarySort,
  progressCounts,
  type LibraryFilters,
  type LibraryLayout,
  type LibraryViewState,
} from "@/lib/library-view";
import { LAYOUT_ANIMATION_ITEM_LIMIT, transition } from "@/lib/motion";
import { OWNERSHIP_STATES, ownershipLabel } from "@/lib/ownership";
import { progressLabel, type Progress } from "@/lib/progress";
import { naturalDirection, nextSort, sortEntries } from "@/lib/sort";
import styles from "./library.module.css";

const LAYOUTS = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
] as const satisfies ReadonlyArray<{ value: LibraryLayout; label: string }>;

const TEXT_FILTER_ID = "library-filter";

type LibraryBrowserProps = {
  items: LibraryItem[];
  initialView: LibraryViewState;
};

export function LibraryBrowser({ items, initialView }: LibraryBrowserProps) {
  const [view, setView] = useState(initialView);
  const { layout, sort, filters } = view;
  const reduceMotion = useShouldReduceMotion();
  const move = useLayoutTransition("move");

  const visible = useMemo(
    () => sortEntries(filterEntries(items, filters), sort.key, sort.direction),
    [items, filters, sort],
  );
  const progress = useMemo(() => progressCounts(items), [items]);
  const platforms = useMemo(() => platformOptions(items), [items]);
  const tags = useMemo(() => [...new Set(items.flatMap((item) => item.tags))].sort(), [items]);
  const filtered = hasFilters(filters);

  function update(next: LibraryViewState) {
    setView(next);
    // Kept in the address so a reload or the back button shows the same view,
    // without a server round trip: the whole library is already here.
    const url = new URL(window.location.href);
    url.search = libraryViewParams(next).toString();
    window.history.replaceState(null, "", url);
  }

  function filter(patch: Partial<LibraryFilters>) {
    update({ ...view, filters: { ...filters, ...patch } });
  }

  function toggleProgress(state: Progress) {
    filter({
      progress: filters.progress.includes(state)
        ? filters.progress.filter((current) => current !== state)
        : [...filters.progress, state],
    });
  }

  function clearFilters() {
    update({ ...view, filters: NO_FILTERS });
    // The button that was just pressed disappears; the title filter is the
    // natural place to carry on from.
    document.getElementById(TEXT_FILTER_ID)?.focus();
  }

  /*
   * Rows travel to their new places when they fit the frame budget. With
   * reduced motion, or a library too big to measure every frame, the results
   * are keyed by the whole view instead, so each change fades in fresh.
   */
  const animateLayout = !reduceMotion && visible.length <= LAYOUT_ANIMATION_ITEM_LIMIT;
  const viewKey = libraryViewParams({ ...view, layout: "list" }).toString();
  const orderKey = `${sort.key}-${sort.direction}`;
  const status = filtered
    ? `Showing ${visible.length} of ${formatCount(items.length, "game")}`
    : "";

  return (
    <div className={styles.browser}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <TextField
            id={TEXT_FILTER_ID}
            label="Filter by title"
            hideLabel
            placeholder="Filter by title"
            type="search"
            autoComplete="off"
            leading={<SearchIcon width={16} height={16} />}
            value={filters.text}
            onChange={(event) => filter({ text: event.target.value })}
            onClear={() => filter({ text: "" })}
            className={styles.textFilter}
          />
          <Select
            label="Ownership"
            hideLabel
            value={filters.ownership ?? ""}
            onChange={(event) =>
              filter({
                ownership: OWNERSHIP_STATES.find((state) => state === event.target.value) ?? null,
              })
            }
          >
            <option value="">Any ownership</option>
            {OWNERSHIP_STATES.map((state) => (
              <option key={state} value={state}>
                {ownershipLabel[state]}
              </option>
            ))}
          </Select>
          <Select
            label="Platform"
            hideLabel
            value={filters.platformId ?? ""}
            onChange={(event) => filter({ platformId: Number(event.target.value) || null })}
          >
            <option value="">All platforms</option>
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </Select>
          {tags.length > 0 && (
            <Select
              label="Tag"
              hideLabel
              value={filters.tag ?? ""}
              onChange={(event) => filter({ tag: event.target.value || null })}
            >
              <option value="">Any tag</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Select>
          )}
        </div>

        <div className={styles.arrange}>
          <Select
            label="Sort by"
            hideLabel
            value={sort.key}
            onChange={(event) => {
              const key = parseLibrarySort(event.target.value);
              update({ ...view, sort: { key, direction: naturalDirection(key) } });
            }}
            className={styles.sort}
          >
            {LIBRARY_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <SegmentedControl
            label="Layout"
            options={LAYOUTS}
            value={layout}
            onChange={(next) => update({ ...view, layout: next })}
          />
        </div>
      </div>

      {/* Always in the page, so screen readers hear the count change as filters apply. */}
      <p className="visually-hidden" role="status">
        {status}
      </p>

      {(progress.length > 1 || (filtered && visible.length > 0)) && (
        <div className={styles.refine}>
          {progress.length > 1 && (
            <div className={styles.progressFilters} role="group" aria-label="Filter by progress">
              {progress.map(({ progress: state, count }) => (
                <Tag
                  key={state}
                  selected={filters.progress.includes(state)}
                  onToggle={() => toggleProgress(state)}
                >
                  <ProgressGlyph progress={state} />
                  {progressLabel[state]}
                  <span className={styles.chipCount}>{count}</span>
                </Tag>
              ))}
            </div>
          )}
          {/* With nothing left, the notice below says so and offers the same way out. */}
          {filtered && visible.length > 0 && (
            <div className={styles.result}>
              {/* The hidden status above already reads this out. */}
              <span aria-hidden="true">{status}</span>
              <Button size="sm" variant="quiet" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <Notice
          title="Nothing matches these filters"
          action={
            <Button size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        >
          {`None of your ${formatCount(items.length, "game")} match. Clear the filters to see them all again.`}
        </Notice>
      ) : (
        // Switching layout crossfades: a row and a card share nothing to morph between.
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={layout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: transition.enter }}
            exit={{ opacity: 0, transition: transition.exit }}
          >
            {layout === "list" ? (
              <CatalogueList>
                <ListHeader
                  sort={sort}
                  onSort={(key) => update({ ...view, sort: nextSort(sort, key) })}
                />
                <motion.ul
                  key={animateLayout ? "rows" : viewKey}
                  className={styles.rows}
                  initial={animateLayout ? false : { opacity: 0 }}
                  animate={{ opacity: 1, transition: transition.enter }}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {visible.map((item) => (
                      <motion.li
                        key={item.id}
                        layout={animateLayout ? "position" : false}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: transition.enter }}
                        exit={{ opacity: 0, transition: transition.exit }}
                        transition={{ layout: move }}
                      >
                        <ListRow game={{ ...item, coverUrl: item.thumbUrl }} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              </CatalogueList>
            ) : (
              /*
               * A new order crossfades the grid: cards crossing a wide grid
               * read as a blur, not a move (DECISIONS.md 033). Filtering only
               * closes gaps, short moves that stay legible, so those travel.
               */
              <AnimatePresence mode="wait" initial={false}>
                <motion.ul
                  key={animateLayout ? orderKey : viewKey}
                  className={styles.grid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: transition.enter }}
                  exit={{ opacity: 0, transition: transition.exit }}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {visible.map((item) => (
                      <motion.li
                        key={item.id}
                        layout={animateLayout ? "position" : false}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: transition.enter }}
                        exit={{ opacity: 0, transition: transition.exit }}
                        transition={{ layout: move }}
                      >
                        <GameCard game={item} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              </AnimatePresence>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

/** The platforms this library actually has, A to Z, for the platform filter. */
function platformOptions(items: readonly LibraryItem[]): Array<{ id: number; name: string }> {
  const byId = new Map(items.map((item) => [item.platformId, item.platform]));
  return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}
