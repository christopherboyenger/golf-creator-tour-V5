"use client";

import { ChevronRight, LockKeyhole, UsersRound } from "lucide-react";
import type { Challenge } from "@/lib/mock-data";

type ChallengeCardProps = {
  challenge: Challenge;
  onSelect?: (challenge: Challenge) => void;
};

const tierClass = {
  Standard: "bg-[#6b7280] text-white",
  Premium: "bg-[#7c3aed] text-white",
  Elite: "bg-[#c9a84c] text-[#071225]",
  GCT: "bg-[#0f1b2e] text-[#c9a84c]"
};

export function ChallengeCard({ challenge, onSelect }: ChallengeCardProps) {
  const fillPercent = challenge.spots > 0 ? Math.round((challenge.filled / challenge.spots) * 100) : 0;
  const locked = challenge.tier === "Elite";

  return (
    <button
      className="tap-row w-full rounded-2xl border border-[#d7dde8] bg-white p-4 text-left text-[#071a33] shadow-[0_8px_24px_rgba(7,18,37,0.04)]"
      onClick={() => onSelect?.(challenge)}
      type="button"
    >
      <span className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-black"
          style={{
            backgroundColor: `${challenge.color}18`,
            borderColor: `${challenge.color}35`,
            color: challenge.color
          }}
        >
          {challenge.brand
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${tierClass[challenge.tier]}`}>
              {challenge.tier}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#c9a84c]">
              {challenge.points} pts
            </span>
          </span>
          <span className="mt-2 block text-sm font-black leading-5">{challenge.title}</span>
          <span className="mt-1 block text-xs font-semibold text-[#7b8596]">{challenge.brand}</span>
        </span>
        <ChevronRight size={18} className="mt-1 shrink-0 text-[#a7b0bf]" />
      </span>

      <span className="mt-4 grid grid-cols-2 gap-2">
        <span className="rounded-xl bg-[#eef2f8] px-3 py-2">
          <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#9aa4b5]">Deadline</span>
          <span className="mt-1 block text-xs font-black">{challenge.deadline}</span>
        </span>
        <span className="rounded-xl bg-[#eef2f8] px-3 py-2">
          <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#9aa4b5]">Status</span>
          <span className="mt-1 flex items-center gap-1 text-xs font-black">
            {locked && <LockKeyhole size={12} className="text-[#c9a84c]" />}
            {challenge.status}
          </span>
        </span>
      </span>

      <span className="mt-4 block">
        <span className="flex items-center justify-between text-[10px] font-bold text-[#8b95a7]">
          <span className="inline-flex items-center gap-1">
            <UsersRound size={13} />
            {challenge.filled} joined
          </span>
          {challenge.spots > 0 && <span>{challenge.spots - challenge.filled} spots left</span>}
        </span>
        {challenge.spots > 0 && (
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#dce3ef]">
            <span
              className="block h-full rounded-full bg-[#c9a84c]"
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </span>
        )}
      </span>
    </button>
  );
}
