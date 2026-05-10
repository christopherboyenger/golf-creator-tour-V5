"use client";

import { ChevronRight, Instagram, MessageCircle, Trophy, Youtube } from "lucide-react";
import type { Creator, SocialPlatform } from "@/lib/dashboard-types";

type CreatorCardProps = {
  creator: Creator;
  onSelect?: (creator: Creator) => void;
  variant?: "leaderboard" | "match" | "compact";
};

const tierClass = {
  standard: "bg-[#6b7280] text-white",
  premium: "bg-[#7c3aed] text-white",
  elite: "bg-[#c9a84c] text-[#071225]",
  founder: "bg-[#c9a84c] text-[#071225]"
};

export function CreatorAvatar({
  creator,
  size = "md"
}: {
  creator: Pick<Creator, "avatarTone" | "initials" | "isExempt" | "name">;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "h-10 w-10 rounded-xl text-xs",
    md: "h-14 w-14 rounded-2xl text-sm",
    lg: "h-20 w-20 rounded-[22px] text-xl"
  };

  return (
    <span
      aria-label={creator.name}
      className={`flex shrink-0 items-center justify-center border bg-gradient-to-br font-black text-white shadow-[0_8px_22px_rgba(7,18,37,0.16)] ${
        creator.avatarTone
      } ${sizeClass[size]} ${creator.isExempt ? "border-[#c9a84c]" : "border-white/50"}`}
    >
      {creator.initials}
    </span>
  );
}

export function PlatformIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === "youtube") {
    return <Youtube size={15} />;
  }

  if (platform === "instagram") {
    return <Instagram size={15} />;
  }

  return (
    <span className="flex h-[15px] w-[15px] items-center justify-center text-[10px] font-black leading-none">
      T
    </span>
  );
}

export function CreatorCard({ creator, onSelect, variant = "leaderboard" }: CreatorCardProps) {
  const isMatch = variant === "match";
  const isCompact = variant === "compact";

  return (
    <button
      className={`tap-row flex w-full items-center gap-3 rounded-2xl border border-[#d7dde8] bg-white text-left text-[#071a33] shadow-[0_8px_24px_rgba(7,18,37,0.04)] ${
        isCompact ? "px-3 py-3" : "px-4 py-4"
      }`}
      onClick={() => onSelect?.(creator)}
      type="button"
    >
      <CreatorAvatar creator={creator} size={isCompact ? "sm" : "md"} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-black">{creator.name}</span>
          <span className={`rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] ${tierClass[creator.tier]}`}>
            {creator.isExempt ? "Exempt" : creator.tier}
          </span>
        </span>
        <span className="mt-1 block truncate text-xs font-semibold text-[#8b95a7]">@{creator.handle}</span>
        <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#8b95a7]">
          <span className="text-[#c9a84c]">{creator.countryCode}</span>
          <span>{creator.location}</span>
          {isMatch && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2f8] px-2 py-1">
              <MessageCircle size={12} />
              Match ready
            </span>
          )}
        </span>
      </span>
      <span className="text-right">
        {variant === "leaderboard" ? (
          <>
            <span className="block text-base font-black text-[#071a33]">{creator.isExempt ? creator.rank : creator.points.toLocaleString()}</span>
            <span className="mt-0.5 flex items-center justify-end gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9aa4b5]">
              <Trophy size={12} />
              {creator.isExempt ? "Rank" : "pts"}
            </span>
          </>
        ) : (
          <ChevronRight size={18} className="text-[#a7b0bf]" />
        )}
      </span>
    </button>
  );
}
