import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/feedback";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return <><PageHeader title={title} description={description} /><EmptyState title={`${title} are coming soon`} description="This section is ready for its next implementation phase. No live data is connected yet." /></>;
}
