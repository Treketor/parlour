"use client";

import { useMemo, useState, useTransition } from "react";
import type { CatalogueGame } from "@/lib/catalogue";
import { entryKey } from "@/lib/data/add-entry";
import type { EntryStatus } from "@/lib/data/library";
import type { Ownership } from "@/lib/ownership";
import { orderPlatforms } from "@/lib/platforms";
import { addToLibrary, changeOwnership } from "./actions";

/** Entry ids the server has not confirmed yet: the entry is shown but cannot be edited. */
export const PENDING = "pending";

/**
 * What the results remember across a new sort or layout, which remounts every
 * card: games added on this page and platforms picked by hand. Kept above the
 * cards so an add is not forgotten the moment the grid is reordered.
 */
export type SearchSession = {
  entries: Readonly<Record<string, EntryStatus>>;
  setEntry: (key: string, next: EntryStatus | undefined) => void;
  choices: Readonly<Record<number, number>>;
  choose: (gameId: number, platformId: number) => void;
};

export function useSearchSession(statuses: Readonly<Record<string, EntryStatus>>): SearchSession {
  const [entries, setEntries] = useState<Record<string, EntryStatus>>(() => ({ ...statuses }));
  const [choices, setChoices] = useState<Record<number, number>>({});
  return {
    entries,
    setEntry: (key, next) =>
      setEntries((current) => {
        const copy = { ...current };
        if (next) copy[key] = next;
        else delete copy[key];
        return copy;
      }),
    choices,
    choose: (gameId, platformId) => setChoices((current) => ({ ...current, [gameId]: platformId })),
  };
}

/**
 * One search result's library state: which platform is picked, whether the
 * game is in the library on it, and adding or changing ownership. Both
 * happen on screen at once and are confirmed by the server behind them.
 * Shared by the grid card and the list row so they cannot drift apart.
 */
export function useSearchEntry(
  game: CatalogueGame,
  session: SearchSession,
  habits: Readonly<Record<number, number>>,
) {
  const { entries, setEntry } = session;
  const platforms = useMemo(() => orderPlatforms(game.platforms, habits), [game, habits]);
  const inLibrary = (id: number) => entries[entryKey(game.id, id)] !== undefined;
  // A platform picked by hand, then one already in your library, then the likeliest one.
  const platformId =
    session.choices[game.id] ??
    platforms.find((platform) => inLibrary(platform.id))?.id ??
    platforms[0]?.id ??
    null;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const key = platformId === null ? null : entryKey(game.id, platformId);
  const entry = key ? entries[key] : undefined;
  const platform = platforms.find((item) => item.id === platformId);
  const alsoOn = platforms.filter((item) => item.id !== platformId && inLibrary(item.id));

  function choosePlatform(id: number) {
    setError(null);
    session.choose(game.id, id);
  }

  function add(ownership: Ownership) {
    if (!key || platformId === null) return;
    const addedKey = key;
    setError(null);
    setEntry(addedKey, { entryId: PENDING, ownership, progress: "want_to_play" });

    startTransition(async () => {
      const result = await addToLibrary({ gameId: game.id, platformId, ownership });
      if (result.status === "added" || result.status === "exists") {
        setEntry(addedKey, { entryId: result.entryId, ownership, progress: "want_to_play" });
        return;
      }
      setEntry(addedKey, undefined);
      setError(
        result.status === "signed-out"
          ? "Your session has ended. Sign in again to add games."
          : result.message,
      );
    });
  }

  function change(ownership: Ownership) {
    if (!key || !entry || entry.entryId === PENDING || ownership === entry.ownership) return;
    const changedKey = key;
    const previous = entry;
    setError(null);
    setEntry(changedKey, { ...entry, ownership });

    startTransition(async () => {
      const result = await changeOwnership({ entryId: previous.entryId, ownership });
      if (result.status === "changed") return;
      setEntry(changedKey, previous);
      setError(result.message);
    });
  }

  return {
    platforms,
    platform,
    platformId,
    choosePlatform,
    inLibrary,
    alsoOn,
    entry,
    add,
    change,
    error,
    pending,
  };
}

export type SearchEntryState = ReturnType<typeof useSearchEntry>;
