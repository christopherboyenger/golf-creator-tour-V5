"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ExternalLink,
  Flag,
  MapPin,
  MessageCircle,
  Shield,
  Swords,
  Trophy
} from "lucide-react";
import { CreatorAvatar, PlatformIcon } from "@/components/creator-card";
import { ModalSheet } from "@/components/modal-sheet";
import { StatCard } from "@/components/stat-card";
import { toast } from "@/components/toast";
import { TourCard } from "@/components/tour-card";
import type { Creator } from "@/lib/mock-data";

type CreatorProfileSheetProps = {
  creator: Creator | null;
  isOpen: boolean;
  onClose: () => void;
};

export function CreatorProfileSheet({ creator, isOpen, onClose }: CreatorProfileSheetProps) {
  if (!creator) {
    return null;
  }

  const isFounder = creator.tier === "founder" || creator.isExempt;

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} showHandle={false} showHeader={false} tone="light" variant="full">
      <div className="-mx-5 -mt-5">
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0f1b2e_0%,#162340_48%,#1d2d50_100%)] px-5 pb-7 pt-[max(54px,calc(env(safe-area-inset-top)+22px))] text-white">
          <button
            aria-label="Close creator profile"
            className="absolute left-4 top-[max(52px,calc(env(safe-area-inset-top)+20px))] flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/70"
            onClick={onClose}
            type="button"
          >
            <ChevronLeft size={19} />
          </button>

          <div className="mt-9 flex items-center gap-4">
            <CreatorAvatar creator={creator} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-black">{creator.name}</h2>
              <p className="mt-1 text-sm font-semibold text-white/45">@{creator.handle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-md px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                    isFounder ? "bg-[#c9a84c] text-[#071225]" : "bg-white/10 text-white/65"
                  }`}
                >
                  {creator.isExempt ? "2026 Exempt" : creator.tier}
                </span>
                <span className="rounded-md bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/50">
                  {creator.countryCode}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 divide-x divide-white/10 text-center">
            {[
              { label: "Rank", value: creator.rank },
              { label: "Points", value: creator.isExempt ? "Exempt" : creator.points.toLocaleString() },
              { label: "Followers", value: creator.followers },
              { label: "Status", value: creator.status }
            ].map((stat) => (
              <div className="px-2" key={stat.label}>
                <div className={`text-lg font-black ${stat.label === "Rank" ? "text-[#c9a84c]" : "text-white"}`}>
                  {stat.value}
                </div>
                <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-white/30">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-h-[60vh] bg-[#e9eef6] px-4 pb-8 pt-4 text-[#071a33]">
          <div className="grid gap-3">
            <TourCard
              memberNumber={creator.memberNumber}
              name={creator.name}
              status={creator.status}
              variant={isFounder ? "founder" : "standard"}
            />

            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Record" value={creator.record} detail="Matches" />
              <StatCard label="Completed" value={String(creator.challengesCompleted)} detail="Challenges" />
              <StatCard label="Streak" value={`${creator.currentStreak}`} detail="Days" tone="gold" />
            </div>

            <section className="rounded-2xl border border-[#d7dde8] bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa4b5]">Creator Snapshot</p>
              <p className="mt-3 text-sm leading-6 text-[#5f6b7d]">{creator.bio}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#7b8596]">
                <MapPin size={15} className="text-[#c9a84c]" />
                {creator.location}
              </div>
            </section>

            <Section title="Social">
              <div className="overflow-hidden rounded-2xl border border-[#d7dde8] bg-white">
                {creator.socials.map((social, index) => (
                  <div
                    className={`flex min-h-[58px] items-center gap-3 px-4 py-3 ${
                      index < creator.socials.length - 1 ? "border-b border-[#d7dde8]" : ""
                    }`}
                    key={social.platform}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2f8] text-[#0f1b2e]">
                      <PlatformIcon platform={social.platform} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black capitalize">{social.platform}</p>
                      <p className="mt-0.5 truncate text-xs text-[#8b95a7]">@{social.handle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">{social.followers}</p>
                      <p className="text-[9px] font-bold text-[#9aa4b5]">followers</p>
                    </div>
                    <ExternalLink size={14} className="text-[#a7b0bf]" />
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Sponsors">
              {creator.sponsors.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {creator.sponsors.map((sponsor) => (
                    <div className="rounded-xl border border-[#d7dde8] bg-white px-3 py-3 text-sm font-black" key={sponsor}>
                      {sponsor}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#d7dde8] bg-white px-4 py-5 text-center text-sm font-semibold text-[#8b95a7]">
                  No sponsors added yet.
                </div>
              )}
            </Section>

            <Section title="Golf Bag">
              <div className="overflow-hidden rounded-2xl border border-[#d7dde8] bg-white">
                {creator.golfBag.map((item, index) => (
                  <div
                    className={`flex min-h-[52px] items-center gap-3 px-4 py-3 ${
                      index < creator.golfBag.length - 1 ? "border-b border-[#d7dde8]" : ""
                    }`}
                    key={item}
                  >
                    <Flag size={16} className="text-[#c9a84c]" />
                    <span className="text-sm font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            <div className="grid grid-cols-2 gap-3 pb-4 pt-1">
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0f1b2e] text-sm font-black text-white"
                onClick={() => toast.info(`Match challenge reserved for @${creator.handle}.`)}
                type="button"
              >
                <Swords size={16} />
                Challenge
              </button>
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d7dde8] bg-white text-sm font-black text-[#071a33]"
                onClick={() => toast.info(`Message composer reserved for @${creator.handle}.`)}
                type="button"
              >
                <MessageCircle size={16} />
                Message
              </button>
            </div>

            <section className="rounded-2xl border border-[#d7dde8] bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa4b5]">Badges</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: creator.status, icon: Trophy },
                  { label: creator.memberNumber, icon: Shield },
                  { label: "Season 2026", icon: CalendarDays }
                ].map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <span
                      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#d7dde8] bg-[#f7f9fc] px-3 text-xs font-black text-[#5f6b7d]"
                      key={badge.label}
                    >
                      <Icon size={14} className="text-[#c9a84c]" />
                      {badge.label}
                    </span>
                  );
                })}
              </div>
            </section>
          </div>
        </section>
      </div>
    </ModalSheet>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa4b5]">{title}</p>
      {children}
    </section>
  );
}
