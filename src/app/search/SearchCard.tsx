"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { GameCover } from "@/components/ui/GameCover";
import { CheckIcon } from "@/components/ui/icons";
import { MenuSelect } from "@/components/ui/MenuSelect";
import { Select } from "@/components/ui/Select";
import type { CatalogueGame } from "@/lib/catalogue";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { igdbImageUrl } from "@/lib/igdb-images";
import { ownershipFits } from "@/lib/data/edit-entry";
import { OWNERSHIP_STATES, ownershipLabel } from "@/lib/ownership";
import { combinedScore, compactCount, scoreTier } from "@/lib/scores";
import {
  PENDING,
  useSearchEntry,
  type SearchEntryState,
  type SearchSession,
} from "./useSearchEntry";
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

export type SearchResultProps = {
  game: CatalogueGame;
  session: SearchSession;
  /** Entries per platform in your library: the likeliest platform is picked first. */
  habits: Readonly<Record<number, number>>;
  signedIn: boolean;
  returnTo: string;
};

/** One game in the results grid: cover, title and facts, then the controls. */
export function SearchCard(props: SearchResultProps) {
  const { game } = props;
  const state = useSearchEntry(game, props.session, props.habits);

  return (
    <article className={styles.card} aria-labelledby={`game-${game.id}`}>
      <CoverLink game={game} className={styles.cardCover}>
        <GameCover
          title={game.name}
          src={game.coverImageId ? igdbImageUrl(game.coverImageId, "cover_big", true) : undefined}
        />
      </CoverLink>
      <div className={styles.cardText}>
        <h3 id={`game-${game.id}`} className={styles.cardTitle}>
          <Link href={`/games/${game.slug}`} className={styles.titleLink}>
            {game.name}
          </Link>
        </h3>
        <GameFacts game={game} />
      </div>
      <SearchControls {...props} state={state} />
    </article>
  );
}

/** One game in the results list: a small cover and the text on the left, the controls beside it. */
export function SearchRow(props: SearchResultProps) {
  const { game } = props;
  const state = useSearchEntry(game, props.session, props.habits);

  return (
    <article className={styles.row} aria-labelledby={`game-${game.id}`}>
      <CoverLink game={game} className={styles.rowCover}>
        <GameCover
          title={game.name}
          src={game.coverImageId ? igdbImageUrl(game.coverImageId, "cover_big") : undefined}
        />
      </CoverLink>
      <div className={styles.rowText}>
        <h3 id={`game-${game.id}`} className={styles.rowTitle}>
          <Link href={`/games/${game.slug}`} className={styles.titleLink}>
            {game.name}
          </Link>
        </h3>
        <GameFacts game={game} />
      </div>
      <SearchControls {...props} state={state} className={styles.rowControls} />
    </article>
  );
}

/**
 * The cover also opens the game page, for a pointer. Keyboards and screen
 * readers get one stop per game, the title, rather than two identical links.
 */
function CoverLink({
  game,
  className,
  children,
}: {
  game: CatalogueGame;
  className: string | undefined;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className={cx(styles.coverLink, className)}
      tabIndex={-1}
      aria-hidden="true"
    >
      {children}
    </Link>
  );
}

/** Release date and the combined score, with how many ratings it rests on. */
function GameFacts({ game }: { game: CatalogueGame }) {
  const score = combinedScore(
    { rating: game.igdbRating, count: game.igdbRatingCount },
    { rating: game.criticRating, count: game.criticRatingCount },
  );
  const releaseLabel = game.firstReleaseDate
    ? formatDate(new Date(game.firstReleaseDate))
    : "Release date TBA";

  return (
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
  );
}

export type SearchControlsProps = SearchResultProps & {
  state: SearchEntryState;
  /** The "Also in your library on" note; off where the entries are listed anyway. */
  showAlsoOn?: boolean;
  className?: string | undefined;
};

/** Pick the platform, then add the game or change its ownership there. */
export function SearchControls({
  game,
  signedIn,
  returnTo,
  state,
  showAlsoOn = true,
  className,
}: SearchControlsProps) {
  const { platforms, platform, entry } = state;

  return (
    <div className={cx(styles.controls, className)}>
      {platforms.length > 1 ? (
        <Select
          size="sm"
          hideLabel
          label={`Platform for ${game.name}`}
          options={platforms.map((item) => ({
            value: String(item.id),
            label: item.name,
            ...(state.inLibrary(item.id) && { description: "In your library" }),
          }))}
          value={state.platformId === null ? null : String(state.platformId)}
          onChange={(value) => state.choosePlatform(Number(value))}
          className={styles.platformPicker}
        />
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
            strong
            align="end"
            label={`Ownership of ${game.name} on ${platform.name}`}
            icon={<CheckIcon width={12} height={12} className={styles.addedTick} />}
            options={ownershipOptions.map((option) =>
              ownershipFits(option.value, entry.progress)
                ? option
                : { ...option, disabled: true, description: "You have started it" },
            )}
            value={entry.ownership}
            onChange={state.change}
            disabled={entry.entryId === PENDING}
            className={styles.addedMenu}
          />
        ) : (
          <MenuSelect
            action
            size="sm"
            fullWidth
            align="end"
            label={`Add ${game.name} on ${platform.name}`}
            placeholder="Add to library"
            options={ownershipOptions}
            value={null}
            onChange={state.add}
          />
        ))}

      {showAlsoOn && state.alsoOn.length > 0 && (
        <p className={styles.alsoOn}>
          Also in your library on {state.alsoOn.map((item) => item.name).join(", ")}
        </p>
      )}

      <p
        className={styles.cardError}
        role="status"
        aria-live="polite"
        data-pending={state.pending || undefined}
      >
        {state.error}
      </p>
    </div>
  );
}
