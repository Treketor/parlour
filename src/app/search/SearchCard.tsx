"use client";

import { useState, useTransition } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { GameCover } from "@/components/ui/GameCover";
import { CheckIcon } from "@/components/ui/icons";
import { MenuSelect } from "@/components/ui/MenuSelect";
import { Select } from "@/components/ui/Select";
import type { CatalogueGame } from "@/lib/catalogue";
import { entryKey } from "@/lib/data/add-entry";
import type { EntryStatus } from "@/lib/data/library";
import { formatDate } from "@/lib/format";
import { igdbImageUrl } from "@/lib/igdb-images";
import { OWNERSHIP_STATES, ownershipLabel, type Ownership } from "@/lib/ownership";
import { orderPlatforms } from "@/lib/platforms";
import { combinedScore, compactCount, scoreTier } from "@/lib/scores";
import { addToLibrary, changeOwnership } from "./actions";
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

type SearchCardProps = {
  game: CatalogueGame;
  statuses: Readonly<Record<string, EntryStatus>>;
  /** Entries per platform in your library: the likeliest platform is picked first. */
  habits: Readonly<Record<number, number>>;
  signedIn: boolean;
  returnTo: string;
};

/** Entry ids the server has not confirmed yet: the entry is shown but cannot be edited. */
const PENDING = "pending";

/**
 * One game in the results grid. Pick the platform you play it on, then add
 * it or change its ownership; both happen on screen at once and are
 * confirmed by the server behind them.
 */
export function SearchCard({ game, statuses, habits, signedIn, returnTo }: SearchCardProps) {
  const [platforms] = useState(() => orderPlatforms(game.platforms, habits));
  const [entries, setEntries] = useState<Record<string, EntryStatus>>(() => ({ ...statuses }));
  // A platform already in your library first, otherwise the likeliest one.
  const [platformId, setPlatformId] = useState<number | null>(
    () =>
      platforms.find((platform) => statuses[entryKey(game.id, platform.id)])?.id ??
      platforms[0]?.id ??
      null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const key = platformId === null ? null : entryKey(game.id, platformId);
  const entry = key ? entries[key] : undefined;
  const platform = platforms.find((item) => item.id === platformId);
  const alsoOn = platforms.filter(
    (item) => item.id !== platformId && entries[entryKey(game.id, item.id)],
  );
  const score = combinedScore(
    { rating: game.igdbRating, count: game.igdbRatingCount },
    { rating: game.criticRating, count: game.criticRatingCount },
  );

  function setEntry(entryKeyValue: string, next: EntryStatus | undefined) {
    setEntries((current) => {
      const copy = { ...current };
      if (next) copy[entryKeyValue] = next;
      else delete copy[entryKeyValue];
      return copy;
    });
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

  const releaseLabel = game.firstReleaseDate
    ? formatDate(new Date(game.firstReleaseDate))
    : "Release date TBA";

  return (
    <article className={styles.card} aria-labelledby={`game-${game.id}`}>
      <GameCover
        title={game.name}
        src={game.coverImageId ? igdbImageUrl(game.coverImageId, "cover_big", true) : undefined}
        className={styles.cardCover}
      />

      <div className={styles.cardText}>
        <h3 id={`game-${game.id}`} className={styles.cardTitle}>
          {game.name}
        </h3>
        <p className={styles.cardMeta}>
          <span className={styles.release}>{releaseLabel}</span>
          {score && (
            <span
              className={styles.score}
              data-tier={scoreTier(score.value)}
              title={`Player and critic score from ${score.count.toLocaleString("en-GB")} ratings on IGDB`}
            >
              <span aria-hidden="true">
                <strong>{score.value}</strong>{" "}
                <span className={styles.scoreCount}>({compactCount(score.count)})</span>
              </span>
              <span className="visually-hidden">
                Scored {score.value} from {score.count} ratings
              </span>
            </span>
          )}
        </p>
      </div>

      <div className={styles.cardControls}>
        {platforms.length > 1 ? (
          <Select
            size="sm"
            hideLabel
            label={`Platform for ${game.name}`}
            value={platformId ?? ""}
            onChange={(event) => {
              setError(null);
              setPlatformId(Number(event.target.value));
            }}
          >
            {platforms.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {entries[entryKey(game.id, item.id)] ? " (in library)" : ""}
              </option>
            ))}
          </Select>
        ) : (
          <p className={styles.singlePlatform}>{platform?.name ?? "No platforms listed"}</p>
        )}

        {platform &&
          (!signedIn ? (
            <ButtonLink size="sm" href={`/sign-in?next=${encodeURIComponent(returnTo)}`}>
              Sign in to add
            </ButtonLink>
          ) : entry ? (
            <MenuSelect
              size="sm"
              fullWidth
              label={`Ownership of ${game.name} on ${platform.name}`}
              icon={<CheckIcon width={12} height={12} className={styles.addedTick} />}
              options={ownershipOptions}
              value={entry.ownership}
              onChange={change}
              disabled={entry.entryId === PENDING}
              className={styles.addedMenu}
            />
          ) : (
            <MenuSelect
              action
              size="sm"
              fullWidth
              label={`Add ${game.name} on ${platform.name}`}
              placeholder="Add to library"
              options={ownershipOptions}
              value={null}
              onChange={add}
            />
          ))}

        {alsoOn.length > 0 && (
          <p className={styles.alsoOn}>
            Also in your library on {alsoOn.map((item) => item.name).join(", ")}
          </p>
        )}

        <p
          className={styles.cardError}
          role="status"
          aria-live="polite"
          data-pending={pending || undefined}
        >
          {error}
        </p>
      </div>
    </article>
  );
}
