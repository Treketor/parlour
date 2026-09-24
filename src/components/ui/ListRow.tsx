import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { progressLabel, type Progress } from "@/lib/progress";
import type { Rating } from "@/lib/rating";
import type { SortDirection, SortKey } from "@/lib/sort";
import { GameCover } from "./GameCover";
import { ProgressGlyph } from "./ProgressGlyph";
import { Skeleton } from "./Skeleton";
import { SortIcon } from "./icons";
import styles from "./ListRow.module.css";

/*
 * The catalogue list. Rows and the header share one grid, and the grid
 * responds to the list's own width (container queries), so the same list works
 * in a full page, a sidebar or a dialog.
 */

export type ListRowData = {
  title: string;
  year: number | null;
  platform: string;
  coverUrl?: string | undefined;
  progress?: Progress | undefined;
  rating?: Rating | null | undefined;
  addedAt: Date;
};

export function CatalogueList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return <div className={cx(styles.list, className)}>{children}</div>;
}

type ListRowProps = {
  game: ListRowData;
  /** Without one the row is plain text, with no hover or press state promising a link. */
  href?: string | undefined;
  /** Lets the page open the entry in place; the href still works for new tabs. */
  onClick?: ((event: MouseEvent<HTMLAnchorElement>) => void) | undefined;
  selected?: boolean;
};

export function ListRow({ game, href, onClick, selected = false }: ListRowProps) {
  const content = (
    <>
      <span className={styles.thumb}>
        <GameCover title={game.title} src={game.coverUrl} size="thumb" />
      </span>
      <span className={styles.titleCell}>
        <span className={styles.title}>{game.title}</span>
        <span className={styles.sub}>
          <span className={styles.number}>{game.year ?? "TBA"}</span>
          <span className={styles.subPlatform}>{game.platform}</span>
        </span>
      </span>
      <span className={cx(styles.cell, styles.platform)}>{game.platform}</span>
      <span className={cx(styles.cell, styles.progress)}>
        {game.progress && (
          <>
            <ProgressGlyph progress={game.progress} />
            <span className={styles.progressText}>{progressLabel[game.progress]}</span>
          </>
        )}
      </span>
      <span className={cx(styles.cell, styles.rating, styles.number)}>
        {game.rating == null ? (
          <span className={styles.empty} aria-label="Not rated">
            &ndash;
          </span>
        ) : (
          <span aria-label={`Rated ${game.rating} out of 10`}>{game.rating}</span>
        )}
      </span>
      <span className={cx(styles.cell, styles.added, styles.number)}>
        <time dateTime={game.addedAt.toISOString()}>{formatDate(game.addedAt)}</time>
      </span>
    </>
  );

  if (href === undefined) return <div className={cx(styles.row, styles.static)}>{content}</div>;
  return (
    <Link
      href={href}
      {...(onClick && { onClick })}
      className={styles.row}
      aria-current={selected ? "true" : undefined}
    >
      {content}
    </Link>
  );
}

export function ListRowSkeleton() {
  return (
    <div className={cx(styles.row, styles.loading)} aria-hidden="true">
      <span className={styles.thumb}>
        <span className={styles.thumbSkeleton}>
          <Skeleton />
        </span>
      </span>
      <span className={styles.titleCell}>
        <span className={styles.title}>
          <Skeleton variant="text" width="60%" />
        </span>
        <span className={styles.sub}>
          <Skeleton variant="text" width="5rem" />
        </span>
      </span>
      <span className={cx(styles.cell, styles.platform)}>
        <Skeleton variant="text" width="4rem" />
      </span>
      <span className={cx(styles.cell, styles.progress)}>
        <Skeleton variant="text" width="5rem" />
      </span>
      <span className={cx(styles.cell, styles.rating)}>
        <Skeleton variant="text" width="1.25rem" />
      </span>
      <span className={cx(styles.cell, styles.added)}>
        <Skeleton variant="text" width="5.5rem" />
      </span>
    </div>
  );
}

export type SortState = { key: SortKey; direction: SortDirection };

type ListHeaderProps = {
  sort: SortState;
  onSort: (key: SortKey) => void;
};

const COLUMNS: Array<{ key: SortKey; label: string; className: string | undefined }> = [
  { key: "title", label: "Title", className: styles.titleHead },
  { key: "platform", label: "Platform", className: styles.platform },
  { key: "progress", label: "Progress", className: styles.progress },
  { key: "rating", label: "Rating", className: styles.rating },
  { key: "added", label: "Added", className: styles.added },
];

export function ListHeader({ sort, onSort }: ListHeaderProps) {
  return (
    <div className={cx(styles.row, styles.header)}>
      {COLUMNS.map((column) => {
        const active = sort.key === column.key;
        const nextDirection = active && sort.direction === "asc" ? "descending" : "ascending";
        return (
          <button
            key={column.key}
            type="button"
            className={cx(styles.sortButton, column.className)}
            data-active={active || undefined}
            aria-label={`Sort by ${column.label.toLowerCase()}, ${nextDirection}`}
            onClick={() => onSort(column.key)}
          >
            <span>{column.label}</span>
            {active && <SortIcon direction={sort.direction} width={12} height={12} />}
          </button>
        );
      })}
    </div>
  );
}
