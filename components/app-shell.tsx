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
import { notifications } from "@/lib/mock-data";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="gct-app-frame">
        <AppHeader
          onMenuOpen={() => setSettingsOpen(true)}
          onMessagesOpen={() => router.push("/messages")}
          onNotificationsOpen={() => setNotificationsOpen(true)}
          unreadMessages={1}
          unreadNotifications={notifications.filter((item) => !item.read).length}
        />
        <main>{children}</main>
        <BottomNav />

        <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        <SettingsDrawer
          isAdmin
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
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
