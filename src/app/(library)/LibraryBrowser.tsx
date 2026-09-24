"use client";

import { AnimatePresence, motion, type MotionStyle } from "motion/react";
import { useEffect, useId, useMemo, useState, useTransition, type MouseEvent } from "react";
import { useLayoutTransition, useShouldReduceMotion } from "@/components/Providers";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Popover } from "@/components/ui/Popover";
import { GameCard } from "@/components/ui/GameCard";
import { CatalogueList, ListHeader, ListRow } from "@/components/ui/ListRow";
import type { MenuOption } from "@/components/ui/MenuSelect";
import { Notice } from "@/components/ui/Notice";
import { ProgressGlyph } from "@/components/ui/ProgressGlyph";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Tag } from "@/components/ui/Tag";
import { TextField } from "@/components/ui/TextField";
import { FilterIcon, SearchIcon } from "@/components/ui/icons";
import { showsProgress } from "@/lib/data/edit-entry";
import type { EntryTag, LibraryItem } from "@/lib/data/library";
import { cx } from "@/lib/cx";
import { formatCount } from "@/lib/format";
import {
  LIBRARY_SORTS,
  NO_FILTERS,
  filterEntries,
  LIBRARY_PREFERENCES_COOKIE,
  hasFilters,
  libraryPreferences,
  libraryViewParams,
  COLUMN_CHOICES,
  groupByPlatform,
  narrowColumns,
  parseColumns,
  parseLibrarySort,
  parseLibraryView,
  progressCounts,
  type LibraryFilters,
  type LibraryLayout,
  type LibraryViewState,
} from "@/lib/library-view";
import { LAYOUT_ANIMATION_ITEM_LIMIT, transition } from "@/lib/motion";
import { OWNERSHIP_STATES, ownershipLabel } from "@/lib/ownership";
import { withQueued, withoutQueued, type QueuePlace, type QueuePositions } from "@/lib/queue-order";
import { setPreferenceCookie } from "@/lib/preference-cookie";
import { progressLabel, type Progress } from "@/lib/progress";
import { naturalDirection, nextSort, sortEntries } from "@/lib/sort";
import { CoverTile } from "./CoverTile";
import { queueEntry, unqueueEntry } from "../queue/actions";
import { EntryEditor } from "./EntryEditor";
import { LibraryEmpty } from "./LibraryEmpty";
import styles from "./library.module.css";

const LAYOUTS = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
  { value: "covers", label: "Covers" },
] as const satisfies ReadonlyArray<{ value: LibraryLayout; label: string }>;

const TEXT_FILTER_ID = "library-filter";

const columnOptions: Array<MenuOption<string>> = [
  { value: "auto", label: "Fit to screen" },
  ...COLUMN_CHOICES.map((count) => ({ value: String(count), label: `${count} per row` })),
];

/** The "no filter" choice in each menu. Not a valid ownership, platform id or tag name. */
const ANY = "";

const ownershipOptions: Array<MenuOption<string>> = [
  { value: ANY, label: "Any ownership" },
  ...OWNERSHIP_STATES.map((state) => ({ value: state, label: ownershipLabel[state] })),
];

type LibraryBrowserProps = {
  items: LibraryItem[];
  tags: EntryTag[];
  initialView: LibraryViewState;
  /** An entry named in the address, opened in the panel on arrival. */
  initialEntryId: string | null;
  /** Each queued entry's place in line. */
  queue: QueuePositions;
};

/** Marks history entries this page pushed, so closing the panel can step back over them. */
const ENTRY_STATE = "parlourEntry";

export function LibraryBrowser({
  items: initialItems,
  tags: initialTags,
  initialView,
  initialEntryId,
  queue: initialQueue,
}: LibraryBrowserProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [, startQueueing] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [allTags, setAllTags] = useState(initialTags);
  const [view, setView] = useState(initialView);
  const [openId, setOpenId] = useState(initialEntryId);
  const openItem = items.find((item) => item.id === openId);
  const panelHeadingId = useId();
  const { layout, sort, filters } = view;
  const reduceMotion = useShouldReduceMotion();
  const move = useLayoutTransition("move");

  // A game passed on has no progress to show, sort or filter by (DECISIONS.md 038).
  const browsable = useMemo(
    () =>
      items.map((item) =>
        showsProgress(item.ownership) ? item : { ...item, progress: undefined },
      ),
    [items],
  );
  const visible = useMemo(
    () => sortEntries(filterEntries(browsable, filters), sort.key, sort.direction),
    [browsable, filters, sort],
  );
  const progress = useMemo(() => progressCounts(browsable), [browsable]);
  const platforms = useMemo(() => platformOptions(items), [items]);
  const tags = useMemo(() => tagOptions(items), [items]);
  const filtered = hasFilters(filters);
  // What the Filters button counts: the choices hidden in the sheet, not the title filter beside it.
  const activeFilters = [
    filters.progress.length > 0,
    filters.ownership !== null,
    filters.platformId !== null,
    filters.tag !== null,
  ].filter(Boolean).length;

  // Back and forward move between an open entry and the library behind it.
  useEffect(() => {
    function onPopState() {
      const params = Object.fromEntries(new URLSearchParams(window.location.search));
      setView(parseLibraryView(params));
      setOpenId(params.entry ?? null);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /** The address for a view, with an open entry if there is one. */
  function addressFor(next: LibraryViewState, entryId: string | null): string {
    const params = libraryViewParams(next);
    if (entryId) params.set("entry", entryId);
    // Commas are legal in a query string; "progress=playing,paused" reads better than %2C.
    const query = params.toString().replaceAll("%2C", ",");
    return query ? `${window.location.pathname}?${query}` : window.location.pathname;
  }

  function update(next: LibraryViewState) {
    setView(next);
    // Kept in the address so a reload or the back button shows the same view,
    // without a server round trip: the whole library is already here.
    window.history.replaceState(window.history.state, "", addressFor(next, openId));
    // Layout and order are also remembered for the next visit from the menu.
    setPreferenceCookie(LIBRARY_PREFERENCES_COOKIE, libraryPreferences(next));
  }

  function openEntry(event: MouseEvent<HTMLAnchorElement>, id: string) {
    // A new tab or window gets the link as it is.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    setOpenId(id);
    // Pushed, not replaced, so the back button closes the panel as it would a page.
    window.history.pushState({ [ENTRY_STATE]: true }, "", addressFor(view, id));
  }

  function closeEntry() {
    const state: unknown = window.history.state;
    if (typeof state === "object" && state !== null && ENTRY_STATE in state) {
      window.history.back();
      return;
    }
    // Arrived with the entry already open: there is nothing to step back to.
    setOpenId(null);
    window.history.replaceState(window.history.state, "", addressFor(view, null));
  }

  function updateItem(id: string, change: (item: LibraryItem) => LibraryItem) {
    setItems((current) => current.map((item) => (item.id === id ? change(item) : item)));
  }

  function addKnownTag(tag: EntryTag) {
    setAllTags((current) =>
      current.some((known) => known.id === tag.id)
        ? current
        : [...current, tag].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  function gamesWithTag(tagId: string): string[] {
    return items
      .filter((item) => item.tags.some((tag) => tag.id === tagId))
      .map((item) => `${item.title} (${item.platform})`);
  }

  function forgetTag(tagId: string) {
    setAllTags((current) => current.filter((tag) => tag.id !== tagId));
    setItems((current) =>
      current.map((item) =>
        item.tags.some((tag) => tag.id === tagId)
          ? { ...item, tags: item.tags.filter((tag) => tag.id !== tagId) }
          : item,
      ),
    );
  }

  /** Queues or unqueues an entry: shown at once, put back with a reason if refused. */
  function changeQueue(entryId: string, place: QueuePlace | null) {
    const previous = queue;
    setQueue(place ? withQueued(queue, entryId, place) : withoutQueued(queue, entryId));
    setQueueError(null);
    startQueueing(async () => {
      const result = place ? await queueEntry({ entryId, place }) : await unqueueEntry({ entryId });
      if (result.status !== "saved") {
        setQueue(previous);
        setQueueError(result.message);
      }
    });
  }

  function removeItem(id: string) {
    setQueue((current) => withoutQueued(current, id));
    closeEntry();
    setItems((current) => current.filter((item) => item.id !== id));
  }

  /** The ownership, platform and tag filters, labelled, in the Filters menu. */
  function filterSelects() {
    return (
      <>
        <Select
          label="Ownership"
          options={ownershipOptions}
          value={filters.ownership ?? ANY}
          onChange={(next) =>
            filter({ ownership: OWNERSHIP_STATES.find((state) => state === next) ?? null })
          }
        />
        <Select
          label="Platform"
          options={platforms}
          value={filters.platformId === null ? ANY : String(filters.platformId)}
          onChange={(next) => filter({ platformId: Number(next) || null })}
        />
        {/* The first option is "Any tag"; the filter appears once there is a real one. */}
        {tags.length > 1 && (
          <Select
            label="Tag"
            options={tags}
            value={filters.tag ?? ANY}
            onChange={(next) => filter({ tag: next === ANY ? null : next })}
          />
        )}
      </>
    );
  }

  /** In the row its label is hidden, as the field says what it is; in the menu it shows. */
  function sortSelect(inline = false) {
    return (
      <Select
        label="Sort by"
        hideLabel={inline}
        options={LIBRARY_SORTS}
        value={sort.key}
        onChange={(next) => {
          const key = parseLibrarySort(next);
          update({ ...view, sort: { key, direction: naturalDirection(key) } });
        }}
        className={inline ? styles.sort : undefined}
      />
    );
  }

  /** Covers per row, for the layouts made of covers. */
  function columnsSelect(inline = false) {
    if (layout === "list") return null;
    return (
      <Select
        label="Covers per row"
        hideLabel={inline}
        options={columnOptions}
        value={view.columns === null ? "auto" : String(view.columns)}
        onChange={(next) => update({ ...view, columns: parseColumns(next) })}
        className={inline ? styles.columns : undefined}
      />
    );
  }

  function progressChips() {
    if (progress.length < 2) return null;
    return (
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
    );
  }

  const entryHref = (id: string) => `?${new URLSearchParams({ entry: id }).toString()}`;

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
  // Sorted by platform, each platform gets its own heading; otherwise one untitled run.
  const groups: Array<{ platform: string | null; items: typeof visible }> =
    sort.key === "platform" ? groupByPlatform(visible) : [{ platform: null, items: visible }];
  // A new column count crossfades like a new order: every cover would otherwise travel.
  const orderKey = `${sort.key}-${sort.direction}-${view.columns ?? "auto"}`;
  const status = filtered
    ? `Showing ${visible.length} of ${formatCount(items.length, "game")}`
    : "";

  // The count and the empty state live here, not in the server page, so
  // removing a game updates them without a reload.
  const header = (
    <PageHeader
      title="Library"
      meta={items.length === 0 ? "No games yet" : formatCount(items.length, "game")}
    />
  );
  if (items.length === 0) {
    return (
      <>
        {header}
        <LibraryEmpty />
      </>
    );
  }

  return (
    <>
      {header}
      <div className={styles.browser}>
        <Modal open={openItem !== undefined} onClose={closeEntry} labelledBy={panelHeadingId}>
          {openItem && (
            <EntryEditor
              key={openItem.id}
              item={openItem}
              headingId={panelHeadingId}
              allTags={allTags}
              onUpdate={updateItem}
              gamesWithTag={gamesWithTag}
              onTagCreated={addKnownTag}
              onTagDeleted={forgetTag}
              onRemoved={removeItem}
              onClose={closeEntry}
              queuePosition={queue[openItem.id] ?? null}
              queueError={queueError}
              onQueue={(place) => changeQueue(openItem.id, place)}
              onUnqueue={() => changeQueue(openItem.id, null)}
              onUnqueued={() => setQueue((current) => withoutQueued(current, openItem.id))}
            />
          )}
        </Modal>

        {/*
          One row, always. The title filter stretches; the filters live in their
          own menu; sort, covers per row and the layout switch sit in the row
          while they fit and fold into that menu when they do not
          (DECISIONS.md 048).
        */}
        <div className={styles.toolbar}>
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
          <Popover
            label="Filters"
            trigger={
              <>
                <FilterIcon width={16} height={16} />
                Filters
                {activeFilters > 0 && (
                  <span className={styles.filterCount}>
                    {activeFilters}
                    <span className="visually-hidden"> active</span>
                  </span>
                )}
              </>
            }
          >
            {progressChips()}
            {filterSelects()}
            <div className={styles.foldBelowWide}>
              {columnsSelect()}
              {sortSelect()}
            </div>
            <div className={styles.foldBelowMedium}>
              <SegmentedControl
                label="Layout"
                options={LAYOUTS}
                value={layout}
                onChange={(next) => update({ ...view, layout: next })}
              />
            </div>
            {filtered && (
              <Button size="sm" variant="quiet" onClick={clearFilters} className={styles.clearAll}>
                Clear filters
              </Button>
            )}
          </Popover>
          <div className={styles.inlineWide}>
            {columnsSelect(true)}
            {sortSelect(true)}
          </div>
          <div className={styles.inlineMedium}>
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

        {filtered && visible.length > 0 && (
          <div className={styles.refine}>
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
                  {groups.map((group) => (
                    <section key={group.platform ?? "all"} aria-label={group.platform ?? undefined}>
                      {group.platform && <GroupHeading group={group} />}
                      <motion.ul
                        key={animateLayout ? "rows" : viewKey}
                        className={styles.rows}
                        initial={animateLayout ? false : { opacity: 0 }}
                        animate={{ opacity: 1, transition: transition.enter }}
                      >
                        <AnimatePresence initial={false} mode="popLayout">
                          {group.items.map((item) => (
                            <motion.li
                              key={item.id}
                              layout={animateLayout ? "position" : false}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1, transition: transition.enter }}
                              exit={{ opacity: 0, transition: transition.exit }}
                              transition={{ layout: move }}
                            >
                              <ListRow
                                game={{ ...item, coverUrl: item.thumbUrl }}
                                href={entryHref(item.id)}
                                onClick={(event) => openEntry(event, item.id)}
                                selected={item.id === openId}
                              />
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </motion.ul>
                    </section>
                  ))}
                </CatalogueList>
              ) : (
                groups.map((group) => (
                  <section key={group.platform ?? "all"} aria-label={group.platform ?? undefined}>
                    {group.platform && <GroupHeading group={group} />}
                    {/*
                     * A new order crossfades the grid: cards crossing a wide grid
                     * read as a blur, not a move (DECISIONS.md 033). Filtering only
                     * closes gaps, short moves that stay legible, so those travel.
                     */}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.ul
                        key={animateLayout ? orderKey : viewKey}
                        className={cx(
                          styles.grid,
                          layout === "covers" && styles.coverGrid,
                          view.columns !== null && styles.fixedColumns,
                          group.platform !== null && styles.groupedGrid,
                        )}
                        style={
                          // Custom properties for .fixedColumns; empty when the grid fits itself.
                          (view.columns === null
                            ? {}
                            : {
                                "--columns": view.columns,
                                "--columns-narrow": narrowColumns(view.columns),
                              }) as MotionStyle
                        }
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: transition.enter }}
                        exit={{ opacity: 0, transition: transition.exit }}
                      >
                        <AnimatePresence initial={false} mode="popLayout">
                          {group.items.map((item) => (
                            <motion.li
                              key={item.id}
                              layout={animateLayout ? "position" : false}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1, transition: transition.enter }}
                              exit={{ opacity: 0, transition: transition.exit }}
                              transition={{ layout: move }}
                            >
                              {layout === "covers" ? (
                                <CoverTile
                                  item={item}
                                  href={entryHref(item.id)}
                                  onClick={(event) => openEntry(event, item.id)}
                                />
                              ) : (
                                <GameCard
                                  game={item}
                                  href={entryHref(item.id)}
                                  onClick={(event) => openEntry(event, item.id)}
                                />
                              )}
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </motion.ul>
                    </AnimatePresence>
                  </section>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
}

/** A platform's name over its games, with how many there are. */
function GroupHeading({
  group,
}: {
  group: { platform: string | null; items: readonly unknown[] };
}) {
  return (
    <h2 className={styles.groupHeading}>
      {group.platform}
      <span className={styles.groupCount}>{group.items.length}</span>
    </h2>
  );
}

/** The platforms this library actually has, A to Z, for the platform filter. */
function platformOptions(items: readonly LibraryItem[]): Array<MenuOption<string>> {
  const byId = new Map(items.map((item) => [item.platformId, item.platform]));
  const platforms = [...byId]
    .map(([id, name]) => ({ value: String(id), label: name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return [{ value: ANY, label: "All platforms" }, ...platforms];
}

/** The tags in use, A to Z, for the tag filter. */
function tagOptions(items: readonly LibraryItem[]): Array<MenuOption<string>> {
  const tags = [...new Set(items.flatMap((item) => item.tags.map((tag) => tag.name)))].sort(
    (a, b) => a.localeCompare(b),
  );
  return [{ value: ANY, label: "Any tag" }, ...tags.map((tag) => ({ value: tag, label: tag }))];
}
