"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationPanel } from "@/components/notification-panel";
import { SettingsDrawer } from "@/components/settings-drawer";
import { Toaster } from "@/components/toast";
import { UpgradeMembershipSheet } from "@/components/upgrade-membership-sheet";
import { createClient } from "@/lib/supabase/client";
import { emptyDashboardShellSnapshot, type DashboardShellSnapshot } from "@/lib/dashboard-types";

export function AppShell({
  children,
  shell = emptyDashboardShellSnapshot
}: {
  children: ReactNode;
  shell?: DashboardShellSnapshot;
}) {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await createClient().auth.signOut();
    } finally {
      router.push("/auth");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen">
      <div className="gct-app-frame">
        <AppHeader
          onMenuOpen={() => setSettingsOpen(true)}
          onMessagesOpen={() => router.push("/messages")}
          onNotificationsOpen={() => setNotificationsOpen(true)}
          unreadMessages={shell.unreadMessages}
          unreadNotifications={shell.unreadNotifications}
        />
        <main>{children}</main>
        <BottomNav />

        <NotificationPanel items={shell.notifications} isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        <SettingsDrawer
          isAdmin={shell.isAdmin}
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onLogout={handleLogout}
          onOpenUpgrade={() => {
            setSettingsOpen(false);
            setUpgradeOpen(true);
          }}
        />
        <UpgradeMembershipSheet isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
        <Toaster />
      </div>
    </div>
  );
}
