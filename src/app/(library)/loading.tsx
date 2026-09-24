import { PageHeader } from "@/components/shell/PageHeader";
import { CatalogueList, ListRowSkeleton } from "@/components/ui/ListRow";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./library.module.css";

/*
 * The title is real and only the count is pending, so the heading never moves.
 * The toolbar keeps the real one's boxes, and rows stand in for the list, the
 * layout most visits resolve to.
 */
export default function LibraryLoading() {
  return (
    <div aria-busy="true" aria-label="Loading your library">
      <PageHeader title="Library" meta={<Skeleton variant="text" width="5rem" />} />
      <div className={styles.browser}>
        <div className={styles.toolbar} aria-hidden="true">
          <div className={`${styles.textFilter} ${styles.controlSkeleton}`}>
            <Skeleton />
          </div>
          <div className={`${styles.filtersSkeleton} ${styles.controlSkeleton}`}>
            <Skeleton />
          </div>
          <div className={styles.inlineWide}>
            <div className={`${styles.sort} ${styles.controlSkeleton}`}>
              <Skeleton />
            </div>
          </div>
          <div className={styles.inlineMedium}>
            <div className={`${styles.layoutSkeleton} ${styles.controlSkeleton}`}>
              <Skeleton />
            </div>
          </div>
        </div>
        <CatalogueList>
          {Array.from({ length: 6 }, (_, index) => (
            <ListRowSkeleton key={index} />
          ))}
        </CatalogueList>
      </div>
    </div>
  );
}
