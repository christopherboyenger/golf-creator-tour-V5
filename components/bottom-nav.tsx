"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Trophy, UserRound, UsersRound } from "lucide-react";

const navItems = [
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Compete", href: "/compete", icon: Trophy },
  { label: "Create", href: "/create", icon: Camera },
  { label: "Connect", href: "/connect", icon: UsersRound }
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="gct-fixed nav-safe-bottom fixed bottom-0 z-40 border-t border-[#dce1eb] bg-white px-5 pt-2 shadow-[0_-10px_28px_rgba(7,18,37,0.08)]">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold no-underline transition ${
                active ? "text-[#071a33]" : "text-[#9aa4b5]"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span>{item.label}</span>
              <span className={`h-1 w-1 rounded-full ${active ? "bg-[#071a33]" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
