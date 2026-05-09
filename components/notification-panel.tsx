"use client";

import { AlertTriangle, CheckCircle2, ChevronRight, Inbox, Loader2, Trophy, X, Zap } from "lucide-react";

type NotificationPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const notifications = [
  {
    title: "Achievement Unlocked: Challenge Accepted",
    body: "Your L.A.B. Putter Challenge submission was approved.",
    time: "May 7, 11:21 PM",
    icon: CheckCircle2,
    tone: "text-emerald-500"
  },
  {
    title: "Match Accepted",
    body: "Epiphany Price accepted your match challenge.",
    time: "May 6, 11:06 AM",
    icon: Trophy,
    tone: "text-[#c9a84c]"
  },
  {
    title: "7-Day Streak",
    body: "You have logged in 7 days in a row. Keep going.",
    time: "May 4, 08:07 PM",
    icon: Zap,
    tone: "text-orange-500"
  }
];

const coverage = [
  { label: "Loading", icon: Loader2, text: "Panel skeleton reserved", className: "animate-[gctSpin_1s_linear_infinite]" },
  { label: "Empty", icon: Inbox, text: "No notifications yet", className: "" },
  { label: "Error", icon: AlertTriangle, text: "Retry state reserved", className: "" },
  { label: "Success", icon: CheckCircle2, text: "Mock notifications loaded", className: "" }
];

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
      <aside className="gct-fixed fixed inset-y-0 z-[70] overflow-y-auto bg-white text-[#071a33] shadow-sheet">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d7dde8] bg-white px-5 pb-4 pt-14">
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

        <div className="grid gap-3 px-4 py-4">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <button
                className="flex min-h-[82px] items-start gap-3 rounded-2xl border border-[#d7dde8] bg-white px-4 py-3 text-left shadow-[0_8px_24px_rgba(7,18,37,0.04)]"
                key={notification.title}
                type="button"
              >
                <Icon className={`${notification.tone} mt-1 shrink-0`} size={19} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black text-[#071a33]">{notification.title}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-[#6f7a8d]">{notification.body}</span>
                  <span className="mt-1 block text-[10px] font-bold text-[#c9a84c]">{notification.time}</span>
                </span>
                <ChevronRight className="mt-1 text-[#a7b0bf]" size={15} />
              </button>
            );
          })}
        </div>

        <section className="px-4 pb-8">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#9ca6b7]">
            State coverage
          </p>
          <div className="grid gap-2">
            {coverage.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-[#d7dde8] bg-[#f7f9fc] px-4 py-3"
                  key={item.label}
                >
                  <Icon className={`text-[#7b8596] ${item.className}`} size={18} />
                  <div>
                    <p className="text-xs font-black">{item.label}</p>
                    <p className="mt-0.5 text-[11px] text-[#7b8596]">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </>
  );
}
