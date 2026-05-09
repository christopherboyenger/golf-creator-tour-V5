"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Home,
  LogOut,
  Settings,
  Shield,
  Trophy,
  X
} from "lucide-react";
import { useState } from "react";

type SettingsDrawerProps = {
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenUpgrade: () => void;
};

const drawerItems = [
  {
    label: "GCO 2026",
    description: "Event details & updates",
    href: "/home",
    icon: Home
  },
  {
    label: "How to Compete",
    description: "Rules, scoring & participation",
    href: "/how-to-compete",
    icon: Trophy
  },
  {
    label: "Referral Program",
    description: "Invite & earn rewards",
    href: "/referrals",
    icon: CircleDollarSign
  },
  {
    label: "Settings",
    description: "Account, language & help",
    href: "/settings",
    icon: Settings
  }
];

export function SettingsDrawer({ isAdmin, isOpen, onClose, onOpenUpgrade }: SettingsDrawerProps) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Close menu overlay"
        className="gct-fixed fixed inset-y-0 z-50 bg-black/40"
        onClick={onClose}
        type="button"
      />
      <aside className="gct-fixed fixed inset-y-0 z-[60] overflow-y-auto bg-white text-[#071a33] shadow-sheet">
        <div className="flex min-h-full flex-col px-6 pb-6 pt-16">
          <header className="flex items-center justify-between border-b border-[#d7dde8] pb-7">
            <h2 className="text-2xl font-black">Menu</h2>
            <button
              aria-label="Close menu"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e3e8f1] text-[#7c8798]"
              onClick={onClose}
              type="button"
            >
              <X size={20} />
            </button>
          </header>

          <div className="mt-6 grid gap-3">
            <button
              className="flex min-h-[82px] items-center gap-4 rounded-2xl bg-[#13233f] px-5 text-left text-white shadow-lift"
              onClick={onOpenUpgrade}
              type="button"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#c9a84c] text-[#071225]">
                <Crown size={23} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black text-[#d5b64f]">Upgrade Membership</span>
                <span className="mt-1 block text-sm font-medium text-white/45">Unlock premium features</span>
              </span>
              <ChevronRight size={18} className="text-[#d5b64f]" />
            </button>

            {drawerItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className="flex min-h-[82px] items-center gap-4 rounded-2xl border border-[#d7dde8] bg-[#e4e9f2] px-5 text-left no-underline"
                  href={item.href}
                  key={item.href}
                  onClick={onClose}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#dbe2ed] text-[#8d98aa]">
                    {item.label === "How to Compete" ? <BookOpen size={22} /> : <Icon size={22} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-black">{item.label}</span>
                    <span className="mt-1 block text-sm font-medium text-[#6d7789]">{item.description}</span>
                  </span>
                  <ChevronRight size={18} className="text-[#7f899a]" />
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                className="flex min-h-[82px] items-center gap-4 rounded-2xl bg-[#13233f] px-5 text-left text-white no-underline shadow-lift"
                href="/admin"
                onClick={onClose}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#c9a84c]/45 bg-white/5 text-[#c9a84c]">
                  <Shield size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black text-[#d5b64f]">Admin Dashboard</span>
                  <span className="mt-1 block text-sm font-medium text-white/45">Manage the tour</span>
                </span>
                <ChevronRight size={18} className="text-[#d5b64f]" />
              </Link>
            )}
          </div>

          <div className="mt-auto border-t border-[#d7dde8] pt-5">
            {confirmLogout ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-sm font-black text-[#071a33]">Log out of Golf Creator Tour?</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    className="rounded-xl border border-[#d7dde8] bg-white py-3 text-sm font-black text-[#6d7789]"
                    onClick={() => setConfirmLogout(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-xl bg-red-500 py-3 text-sm font-black text-white"
                    onClick={() => setConfirmLogout(false)}
                    type="button"
                  >
                    Yes, Log Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-base font-black text-red-500"
                onClick={() => setConfirmLogout(true)}
                type="button"
              >
                <LogOut size={18} />
                Log Out
              </button>
            )}
            <p className="mt-6 text-center text-xs font-semibold text-[#9aa4b5]">
              The Golf Creator Tour - v5.0 scaffold
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
