import { PageHeader } from "@/components/shell/PageHeader";
import { CatalogueList, ListRowSkeleton } from "@/components/ui/ListRow";
import { Skeleton } from "@/components/ui/Skeleton";

/*
 * The title is real and only the count is pending, so the heading never moves.
 * Rows stand in for the list, the shape most visits will resolve to.
 */
export default function LibraryLoading() {
  return (
    <div aria-busy="true" aria-label="Loading your library">
      <PageHeader title="Library" meta={<Skeleton variant="text" width="5rem" />} />
      <CatalogueList>
        {Array.from({ length: 6 }, (_, index) => (
          <ListRowSkeleton key={index} />
        ))}
      </CatalogueList>
    </div>
  );
}
