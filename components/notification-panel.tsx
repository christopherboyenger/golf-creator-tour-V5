"use client";

import { Award, Bell, CheckCircle2, ChevronRight, Swords, Trophy, X, Zap } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { notifications } from "@/lib/mock-data";
import type { NotificationItem } from "@/lib/mock-data";

type NotificationPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const iconByType = {
  achievement: CheckCircle2,
  match: Swords,
  streak: Zap,
  challenge: Trophy,
  system: Award
} satisfies Record<NotificationItem["type"], typeof Bell>;

const toneByType = {
  achievement: "text-emerald-500",
  match: "text-[#c9a84c]",
  streak: "text-orange-500",
  challenge: "text-[#c9a84c]",
  system: "text-[#7b8596]"
} satisfies Record<NotificationItem["type"], string>;

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Close notifications overlay"
        className="gct-fixed fixed inset-y-0 z-50 bg-black/35"
        onClick={onClose}
        type="button"
      />
      <aside className="gct-fixed fixed inset-y-0 z-[70] overflow-y-auto bg-white text-[#071a33] shadow-sheet animate-[gctSlideIn_0.24s_ease_both]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d7dde8] bg-white px-5 pb-4 pt-[max(52px,calc(env(safe-area-inset-top)+16px))]">
          <h2 className="text-sm font-black">Notifications</h2>
          <button
            aria-label="Close notifications"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e3e8f1] text-[#7c8798]"
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </header>

        <div className="grid gap-2.5 px-4 py-4">
          {notifications.length === 0 ? (
            <EmptyState body="Match requests and tour updates will appear here." icon={Bell} title="No notifications yet" />
          ) : (
            notifications.map((notification, index) => (
              <NotificationRow index={index} key={notification.id} notification={notification} />
            ))
          )}
        </div>
      </aside>
    </>
  );
}

function NotificationRow({ index, notification }: { index: number; notification: NotificationItem }) {
  const Icon = iconByType[notification.type];

  return (
    <button
      className={`tap-row flex min-h-[74px] items-start gap-3 rounded-xl border px-4 py-3 text-left ${
        notification.read
          ? "border-[#d7dde8] bg-white"
          : "border-[#c9a84c]/25 bg-[#fff8df]"
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
      type="button"
    >
      <Icon className={`${toneByType[notification.type]} mt-1 shrink-0`} size={18} />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black text-[#071a33]">{notification.title}</span>
        <span className="mt-1 block text-[11px] leading-5 text-[#6f7a8d]">{notification.body}</span>
        <span className="mt-1 block text-[10px] font-bold text-[#c9a84c]">{notification.time}</span>
      </span>
      <ChevronRight className="mt-1 text-[#a7b0bf]" size={15} />
    </button>
  );
}
