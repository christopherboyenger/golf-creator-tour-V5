import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getDashboardShellSnapshot } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const shell = await getDashboardShellSnapshot();

  return <AppShell shell={shell}>{children}</AppShell>;
}
