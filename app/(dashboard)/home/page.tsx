import { DashboardPlaceholderPage } from "@/components/page-scaffold";
import { dashboardPages } from "@/lib/page-content";

export default function HomePage() {
  return <DashboardPlaceholderPage page={dashboardPages.home} />;
}
