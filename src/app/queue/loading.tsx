import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./queue.module.css";

/** The queue's own rows, with placeholders where the games will be. */
export default function QueueLoading() {
  return (
    <div aria-busy="true" aria-label="Loading your queue">
      <PageHeader title="Queue" meta={<Skeleton variant="text" width="6rem" />} />
      <ol className={styles.list}>
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className={styles.row}>
            <span className={styles.position} aria-hidden="true">
              {index + 1}
            </span>
            <span className={styles.handle} />
            <span className={styles.thumb} style={{ aspectRatio: "3 / 4" }}>
              <Skeleton />
            </span>
            <span className={styles.text}>
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="30%" />
            </span>
            <span />
          </li>
        ))}
      </ol>
    </div>
  );
}
