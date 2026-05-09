import { DashboardPlaceholderPage } from "@/components/page-scaffold";
import { dashboardPages } from "@/lib/page-content";

export default function AdminPage() {
  return <DashboardPlaceholderPage page={dashboardPages.admin} />;
}
