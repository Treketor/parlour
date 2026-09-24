"use client";

import Link from "next/link";
import { ProgressGlyph } from "@/components/ui/ProgressGlyph";
import type { CatalogueGame } from "@/lib/catalogue";
import { entryKey } from "@/lib/data/add-entry";
import { showsProgress } from "@/lib/data/edit-entry";
import type { EntryStatus } from "@/lib/data/library";
import { ownershipLabel } from "@/lib/ownership";
import { platformLabel } from "@/lib/platforms";
import { progressLabel } from "@/lib/progress";
import { SearchControls } from "../../search/SearchCard";
import { PENDING, useSearchEntry, useSearchSession } from "../../search/useSearchEntry";
import styles from "./game.module.css";

type LibraryPanelProps = {
  game: CatalogueGame;
  statuses: Readonly<Record<string, EntryStatus>>;
  habits: Readonly<Record<number, number>>;
  signedIn: boolean;
  returnTo: string;
};

/**
 * This game in your library: an entry per platform you have it on, each
 * opening in the library's editor, and the same platform picker and add
 * button as search, so adding works the same everywhere.
 */
export function LibraryPanel({ game, statuses, habits, signedIn, returnTo }: LibraryPanelProps) {
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
              <EntryLink platform={platformLabel(platform.name)} entry={entry} />
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

function EntryLink({ platform, entry }: { platform: string; entry: EntryStatus }) {
  const status = (
    <span className={styles.entryStatus}>
      {showsProgress(entry.ownership) && <ProgressGlyph progress={entry.progress} />}
      {showsProgress(entry.ownership)
        ? `${progressLabel[entry.progress]}, ${ownershipLabel[entry.ownership].toLowerCase()}`
        : ownershipLabel[entry.ownership]}
    </span>
  );

  // Just added: there is nothing to open until the server has made the entry.
  if (entry.entryId === PENDING) {
    return (
      <span className={styles.entry}>
        <span className={styles.entryPlatform}>{platform}</span>
        {status}
      </span>
    );
  }

  return (
    <Link href={`/?entry=${entry.entryId}`} className={styles.entry}>
      <span className={styles.entryPlatform}>{platform}</span>
      {status}
    </Link>
  );
}
