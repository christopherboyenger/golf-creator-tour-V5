import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "light" | "dark" | "gold";
};

export function StatCard({ detail, icon, label, tone = "light", value }: StatCardProps) {
  const dark = tone === "dark";
  const gold = tone === "gold";

  return (
    <article
      className={`min-h-[82px] rounded-2xl border px-4 py-3 ${
        dark
          ? "border-white/10 bg-white/[0.04] text-white"
          : gold
            ? "border-[#c9a84c]/35 bg-[#fff8df] text-[#071a33]"
            : "border-[#d7dde8] bg-white text-[#071a33]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-[10px] font-black uppercase tracking-[0.16em] ${
            dark ? "text-white/35" : gold ? "text-[#9b7a20]" : "text-[#9aa4b5]"
          }`}
        >
          {label}
        </p>
        {icon && <span className={dark ? "text-white/45" : "text-[#9aa4b5]"}>{icon}</span>}
      </div>
      <div className={`mt-2 text-2xl font-black ${gold ? "text-[#c9a84c]" : ""}`}>{value}</div>
      {detail && <p className={`mt-1 text-[11px] ${dark ? "text-white/40" : "text-[#7b8596]"}`}>{detail}</p>}
    </article>
  );
}
