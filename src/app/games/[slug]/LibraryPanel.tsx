"use client";

import Link from "next/link";
import { ProgressGlyph } from "@/components/ui/ProgressGlyph";
import type { CatalogueGame } from "@/lib/catalogue";
import { entryKey } from "@/lib/data/add-entry";
import { showsProgress } from "@/lib/data/edit-entry";
import type { EntryStatus, LibraryItem } from "@/lib/data/library";
import { formatDate } from "@/lib/format";
import { ownershipLabel } from "@/lib/ownership";
import { platformLabel } from "@/lib/platforms";
import { progressLabel } from "@/lib/progress";
import { SearchControls } from "../../search/SearchCard";
import { PENDING, useSearchEntry, useSearchSession } from "../../search/useSearchEntry";
import styles from "./game.module.css";

type LibraryPanelProps = {
  game: CatalogueGame;
  statuses: Readonly<Record<string, EntryStatus>>;
  /** Everything you have recorded on each entry, by entry id. */
  details: Readonly<Record<string, LibraryItem>>;
  habits: Readonly<Record<number, number>>;
  signedIn: boolean;
  returnTo: string;
};

/**
 * This game in your library: for each platform you have it on, your
 * progress, rating, dates, tags and notes, with a link to edit them in the
 * library. Below, the same platform picker and add button as search, so
 * adding works the same everywhere.
 */
export function LibraryPanel({
  game,
  statuses,
  details,
  habits,
  signedIn,
  returnTo,
}: LibraryPanelProps) {
  const session = useSearchSession(statuses);
  const state = useSearchEntry(game, session, habits);
  const entries = state.platforms.flatMap((platform) => {
    const entry = session.entries[entryKey(game.id, platform.id)];
    return entry ? [{ platform, entry }] : [];
  });

  return (
    <section className={styles.panel} aria-labelledby="your-library">
      <h2 id="your-library" className={styles.panelTitle}>
        Your library
      </h2>

      {entries.length > 0 && (
        <ul className={styles.entries}>
          {entries.map(({ platform, entry }) => (
            <li key={platform.id}>
              <EntrySummary
                platform={platformLabel(platform.name)}
                entry={entry}
                detail={details[entry.entryId]}
              />
            </li>
          ))}
        </ul>
      )}

      <SearchControls
        game={game}
        session={session}
        habits={habits}
        signedIn={signedIn}
        returnTo={returnTo}
        state={state}
        showAlsoOn={false}
      />
    </section>
  );
}

type EntrySummaryProps = {
  platform: string;
  entry: EntryStatus;
  /** Absent for an entry added on this page, which has nothing else recorded yet. */
  detail: LibraryItem | undefined;
};

const day = (iso: string) => formatDate(new Date(`${iso}T00:00:00Z`));

function EntrySummary({ platform, entry, detail }: EntrySummaryProps) {
  const progress = showsProgress(entry.ownership);
  const dates = [
    detail?.startedOn ? `Started ${day(detail.startedOn)}` : null,
    detail?.finishedOn ? `finished ${day(detail.finishedOn)}` : null,
  ].filter((part) => part !== null);

  return (
    <div className={styles.entry}>
      <div className={styles.entryHead}>
        <span className={styles.entryPlatform}>{platform}</span>
        {detail?.rating != null && (
          <span className={styles.entryRating} aria-label={`Rated ${detail.rating} out of 10`}>
            {detail.rating}
            <span className={styles.entryRatingOf}>/10</span>
          </span>
        )}
      </div>
      <span className={styles.entryStatus}>
        {progress && <ProgressGlyph progress={entry.progress} />}
        {progress
          ? `${progressLabel[entry.progress]}, ${ownershipLabel[entry.ownership].toLowerCase()}`
          : ownershipLabel[entry.ownership]}
      </span>
      {dates.length > 0 && (
        <span className={styles.entryDates}>
          {dates.join(", ").replace(/^finished/, "Finished")}
        </span>
      )}
      {detail && detail.tags.length > 0 && (
        <ul className={styles.entryTags} aria-label="Tags">
          {detail.tags.map((tag) => (
            <li key={tag.id}>{tag.name}</li>
          ))}
        </ul>
      )}
      {detail?.notes && <p className={styles.entryNotes}>{detail.notes}</p>}
      {/* Just added: there is nothing to open until the server has made the entry. */}
      {entry.entryId !== PENDING && (
        <Link href={`/?entry=${entry.entryId}`} className={styles.entryEdit}>
          Edit in your library
        </Link>
      )}
    </div>
  );
}
