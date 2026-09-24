"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { GameCover } from "@/components/ui/GameCover";
import { CloseIcon } from "@/components/ui/icons";
import { ProgressGlyph } from "@/components/ui/ProgressGlyph";
import { RatingInput } from "@/components/ui/RatingInput";
import { Select } from "@/components/ui/Select";
import { Tag } from "@/components/ui/Tag";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import {
  NOTES_MAX_LENGTH,
  TAG_MAX_LENGTH,
  datesInOrder,
  isIsoDate,
  normaliseTagName,
  progressChange,
  sameTagName,
  todayIso,
  type EntryPatch,
} from "@/lib/data/edit-entry";
import type { EntryTag, LibraryItem } from "@/lib/data/library";
import { OWNERSHIP_STATES, ownershipLabel } from "@/lib/ownership";
import { PROGRESS_STATES, progressDescription, progressLabel } from "@/lib/progress";
import { addTag, removeEntry, removeTag, updateEntry } from "./actions";
import styles from "./entry-editor.module.css";

const progressOptions = PROGRESS_STATES.map((state) => ({
  value: state,
  label: progressLabel[state],
  description: progressDescription[state],
  leading: <ProgressGlyph progress={state} />,
}));

const ownershipOptions = OWNERSHIP_STATES.map((state) => ({
  value: state,
  label: ownershipLabel[state],
  description: {
    owned: "You have it on this platform",
    want_to_own: "On your list to buy",
    not_interested: "Keep a record that you passed on it",
  }[state],
}));

/** Notes save this long after the last keystroke, and on leaving the field. */
const NOTES_SAVE_DELAY_MS = 800;

/** Tags suggested under the tag field, from the ones already made. */
const SUGGESTION_LIMIT = 8;

type Field = "progress" | "ownership" | "rating" | "dates" | "notes" | "tags" | "remove";

type EntryEditorProps = {
  item: LibraryItem;
  /** Id for the title, which names the panel it sits in. */
  headingId: string;
  /** Every tag this person has, for suggestions. */
  allTags: readonly EntryTag[];
  onUpdate: (id: string, update: (item: LibraryItem) => LibraryItem) => void;
  onTagCreated: (tag: EntryTag) => void;
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
  onUpdate,
  onTagCreated,
  onRemoved,
  onClose,
}: EntryEditorProps) {
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

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
        <div className={styles.pair}>
          <Select
            label="Progress"
            options={progressOptions}
            value={item.progress}
            error={errors.progress}
            onChange={(progress) => {
              if (progress !== item.progress)
                save("progress", progressChange(item, progress, todayIso()));
            }}
          />
          <Select
            label="Ownership"
            options={ownershipOptions}
            value={item.ownership}
            error={errors.ownership}
            onChange={(ownership) => {
              if (ownership !== item.ownership) save("ownership", { ownership });
            }}
          />
        </div>

        <RatingInput
          label="Your rating"
          value={item.rating}
          error={errors.rating}
          onChange={(rating) => {
            if (rating !== item.rating) save("rating", { rating });
          }}
        />

        <DateFields
          item={item}
          error={errors.dates}
          onSave={(patch) => save("dates", patch)}
          onError={(message) => setError("dates", message)}
        />

        <TagField
          item={item}
          allTags={allTags}
          error={errors.tags}
          onError={(message) => setError("tags", message)}
          onUpdate={onUpdate}
          onTagCreated={onTagCreated}
        />

        <NotesField item={item} error={errors.notes} onSave={(notes) => save("notes", { notes })} />
      </div>

      <RemoveEntry item={item} onRemoved={onRemoved} />
    </article>
  );
}

type DateFieldsProps = {
  item: LibraryItem;
  error: string | undefined;
  onSave: (patch: EntryPatch) => void;
  onError: (message: string | undefined) => void;
};

/** When you started and finished. Filled in for you when progress changes, if empty. */
function DateFields({ item, error, onSave, onError }: DateFieldsProps) {
  function change(field: "startedOn" | "finishedOn", raw: string) {
    const value = raw === "" ? null : raw;
    // Browsers only report a date once all of it is typed; a partial one is ignored.
    if (value !== null && !isIsoDate(value)) return;
    const next = { startedOn: item.startedOn, finishedOn: item.finishedOn, [field]: value };
    if (!datesInOrder(next.startedOn, next.finishedOn)) {
      onError("The finish date cannot be before the start date.");
      return;
    }
    onSave({ [field]: value });
  }

  return (
    <fieldset className={styles.dates}>
      {/* The two labels say it; the legend is there to group them for screen readers. */}
      <legend className="visually-hidden">Dates</legend>
      <div className={styles.pair}>
        <TextField
          label="Started"
          type="date"
          value={item.startedOn ?? ""}
          max={item.finishedOn ?? undefined}
          onChange={(event) => change("startedOn", event.target.value)}
        />
        <TextField
          label="Finished"
          type="date"
          value={item.finishedOn ?? ""}
          min={item.startedOn ?? undefined}
          onChange={(event) => change("finishedOn", event.target.value)}
        />
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

type TagFieldProps = {
  item: LibraryItem;
  allTags: readonly EntryTag[];
  error: string | undefined;
  onError: (message: string | undefined) => void;
  onUpdate: EntryEditorProps["onUpdate"];
  onTagCreated: EntryEditorProps["onTagCreated"];
};

/** A new tag's id until the server has made it. */
const PENDING_TAG = "pending:";

/** Anything true alongside progress: "Co-op", "Want to 100%", "Played with Sam". */
function TagField({ item, allTags, error, onError, onUpdate, onTagCreated }: TagFieldProps) {
  const [draft, setDraft] = useState("");
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
      {item.tags.length > 0 && (
        <ul className={styles.tagList} aria-label="Tags on this game">
          {item.tags.map((tag) => (
            <li key={tag.id}>
              <Tag
                onRemove={() => remove(tag)}
                removeLabel={`Remove the tag ${tag.name}`}
                disabled={tag.id.startsWith(PENDING_TAG)}
              >
                {tag.name}
              </Tag>
            </li>
          ))}
        </ul>
      )}
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
      {suggestions.length > 0 && (
        <div className={styles.suggestions} role="group" aria-label="Your other tags">
          {suggestions.map((tag) => (
            <Tag key={tag.id} onToggle={() => add(tag.name)}>
              {tag.name}
            </Tag>
          ))}
        </div>
      )}
    </fieldset>
  );
}

type NotesFieldProps = {
  item: LibraryItem;
  error: string | undefined;
  onSave: (notes: string) => void;
};

/** Free text, saved shortly after typing stops and when the panel closes. */
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

  // Closing the panel mid-sentence still keeps the sentence.
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
        <Button size="sm" variant="quiet" onClick={() => setConfirming(true)}>
          Remove from library
        </Button>
      )}
    </footer>
  );
}
