"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useLayoutTransition } from "@/components/Providers";
import { Button, IconButton } from "@/components/ui/Button";
import { GameCover } from "@/components/ui/GameCover";
import { CloseIcon, PlusIcon } from "@/components/ui/icons";
import { ProgressGlyph } from "@/components/ui/ProgressGlyph";
import { RatingInput } from "@/components/ui/RatingInput";
import { Select } from "@/components/ui/Select";
import { Tag } from "@/components/ui/Tag";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import {
  NOTES_MAX_LENGTH,
  TAG_MAX_LENGTH,
  datesFor,
  datesInOrder,
  isIsoDate,
  normaliseTagName,
  ownershipFits,
  sameTagName,
  showsProgress,
  tracksProgress,
  type EntryPatch,
} from "@/lib/data/edit-entry";
import type { EntryTag, LibraryItem } from "@/lib/data/library";
import { transition } from "@/lib/motion";
import { OWNERSHIP_STATES, ownershipLabel } from "@/lib/ownership";
import { PROGRESS_STATES, progressDescription, progressLabel } from "@/lib/progress";
import { addTag, deleteTag, removeEntry, removeTag, updateEntry } from "./actions";
import styles from "./entry-editor.module.css";

const progressOptions = PROGRESS_STATES.map((state) => ({
  value: state,
  label: progressLabel[state],
  description: progressDescription[state],
  leading: <ProgressGlyph progress={state} />,
}));

const ownershipDescription = {
  owned: "You have it on this platform",
  want_to_own: "On your list to buy",
  not_interested: "Keep a record that you passed on it",
} as const;

/** Notes save this long after the last keystroke, and on leaving the field. */
const NOTES_SAVE_DELAY_MS = 800;

/** Tags suggested under the tag field, from the ones already made. */
const SUGGESTION_LIMIT = 8;

/**
 * Years outside this range are a year still being typed ("0202" on the way
 * to "2026") or a slip ("5012"), not a choice, so they are never saved.
 */
const EARLIEST_YEAR = 1950;
const LATEST_YEAR = 2100;

type Field = "progress" | "ownership" | "rating" | "dates" | "notes" | "tags";

type EntryEditorProps = {
  item: LibraryItem;
  /** Id for the title, which names the box it sits in. */
  headingId: string;
  /** Every tag this person has, for suggestions and managing. */
  allTags: readonly EntryTag[];
  /** Titles of the games carrying a tag, for the warning before deleting it. */
  gamesWithTag: (tagId: string) => string[];
  onUpdate: (id: string, update: (item: LibraryItem) => LibraryItem) => void;
  onTagCreated: (tag: EntryTag) => void;
  onTagDeleted: (tagId: string) => void;
  onRemoved: (id: string) => void;
  onClose: () => void;
};

/**
 * Everything personal about one entry, edited in place. Each change shows at
 * once, here and in the library behind, and is saved behind it; if the
 * server refuses, the field goes back and says why.
 */
export function EntryEditor({
  item,
  headingId,
  allTags,
  gamesWithTag,
  onUpdate,
  onTagCreated,
  onTagDeleted,
  onRemoved,
  onClose,
}: EntryEditorProps) {
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const move = useLayoutTransition("move");

  function setError(field: Field, message: string | undefined) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function save(field: Field, patch: EntryPatch) {
    const keys = Object.keys(patch) as Array<keyof EntryPatch>;
    const before = Object.fromEntries(keys.map((key) => [key, item[key]]));
    onUpdate(item.id, (current) => ({ ...current, ...patch }));
    setError(field, undefined);
    setSaved(false);

    startSaving(async () => {
      const result = await updateEntry({ entryId: item.id, patch });
      if (result.status === "saved") {
        setSaved(true);
        return;
      }
      // Put back only the fields nothing newer has changed since.
      onUpdate(item.id, (current) => {
        const reverted = { ...current };
        for (const key of keys) {
          if (current[key] === patch[key]) Object.assign(reverted, { [key]: before[key] });
        }
        return reverted;
      });
      setError(field, result.message);
    });
  }

  const ownershipOptions = OWNERSHIP_STATES.map((state) => ({
    value: state,
    label: ownershipLabel[state],
    ...(ownershipFits(state, item.progress)
      ? { description: ownershipDescription[state] }
      : { description: "Set progress back to Want to play first", disabled: true }),
  }));
  const tracked = tracksProgress(item.ownership);
  const dates = tracked ? datesFor(item.progress) : null;
  // Dates are offered, not asked for: the fields appear once one is set or
  // you ask for them, so a library can be filled in without them.
  const [addingDates, setAddingDates] = useState(false);
  const hasDates = item.startedOn !== null || item.finishedOn !== null;
  const showDates = Boolean(dates?.started) && (hasDates || addingDates);

  // Fields below one that appears or disappears slide to their new places.
  const section = { layout: "position" as const, transition: { layout: move } };

  return (
    <article className={styles.editor} aria-labelledby={headingId}>
      <header className={styles.header}>
        <GameCover title={item.title} src={item.coverUrl} className={styles.cover} />
        <div className={styles.heading}>
          <h2 id={headingId} className={styles.title}>
            {item.title}
          </h2>
          <p className={styles.facts}>
            <span>{item.platform}</span>
            {item.year !== null && <span>{item.year}</span>}
            <Link href={`/games/${item.slug}`} className={styles.gameLink}>
              Game page
            </Link>
          </p>
          <p className={styles.saveState} role="status">
            {saving ? "Saving" : saved ? "Saved" : ""}
          </p>
        </div>
        <IconButton label="Close" variant="quiet" onClick={onClose} className={styles.close}>
          <CloseIcon />
        </IconButton>
      </header>

      <div className={styles.fields}>
        {/* Ownership first: it decides whether progress applies at all. */}
        <motion.div className={styles.status} {...section}>
          <div className={styles.pair}>
            <Select
              label="Ownership"
              options={ownershipOptions}
              value={item.ownership}
              error={errors.ownership}
              onChange={(ownership) => {
                if (ownership !== item.ownership) save("ownership", { ownership });
              }}
            />
            {showsProgress(item.ownership) ? (
              <Select
                label="Progress"
                options={progressOptions}
                value={item.progress}
                error={errors.progress}
                disabled={!tracked}
                {...(!tracked && { hint: "Mark it as owned to track progress" })}
                onChange={(progress) => {
                  if (progress !== item.progress) {
                    save("progress", { progress });
                  }
                }}
              />
            ) : (
              <p className={styles.passed}>Passed on, so there is no progress to track.</p>
            )}
          </div>
          {/* Offered right under progress, which is what makes a date mean something. */}
          {dates?.started && !showDates && (
            <Button
              size="sm"
              icon={<PlusIcon width={12} height={12} />}
              onClick={() => setAddingDates(true)}
              className={styles.addDates}
            >
              Add dates
            </Button>
          )}
        </motion.div>

        <AnimatePresence initial={false}>
          {dates && showDates && (
            <motion.div
              key="dates"
              {...section}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: transition.enter }}
              exit={{ opacity: 0, transition: transition.exit }}
            >
              <DateFields
                item={item}
                showFinished={dates.finished}
                error={errors.dates}
                onSave={(patch) => save("dates", patch)}
                onError={(message) => setError("dates", message)}
                onRemove={() => {
                  setAddingDates(false);
                  save("dates", { startedOn: null, finishedOn: null });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div {...section}>
          <RatingInput
            label="Your rating"
            value={item.rating}
            error={errors.rating}
            onChange={(rating) => {
              if (rating !== item.rating) save("rating", { rating });
            }}
          />
        </motion.div>

        <motion.div {...section}>
          <TagField
            item={item}
            allTags={allTags}
            gamesWithTag={gamesWithTag}
            error={errors.tags}
            onError={(message) => setError("tags", message)}
            onUpdate={onUpdate}
            onTagCreated={onTagCreated}
            onTagDeleted={onTagDeleted}
          />
        </motion.div>

        <motion.div {...section}>
          <NotesField
            item={item}
            error={errors.notes}
            onSave={(notes) => save("notes", { notes })}
          />
        </motion.div>
      </div>

      <RemoveEntry item={item} onRemoved={onRemoved} />
    </article>
  );
}

type DateFieldsProps = {
  item: LibraryItem;
  showFinished: boolean;
  error: string | undefined;
  onSave: (patch: EntryPatch) => void;
  onError: (message: string | undefined) => void;
  /** Clears both dates and folds the fields away again. */
  onRemove: () => void;
};

/**
 * When you started and finished, shown once they mean something. Filled in
 * for you when progress changes, if empty.
 */
function DateFields({ item, showFinished, error, onSave, onError, onRemove }: DateFieldsProps) {
  function commit(field: "startedOn" | "finishedOn", value: string | null) {
    const next = { startedOn: item.startedOn, finishedOn: item.finishedOn, [field]: value };
    if (!datesInOrder(next.startedOn, next.finishedOn)) {
      onError("The finish date cannot be before the start date.");
      return;
    }
    onError(undefined);
    if (value !== item[field]) onSave({ [field]: value });
  }

  return (
    <fieldset className={styles.dates}>
      {/* The labels say it; the legend groups them for screen readers. */}
      <legend className="visually-hidden">Dates</legend>
      <div className={styles.pair}>
        <DateInput
          label="Started"
          value={item.startedOn}
          onCommit={(value) => commit("startedOn", value)}
          onIncomplete={onError}
        />
        <AnimatePresence initial={false}>
          {showFinished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: transition.enter }}
              exit={{ opacity: 0, transition: transition.exit }}
            >
              <DateInput
                label="Finished"
                value={item.finishedOn}
                onCommit={(value) => commit("finishedOn", value)}
                onIncomplete={onError}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Button size="sm" variant="quiet" onClick={onRemove} className={styles.removeDates}>
        Remove dates
      </Button>
    </fieldset>
  );
}

type DateInputProps = {
  label: string;
  value: string | null;
  onCommit: (value: string | null) => void;
  onIncomplete: (message: string) => void;
};

/**
 * A date that is only judged once it is whole. Browsers report every
 * keystroke of the year as a date ("0002", "0020", "0202"), and checking
 * those against the start date refused the year before it was finished.
 */
function DateInput({ label, value, onCommit, onIncomplete }: DateInputProps) {
  const [draft, setDraft] = useState(value ?? "");
  // A date filled in from outside (progress changed) replaces the draft.
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    setDraft(value ?? "");
  }

  const whole = (raw: string) => {
    const year = Number(raw.slice(0, 4));
    return isIsoDate(raw) && year >= EARLIEST_YEAR && year <= LATEST_YEAR;
  };

  return (
    <TextField
      label={label}
      type="date"
      value={draft}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        // Picking from the calendar, or typing the last digit of a real year, saves at once.
        if (raw === "" || whole(raw)) onCommit(raw === "" ? null : raw);
      }}
      onBlur={() => {
        if (draft === (value ?? "") || draft === "" || whole(draft)) return;
        onIncomplete(`Enter the whole ${label.toLowerCase()} date: day, month and year.`);
      }}
      onClear={() => {
        setDraft("");
        onCommit(null);
      }}
    />
  );
}

type TagFieldProps = {
  item: LibraryItem;
  allTags: readonly EntryTag[];
  gamesWithTag: (tagId: string) => string[];
  error: string | undefined;
  onError: (message: string | undefined) => void;
  onUpdate: EntryEditorProps["onUpdate"];
  onTagCreated: EntryEditorProps["onTagCreated"];
  onTagDeleted: EntryEditorProps["onTagDeleted"];
};

/** A new tag's id until the server has made it. */
const PENDING_TAG = "pending:";

/**
 * Anything true alongside progress: "Co-op", "Want to 100%", "Played with
 * Sam". Tags on this game are drawn in the accent with a remove control;
 * your other tags are dashed with a plus, ready to add.
 */
function TagField({
  item,
  allTags,
  gamesWithTag,
  error,
  onError,
  onUpdate,
  onTagCreated,
  onTagDeleted,
}: TagFieldProps) {
  const [draft, setDraft] = useState("");
  const [managing, setManaging] = useState(false);
  const [, startTagging] = useTransition();

  const onEntry = (name: string) => item.tags.some((tag) => sameTagName(tag.name, name));
  const search = draft.trim().toLowerCase();
  const suggestions = allTags
    .filter((tag) => !onEntry(tag.name) && tag.name.toLowerCase().includes(search))
    .slice(0, SUGGESTION_LIMIT);

  function add(raw: string) {
    const name = normaliseTagName(raw);
    setDraft("");
    if (name === null || onEntry(name)) return;
    onError(undefined);

    const known = allTags.find((tag) => sameTagName(tag.name, name));
    const placeholder = known ?? { id: `${PENDING_TAG}${name}`, name };
    onUpdate(item.id, (current) => ({
      ...current,
      tags: [...current.tags, placeholder].sort((a, b) => a.name.localeCompare(b.name)),
    }));

    startTagging(async () => {
      const result = await addTag({ entryId: item.id, name });
      onUpdate(item.id, (current) => ({
        ...current,
        tags: current.tags.flatMap((tag) => {
          if (tag.id !== placeholder.id) return [tag];
          return result.status === "tagged" ? [result.tag] : [];
        }),
      }));
      if (result.status === "tagged") onTagCreated(result.tag);
      else onError(result.message);
    });
  }

  function remove(tag: EntryTag) {
    onError(undefined);
    onUpdate(item.id, (current) => ({
      ...current,
      tags: current.tags.filter((candidate) => candidate.id !== tag.id),
    }));
    startTagging(async () => {
      const result = await removeTag({ entryId: item.id, tagId: tag.id });
      if (result.status === "saved") return;
      onUpdate(item.id, (current) => ({
        ...current,
        tags: [...current.tags, tag].sort((a, b) => a.name.localeCompare(b.name)),
      }));
      onError(result.message);
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      add(draft);
    }
  }

  return (
    <fieldset className={styles.tags}>
      <legend className={styles.legend}>Tags</legend>

      <div className={styles.tagGroup}>
        <h3 className={styles.groupLabel}>On this game</h3>
        {item.tags.length > 0 ? (
          <ul className={styles.tagList} aria-label="Tags on this game">
            {item.tags.map((tag) => (
              <li key={tag.id}>
                <Tag
                  tone="applied"
                  onRemove={() => remove(tag)}
                  removeLabel={`Take the tag ${tag.name} off this game`}
                  disabled={tag.id.startsWith(PENDING_TAG)}
                >
                  {tag.name}
                </Tag>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.none}>None yet</p>
        )}
      </div>

      <TextField
        label="Add a tag"
        hideLabel
        placeholder="Add a tag, then press Enter"
        maxLength={TAG_MAX_LENGTH}
        autoComplete="off"
        enterKeyHint="done"
        value={draft}
        error={error}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
      />

      {allTags.length > 0 && (
        <div className={styles.tagGroup}>
          <div className={styles.groupHead}>
            <h3 className={styles.groupLabel}>{managing ? "All your tags" : "Your other tags"}</h3>
            <Button size="sm" variant="quiet" onClick={() => setManaging((current) => !current)}>
              {managing ? "Done" : "Manage tags"}
            </Button>
          </div>
          {managing ? (
            <ManageTags
              allTags={allTags}
              gamesWithTag={gamesWithTag}
              onDeleted={onTagDeleted}
              onError={onError}
            />
          ) : suggestions.length > 0 ? (
            <div className={styles.tagList} role="group" aria-label="Your other tags">
              {suggestions.map((tag) => (
                <Tag key={tag.id} tone="suggestion" onToggle={() => add(tag.name)}>
                  {tag.name}
                </Tag>
              ))}
            </div>
          ) : (
            <p className={styles.none}>
              {search ? "No other tags match" : "All your tags are on this game"}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}

type ManageTagsProps = {
  allTags: readonly EntryTag[];
  gamesWithTag: (tagId: string) => string[];
  onDeleted: (tagId: string) => void;
  onError: (message: string | undefined) => void;
};

/**
 * Deleting a tag takes it off every game, so it asks first and names them.
 * Like removing a game, it waits for the server before it goes.
 */
function ManageTags({ allTags, gamesWithTag, onDeleted, onError }: ManageTagsProps) {
  const [confirming, setConfirming] = useState<EntryTag | null>(null);
  const [deleting, startDeleting] = useTransition();

  function confirmDelete(tag: EntryTag) {
    onError(undefined);
    startDeleting(async () => {
      const result = await deleteTag({ tagId: tag.id });
      if (result.status === "saved") {
        setConfirming(null);
        onDeleted(tag.id);
      } else {
        onError(result.message);
      }
    });
  }

  if (confirming) {
    const games = gamesWithTag(confirming.id);
    return (
      <div className={styles.confirm} role="group" aria-label={`Delete the tag ${confirming.name}`}>
        <p className={styles.confirmText}>
          {games.length === 0
            ? `Delete the tag “${confirming.name}”? No games have it.`
            : `Delete the tag “${confirming.name}”? It comes off ${
                games.length === 1 ? "1 game" : `${games.length} games`
              }:`}
        </p>
        {games.length > 0 && (
          <ul className={styles.affected}>
            {games.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        )}
        <div className={styles.confirmActions}>
          <Button
            // The chip that asked has gone; focus moves to the question's answer.
            autoFocus
            variant="danger"
            size="sm"
            disabled={deleting}
            onClick={() => confirmDelete(confirming)}
          >
            {deleting ? "Deleting" : "Delete tag"}
          </Button>
          <Button size="sm" variant="quiet" disabled={deleting} onClick={() => setConfirming(null)}>
            Keep it
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ul className={styles.tagList} aria-label="All your tags">
      {allTags.map((tag) => (
        <li key={tag.id}>
          <Tag onRemove={() => setConfirming(tag)} removeLabel={`Delete the tag ${tag.name}`}>
            {tag.name}
          </Tag>
        </li>
      ))}
    </ul>
  );
}

type NotesFieldProps = {
  item: LibraryItem;
  error: string | undefined;
  onSave: (notes: string) => void;
};

/** Free text, saved shortly after typing stops and when the box closes. */
function NotesField({ item, error, onSave }: NotesFieldProps) {
  const [notes, setNotes] = useState(item.notes);
  // The newest text and save, for the timer and the close below to read.
  const latest = useRef({ notes, saved: item.notes, onSave });
  useEffect(() => {
    latest.current = { notes, saved: item.notes, onSave };
  });

  function flush() {
    const { notes: current, saved, onSave: save } = latest.current;
    if (current !== saved) save(current);
  }

  useEffect(() => {
    const timer = window.setTimeout(flush, NOTES_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [notes]);

  // Closing the box mid-sentence still keeps the sentence.
  useEffect(() => flush, []);

  return (
    <TextArea
      label="Notes"
      placeholder="What stuck with you, where you left off, what to try next time"
      maxLength={NOTES_MAX_LENGTH}
      value={notes}
      error={error}
      onChange={(event) => setNotes(event.target.value)}
      onBlur={flush}
    />
  );
}

type RemoveEntryProps = { item: LibraryItem; onRemoved: (id: string) => void };

/**
 * Removing asks once, in place, and says what goes with it. It waits for the
 * server rather than vanishing at once: this is the one change that cannot
 * be put back by changing it again.
 */
function RemoveEntry({ item, onRemoved }: RemoveEntryProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, startRemoving] = useTransition();

  function remove() {
    setError(null);
    startRemoving(async () => {
      const result = await removeEntry({ entryId: item.id });
      if (result.status === "saved") onRemoved(item.id);
      else setError(result.message);
    });
  }

  return (
    <footer className={styles.footer}>
      {confirming ? (
        <div className={styles.confirm} role="group" aria-label="Confirm removal">
          <p className={styles.confirmText}>
            Remove {item.title} on {item.platform}? Its progress, rating, dates, tags and notes go
            with it.
          </p>
          <div className={styles.confirmActions}>
            <Button
              // The button that asked has gone; focus moves to the question's answer.
              autoFocus
              variant="danger"
              size="sm"
              onClick={remove}
              disabled={removing}
            >
              {removing ? "Removing" : "Remove"}
            </Button>
            <Button
              size="sm"
              variant="quiet"
              onClick={() => setConfirming(false)}
              disabled={removing}
            >
              Keep it
            </Button>
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
          Remove from library
        </Button>
      )}
    </footer>
  );
}
