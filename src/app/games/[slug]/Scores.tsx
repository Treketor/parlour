import { ExternalIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ExternalScore } from "@/lib/external-scores";
import { criticSearchLink, type GameDetail } from "@/lib/game-detail";
import { scoreBoard, type BoardScore, type ScoreColumn } from "@/lib/score-board";
import { scoreTier } from "@/lib/scores";
import { getScoreService } from "@/server/scores";
import styles from "./game.module.css";

type GameScoresProps = { game: GameDetail; released: boolean };

/**
 * Critics and players, each led by the most credible source with something
 * to say, the rest listed beneath with what they rest on (DECISIONS.md 042).
 * Streams in after the rest of the page: outside sources can be slow, and a
 * failing one only means fewer scores, never a broken page.
 */
export async function GameScores({ game, released }: GameScoresProps) {
  let external: ExternalScore[] = [];
  try {
    external = await getScoreService().scoresFor({
      id: game.id,
      name: game.name,
      slug: game.slug,
      firstReleaseDate: game.firstReleaseDate,
      steamAppIds: game.externalIds.filter((id) => id.source === "steam").map((id) => id.uid),
    });
  } catch (error) {
    console.error("Outside scores could not be read", error);
  }

  const board = scoreBoard(game, external);
  const sources = new Set(external.map((score) => score.source));
  const critics = criticSearchLink(game.name);

  return (
    <section className={styles.scores} aria-label="Scores">
      <Column
        title="Critics"
        column={board.critics}
        empty={released ? "No critic score yet" : "Not out yet"}
        elsewhere={
          released ? <OutLink href={critics.href}>Look for reviews on Metacritic</OutLink> : null
        }
      />
      <Column
        title="Players"
        column={board.players}
        empty={released ? "No player score yet" : "Not out yet"}
        elsewhere={null}
      />
      {(board.critics.primary || board.players.primary) && (
        <p className={styles.scoreCredits}>
          {/* RAWG's terms ask for a live link wherever its data is shown. */}
          {(sources.has("metacritic") || sources.has("rawg")) && (
            <>
              Metacritic and RAWG scores via <OutLink href="https://rawg.io">RAWG</OutLink>.{" "}
            </>
          )}
          {sources.has("steam") && "Steam reviews from the Steam store. "}
          Other scores from IGDB.
        </p>
      )}
    </section>
  );
}

type ColumnProps = {
  title: string;
  column: ScoreColumn;
  empty: string;
  elsewhere: React.ReactNode;
};

function Column({ title, column, empty, elsewhere }: ColumnProps) {
  return (
    <div className={styles.scoreColumn}>
      <h2 className={styles.scoreLabel}>{title}</h2>
      {column.primary ? (
        <Primary score={column.primary} />
      ) : (
        <div className={styles.scoreEmpty}>
          <p>{empty}</p>
          {elsewhere}
        </div>
      )}
      {column.others.length > 0 && (
        <dl className={styles.scoreOthers}>
          {column.others.map((score) => (
            <div key={score.source} className={styles.scoreOther}>
              <dt>
                {score.url ? <OutLink href={score.url}>{score.source}</OutLink> : score.source}
              </dt>
              <dd className={styles.scoreOtherValue} data-tier={scoreTier(score.percent)}>
                {score.value}
              </dd>
              <dd className={styles.scoreOtherBasis}>{score.basis}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function Primary({ score }: { score: BoardScore }) {
  return (
    <div className={styles.scorePrimary}>
      <p className={styles.scoreValue} data-tier={scoreTier(score.percent)}>
        {score.value}
      </p>
      <p className={styles.scoreSource}>
        {score.url ? <OutLink href={score.url}>{score.source}</OutLink> : score.source}
      </p>
      <p className={styles.scoreCount}>{score.basis}</p>
    </div>
  );
}

function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.scoreLink}>
      {children}
      <ExternalIcon width={12} height={12} />
      <span className="visually-hidden">(opens in a new tab)</span>
    </a>
  );
}

/** The same two columns while the outside sources answer. */
export function GameScoresSkeleton() {
  return (
    <div className={styles.scores} aria-busy="true" aria-label="Loading scores">
      {["Critics", "Players"].map((title) => (
        <div key={title} className={styles.scoreColumn}>
          <p className={styles.scoreLabel}>{title}</p>
          <div className={styles.scorePrimary}>
            <p className={styles.scoreValue}>
              <Skeleton variant="text" width="3.5rem" />
            </p>
            <p className={styles.scoreSource}>
              <Skeleton variant="text" width="5rem" />
            </p>
            <p className={styles.scoreCount}>
              <Skeleton variant="text" width="8rem" />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
