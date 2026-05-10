import { DashboardPlaceholderPage } from "@/components/page-scaffold";
import { getDashboardSnapshot } from "@/lib/dashboard-data";
import { dashboardPages } from "@/lib/page-content";

export default async function CreatePage() {
  const data = await getDashboardSnapshot();

  return <DashboardPlaceholderPage data={data} page={dashboardPages.create} />;
}
