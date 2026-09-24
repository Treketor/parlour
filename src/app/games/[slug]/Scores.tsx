import { ExternalIcon } from "@/components/ui/icons";
import type { CatalogueGame } from "@/lib/catalogue";
import { criticSearchLink, type OutboundLink } from "@/lib/game-detail";
import { MIN_CRITIC_REVIEWS, MIN_RATINGS, scoreTier, sourceScore } from "@/lib/scores";
import styles from "./game.module.css";

type ScoreProps = {
  label: string;
  value: number | null;
  count: number;
  noun: string;
  /** Where to look instead when this source has too little to show. */
  elsewhere?: OutboundLink;
};

/**
 * Players and critics side by side, never blended here: on its own page a
 * game can show both, each with what it rests on. A score from too few
 * ratings is withheld rather than shown big (DECISIONS.md 030).
 */
export function Scores({ game }: { game: CatalogueGame }) {
  return (
    <dl className={styles.scores}>
      <Score
        label="Players"
        value={sourceScore(game.igdbRating, game.igdbRatingCount, MIN_RATINGS)}
        count={game.igdbRatingCount}
        noun="rating"
      />
      <Score
        label="Critics"
        value={sourceScore(game.criticRating, game.criticRatingCount, MIN_CRITIC_REVIEWS)}
        count={game.criticRatingCount}
        noun="review"
        elsewhere={criticSearchLink(game.name)}
      />
    </dl>
  );
}

function Score({ label, value, count, noun, elsewhere }: ScoreProps) {
  const counted = `${count.toLocaleString("en-GB")} ${count === 1 ? noun : `${noun}s`}`;
  // Say where the gap comes from: IGDB is the source, and it can be thin.
  const basis =
    count === 0
      ? `No ${noun}s on IGDB`
      : value === null
        ? `Only ${counted} on IGDB`
        : `From ${counted}`;

  return (
    <div className={styles.score}>
      <dt className={styles.scoreLabel}>{label}</dt>
      <dd className={styles.scoreValue} data-tier={value === null ? undefined : scoreTier(value)}>
        {value ?? "No score"}
      </dd>
      <dd className={styles.scoreCount}>{basis}</dd>
      {value === null && elsewhere && (
        <dd>
          <a
            href={elsewhere.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.scoreElsewhere}
          >
            {elsewhere.label}
            <ExternalIcon width={12} height={12} />
            <span className="visually-hidden">(opens in a new tab)</span>
          </a>
        </dd>
      )}
    </div>
  );
}
