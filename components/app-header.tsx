"use client";

import type { ReactNode } from "react";
import { Bell, Menu, Send } from "lucide-react";
import { GctMark } from "@/components/gct-mark";

type AppHeaderProps = {
  unreadMessages: number;
  unreadNotifications: number;
  onMenuOpen: () => void;
  onMessagesOpen: () => void;
  onNotificationsOpen: () => void;
};

export function AppHeader({
  unreadMessages,
  unreadNotifications,
  onMenuOpen,
  onMessagesOpen,
  onNotificationsOpen
}: AppHeaderProps) {
  return (
    <header className="relative bg-[linear-gradient(180deg,#0f1b2e_0%,#162340_100%)] px-6 pb-2 pt-[max(52px,calc(env(safe-area-inset-top)+22px))] text-white">
      <div className="relative flex min-h-[78px] items-center justify-center">
        <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <HeaderButton
            badge={unreadNotifications}
            label="Open notifications"
            onClick={onNotificationsOpen}
          >
            <Bell size={25} strokeWidth={2} />
          </HeaderButton>
          <HeaderButton badge={unreadMessages} label="Open messages" onClick={onMessagesOpen}>
            <Send size={24} strokeWidth={2} />
          </HeaderButton>
        </div>

        <div className="pointer-events-none flex items-center justify-center">
          <GctMark size="md" />
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <HeaderButton label="Open menu" onClick={onMenuOpen}>
            <Menu size={27} strokeWidth={2.2} />
          </HeaderButton>
        </div>
      </div>
    </header>
  );
}

function HeaderButton({
  badge,
  children,
  label,
  onClick
}: {
  badge?: number;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-white/[0.065] text-white/65 shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/60"
      onClick={onClick}
      type="button"
    >
      {children}
      {!!badge && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0f1b2e] bg-red-500 px-1 text-[10px] font-black text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
