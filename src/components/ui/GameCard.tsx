import Link from "next/link";
import type { MouseEvent } from "react";
import { cx } from "@/lib/cx";
import { progressLabel, type Progress } from "@/lib/progress";
import type { Rating } from "@/lib/rating";
import { GameCover } from "./GameCover";
import { ProgressGlyph } from "./ProgressGlyph";
import { Skeleton } from "./Skeleton";
import styles from "./GameCard.module.css";

export type GameCardData = {
  title: string;
  year: number | null;
  platform: string;
  coverUrl?: string | undefined;
  progress?: Progress | undefined;
  rating?: Rating | null | undefined;
  tags?: ReadonlyArray<{ name: string }> | undefined;
};

type GameCardProps = {
  game: GameCardData;
  /** Without one the card is plain, with no hover or press state promising a link. */
  href?: string | undefined;
  /** Lets the page open the entry in place; the href still works for new tabs. */
  onClick?: ((event: MouseEvent<HTMLAnchorElement>) => void) | undefined;
  className?: string | undefined;
};

export function GameCard({ game, href, onClick, className }: GameCardProps) {
  const content = (
    <>
      <GameCover title={game.title} src={game.coverUrl} className={styles.cover} />
      <span className={styles.title}>{game.title}</span>
      <span className={styles.meta}>
        <span className={styles.facts}>
          <span className={styles.year}>{game.year ?? "TBA"}</span>
          <span className={styles.platform}>{game.platform}</span>
        </span>
        <span className={styles.personal}>
          {game.progress && (
            <span title={progressLabel[game.progress]}>
              <ProgressGlyph progress={game.progress} />
              <span className="visually-hidden">{progressLabel[game.progress]}</span>
            </span>
          )}
          {game.rating != null && (
            <span className={styles.rating} aria-label={`Rated ${game.rating} out of 10`}>
              {game.rating}
            </span>
          )}
        </span>
      </span>
      {game.tags && game.tags.length > 0 && (
        <span className={styles.tags}>
          {game.tags.map((tag) => (
            <span key={tag.name} className={styles.tag}>
              {tag.name}
            </span>
          ))}
        </span>
      )}
    </>
  );

  if (href === undefined) {
    return <div className={cx(styles.card, styles.static, className)}>{content}</div>;
  }
  return (
    <Link href={href} {...(onClick && { onClick })} className={cx(styles.card, className)}>
      {content}
    </Link>
  );
}

/** Same frame and text lines as a real card, so swapping in data moves nothing. */
export function GameCardSkeleton({ className }: { className?: string | undefined }) {
  return (
    <div className={cx(styles.card, styles.loading, className)} aria-hidden="true">
      <div className={styles.cover}>
        <Skeleton />
      </div>
      <span className={styles.title}>
        <Skeleton variant="text" width="85%" />
      </span>
      <span className={styles.meta}>
        <Skeleton variant="text" width="45%" />
      </span>
    </div>
  );
}
