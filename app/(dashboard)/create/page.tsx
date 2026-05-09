import { DashboardPlaceholderPage } from "@/components/page-scaffold";
import { dashboardPages } from "@/lib/page-content";

export default function CreatePage() {
  return <DashboardPlaceholderPage page={dashboardPages.create} />;
}
