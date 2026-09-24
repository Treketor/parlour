import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./game.module.css";

/** The record's frame with placeholders: cover, library, title, scores and summary. */
export default function GameLoading() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Loading the game">
      <div className={styles.side}>
        <div className={styles.cover} style={{ aspectRatio: "3 / 4" }}>
          <Skeleton />
        </div>
        <div className={styles.panel}>
          <Skeleton variant="text" width="6rem" />
          <div className={styles.skeletonBlock}>
            <Skeleton />
          </div>
        </div>
      </div>
      <div className={styles.main}>
        <div className={styles.header}>
          <div className={styles.skeletonTitle}>
            <Skeleton variant="text" width="60%" />
          </div>
          <Skeleton variant="text" width="14rem" />
        </div>
        <div className={styles.skeletonBlock}>
          <Skeleton />
        </div>
        <div className={styles.skeletonBlock}>
          <Skeleton />
        </div>
      </div>
    </div>
  );
}
