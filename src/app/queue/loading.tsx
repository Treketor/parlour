import { PageHeader } from "@/components/shell/PageHeader";
import { CatalogueList, ListRowSkeleton } from "@/components/ui/ListRow";

export default function QueueLoading() {
  return (
    <div aria-busy="true" aria-label="Loading your queue">
      <PageHeader title="Queue" meta="What you mean to play next, in order" />
      <CatalogueList>
        {Array.from({ length: 4 }, (_, index) => (
          <ListRowSkeleton key={index} />
        ))}
      </CatalogueList>
    </div>
  );
}
