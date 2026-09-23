"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { MenuSelect } from "@/components/ui/MenuSelect";
import { ProgressLabel } from "@/components/ui/ProgressGlyph";
import type { EntryStatus } from "@/lib/data/library";
import { OWNERSHIP_STATES, ownershipLabel, type Ownership } from "@/lib/ownership";
import { addToLibrary } from "./actions";
import styles from "./search.module.css";

const ownershipOptions = OWNERSHIP_STATES.map((state) => ({
  value: state,
  label: ownershipLabel[state],
  description: {
    owned: "You have it on this platform",
    want_to_own: "On your list to buy",
    not_interested: "Keep a record that you passed on it",
  }[state],
}));

type PlatformRowProps = {
  gameId: number;
  gameName: string;
  platform: { id: number; name: string };
  status: EntryStatus | null;
  signedIn: boolean;
  /** Where signing in should bring you back to. */
  returnTo: string;
};

type Shown = { ownership: Ownership; progress: EntryStatus["progress"] };

/**
 * One platform of one search result. Adding is optimistic: the row shows the
 * game as in the library straight away and the server confirms behind it; if
 * the server refuses, the row goes back and says why.
 */
export function PlatformRow({
  gameId,
  gameName,
  platform,
  status,
  signedIn,
  returnTo,
}: PlatformRowProps) {
  const [shown, setShown] = useState<Shown | null>(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const statusRef = useRef<HTMLSpanElement>(null);
  const justAdded = useRef(false);

  useEffect(() => {
    // The Add control disappears when a game is added; keep focus on the row.
    if (shown && justAdded.current) {
      justAdded.current = false;
      statusRef.current?.focus();
    }
  }, [shown]);

  function add(ownership: Ownership) {
    setError(null);
    justAdded.current = true;
    setShown({ ownership, progress: "want_to_play" });

    startTransition(async () => {
      const result = await addToLibrary({ gameId, platformId: platform.id, ownership });
      if (result.status === "added" || result.status === "exists") return;

      setShown(null);
      setError(
        result.status === "signed-out"
          ? "Your session has ended. Sign in again to add games."
          : result.message,
      );
    });
  }

  return (
    <div className={styles.platformRow}>
      <span className={styles.platformName}>{platform.name}</span>

      <div className={styles.platformAction}>
        {shown ? (
          <span
            ref={statusRef}
            tabIndex={-1}
            className={styles.inLibrary}
            data-pending={pending || undefined}
          >
            <ProgressLabel progress={shown.progress} />
            <span className={styles.ownership}>{ownershipLabel[shown.ownership]}</span>
          </span>
        ) : signedIn ? (
          <MenuSelect
            action
            size="sm"
            label={`Add ${gameName} on ${platform.name}`}
            placeholder="Add"
            align="end"
            options={ownershipOptions}
            value={null}
            onChange={add}
          />
        ) : (
          <ButtonLink size="sm" href={`/sign-in?next=${encodeURIComponent(returnTo)}`}>
            Sign in to add
          </ButtonLink>
        )}
      </div>

      {/* Announced by screen readers; visible only when something went wrong. */}
      <p className={styles.rowMessage} role="status" aria-live="polite">
        {error ??
          (shown && !status && !pending ? (
            <span className="visually-hidden">
              Added {gameName} on {platform.name}
            </span>
          ) : null)}
      </p>
    </div>
  );
}
