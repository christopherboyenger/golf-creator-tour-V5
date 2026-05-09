"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  Bell,
  Camera,
  CheckCircle2,
  Flag,
  MapPin,
  MessageCircle,
  Pencil,
  Shield,
  Trophy,
  UsersRound,
  WifiOff
} from "lucide-react";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeDetailSheet } from "@/components/challenge-detail-sheet";
import { CreatorAvatar, CreatorCard, PlatformIcon } from "@/components/creator-card";
import { CreatorProfileSheet } from "@/components/creator-profile-sheet";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { StatCard } from "@/components/stat-card";
import { toast } from "@/components/toast";
import { TourCard } from "@/components/tour-card";
import { UpgradeMembershipSheet } from "@/components/upgrade-membership-sheet";
import { dashboardPages } from "@/lib/page-content";
import type { PageConfig } from "@/lib/page-content";
import {
  challenges,
  connectStats,
  createStats,
  creators,
  currentCreator,
  profileStats
} from "@/lib/mock-data";
import type { Challenge, Creator } from "@/lib/mock-data";

type DashboardMockPageProps = {
  route: string;
};

export function DashboardMockPage({ route }: DashboardMockPageProps) {
  if (route === "/profile") {
    return <ProfileDashboard />;
  }

  if (route === "/compete") {
    return <CompeteDashboard />;
  }

  if (route === "/create") {
    return <CreateDashboard />;
  }

  if (route === "/connect") {
    return <ConnectDashboard />;
  }

  const page = Object.values(dashboardPages).find((item) => item.route === route) ?? dashboardPages.home;
  return <FallbackDashboard page={page} />;
}

function ProfileDashboard() {
  return (
    <>
      <section className="px-6 pb-8 pt-5 text-white">
        <div className="flex items-center gap-4">
          <div className="relative">
            <CreatorAvatar creator={currentCreator} size="lg" />
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#162340] bg-[#c9a84c] text-[#071225]">
              <Shield size={16} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-black">{currentCreator.name}</h1>
            <p className="mt-2 truncate text-lg font-semibold text-white/45">@{currentCreator.handle}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-lg bg-[#c9a84c] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#071225]">
                Founder
              </span>
              <span className="rounded-lg bg-white/10 px-4 py-2 text-xs font-black text-white/55">
                {currentCreator.countryCode} {currentCreator.location}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-[58vh] rounded-t-[28px] bg-[#e9eef6] px-3 pb-28 pt-3 text-[#071a33]">
        <div className="grid grid-cols-3 gap-2 px-1">
          {profileStats.map((stat) => (
            <StatCard
              detail={stat.label === "Points" ? "Tour total" : "Season"}
              key={stat.label}
              label={stat.label}
              tone={stat.tone === "gold" ? "gold" : "light"}
              value={stat.value}
            />
          ))}
        </div>

        <div className="mt-3">
          <TourCard
            memberNumber={currentCreator.memberNumber}
            name={currentCreator.name}
            status={currentCreator.status}
            variant="founder"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#d7dde8] bg-[#dde3ed]">
          <button
            className="flex min-h-12 items-center justify-center gap-2 bg-[#edf2fa] text-sm font-black text-blue-500"
            onClick={() => toast.info("Messages are mocked until backend wiring.")}
            type="button"
          >
            <MessageCircle size={15} />
            Message
          </button>
          <button
            className="flex min-h-12 items-center justify-center gap-2 text-sm font-black text-[#9aa4b5]"
            onClick={() => toast.info("Match scoring stays UI-only in Phase 2.")}
            type="button"
          >
            <Pencil size={15} />
            Update Score
          </button>
        </div>

        <SectionTitle title="Location" />
        <article className="flex min-h-[74px] items-center gap-3 rounded-2xl border border-[#d7dde8] bg-white px-4 py-3">
          <MapPin size={20} className="text-[#c9a84c]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">{currentCreator.country}</p>
            <p className="mt-1 text-xs text-[#7b8596]">{currentCreator.location}</p>
          </div>
          <button
            className="rounded-xl bg-[#0f1b2e] px-4 py-2 text-xs font-black text-white"
            onClick={() => toast.info("Profile editing is reserved for a later phase.")}
            type="button"
          >
            Edit
          </button>
        </article>

        <SectionTitle title="Connected Platforms" />
        <div className="overflow-hidden rounded-2xl border border-[#d7dde8] bg-white">
          {currentCreator.socials.map((social, index) => (
            <div
              className={`flex min-h-[56px] items-center gap-3 px-4 py-3 ${
                index < currentCreator.socials.length - 1 ? "border-b border-[#d7dde8]" : ""
              }`}
              key={social.platform}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2f8] text-[#0f1b2e]">
                <PlatformIcon platform={social.platform} />
              </span>
              <span className="text-sm font-black">{social.followers}</span>
              <span className="text-xs text-[#8b95a7]">{social.platform === "youtube" ? "subs" : "followers"}</span>
            </div>
          ))}
        </div>

        <SectionTitle subtitle="Golf platform connections launching soon" title="Golf Platform Connections" />
        <div className="overflow-hidden rounded-2xl border border-[#d7dde8] bg-[#eef2f8]">
          {["GHIN", "Arccos", "TheGrint", "Garmin Golf"].map((item, index) => (
            <div
              className={`flex min-h-[66px] items-center gap-3 px-4 py-3 ${
                index < 3 ? "border-b border-[#d7dde8]" : ""
              }`}
              key={item}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e1e7f0] text-[#96a0b1]">
                <Flag size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">{item}</p>
                <p className="mt-1 text-xs text-[#8b95a7]">{item === "GHIN" ? "USGA Handicap Network" : "Shot Tracking"}</p>
              </div>
              <span className="rounded-md bg-[#fff8df] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#c9a84c]">
                Soon
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function CompeteDashboard() {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const podium = [creators[1], creators[0], creators[2]];

  return (
    <>
      <HeroShell
        eyebrow="Leaderboard"
        icon={<Trophy size={22} />}
        subtitle="Season 2026 - 100 Creators"
        title="Leaderboard"
        stats={[
          { label: "Your Rank", value: "#0", tone: "gold" },
          { label: "Your Points", value: "0" },
          { label: "Total", value: "100" }
        ]}
      >
        <div className="mt-8 grid grid-cols-3 items-end gap-2">
          {podium.map((creator, index) => {
            const center = index === 1;
            return (
              <button
                className="tap-row flex flex-col items-center text-center"
                key={creator.id}
                onClick={() => setSelectedCreator(creator)}
                type="button"
              >
                <CreatorAvatar creator={creator} size={center ? "lg" : "md"} />
                <p className="mt-3 max-w-[7rem] text-sm font-black leading-4">{creator.name}</p>
                <p className="mt-1 text-xs font-semibold text-white/45">@{creator.handle}</p>
                <p className="mt-2 text-[10px] font-black text-[#c9a84c]">Champion Exemption</p>
                <div
                  className={`mt-2 flex w-14 flex-col items-center justify-start rounded-t-xl border border-white/10 bg-white/10 pt-3 ${
                    center ? "h-24" : "h-16"
                  }`}
                >
                  <span className="text-xl font-black text-[#c9a84c]">{creator.rank}</span>
                  <span className="mt-2 text-[10px] font-bold text-white/45">{creator.points}</span>
                </div>
              </button>
            );
          })}
        </div>
      </HeroShell>

      <section className="min-h-[50vh] rounded-t-[28px] bg-[#e9eef6] px-3 pb-28 pt-4 text-[#071a33]">
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9aa4b5]">Full leaderboard</p>
            <h2 className="mt-1 text-lg font-black">Creator rankings</h2>
          </div>
          <span className="rounded-full border border-[#d7dde8] bg-white px-3 py-1 text-[10px] font-black text-[#8b95a7]">
            Mock
          </span>
        </div>
        <div className="grid gap-2.5">
          {creators.map((creator) => (
            <CreatorCard creator={creator} key={creator.id} onSelect={setSelectedCreator} />
          ))}
        </div>
      </section>

      <CreatorProfileSheet creator={selectedCreator} isOpen={!!selectedCreator} onClose={() => setSelectedCreator(null)} />
    </>
  );
}

function CreateDashboard() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
      <HeroShell
        eyebrow="Brand Challenges"
        icon={<Camera size={22} />}
        subtitle="9 Active - 9 Total"
        title="Brand Challenges"
        stats={createStats}
      />

      <section className="min-h-[56vh] rounded-t-[28px] bg-[#e9eef6] px-3 pb-28 pt-4 text-[#071a33]">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#d7dde8] bg-[#dde3ed] p-1">
          {["All", "Active", "Submitted"].map((tab, index) => (
            <button
              className={`min-h-10 rounded-xl text-xs font-black ${index === 0 ? "bg-white text-[#071a33]" : "text-[#8b95a7]"}`}
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {challenges.map((challenge) => (
            <ChallengeCard challenge={challenge} key={challenge.id} onSelect={setSelectedChallenge} />
          ))}
        </div>

        <div className="mt-4">
          <EmptyState
            body="Filters, backend availability, and admin-created campaigns will connect in later phases."
            icon={CheckCircle2}
            title="Challenge states reserved"
          />
        </div>
      </section>

      <ChallengeDetailSheet
        challenge={selectedChallenge}
        isOpen={!!selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
        onUpgrade={() => {
          setSelectedChallenge(null);
          setUpgradeOpen(true);
        }}
      />
      <UpgradeMembershipSheet isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}

function ConnectDashboard() {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const nearby = creators.filter((creator) => creator.id !== currentCreator.id);

  return (
    <>
      <HeroShell
        eyebrow="Connect"
        icon={<UsersRound size={22} />}
        subtitle="Find creators near you & challenge them"
        title="Connect"
        stats={connectStats}
      />

      <section className="min-h-[56vh] rounded-t-[28px] bg-[#e9eef6] px-3 pb-28 pt-4 text-[#071a33]">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#d7dde8] bg-[#dde3ed] p-1">
          {["Nearby", "Sent", "Requests"].map((tab, index) => (
            <button
              className={`min-h-10 rounded-xl text-xs font-black ${index === 0 ? "bg-white text-[#071a33]" : "text-[#8b95a7]"}`}
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2.5">
          {nearby.map((creator) => (
            <CreatorCard creator={creator} key={creator.id} onSelect={setSelectedCreator} variant="match" />
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          <EmptyState
            body="Incoming match requests will appear here once Supabase match data is wired."
            icon={Bell}
            title="No open requests"
          />
        </div>
      </section>

      <CreatorProfileSheet creator={selectedCreator} isOpen={!!selectedCreator} onClose={() => setSelectedCreator(null)} />
    </>
  );
}

function FallbackDashboard({ page }: { page: PageConfig }) {
  const Icon = page.icon;

  return (
    <>
      <HeroShell
        eyebrow={page.title}
        icon={<Icon size={22} />}
        subtitle={page.description}
        title={page.eyebrow}
        stats={page.stats}
      />
      <section className="min-h-[56vh] rounded-t-[28px] bg-[#e9eef6] px-3 pb-28 pt-4 text-[#071a33]">
        <div className="grid gap-3">
          <EmptyState body={page.emptyTitle} icon={WifiOff} title={page.route} />
          <LoadingSkeleton rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="State" value="Mock" detail="Phase 2" />
            <StatCard label="Route" value="Ready" detail="Shared UI" tone="gold" />
          </div>
        </div>
      </section>
    </>
  );
}

function HeroShell({
  children,
  eyebrow,
  icon,
  stats,
  subtitle,
  title
}: {
  children?: ReactNode;
  eyebrow: string;
  icon: ReactNode;
  stats: ReadonlyArray<{ label: string; value: string; tone?: string }>;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="px-6 pb-8 pt-5 text-center text-white">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        {icon}
      </div>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-white/40">{eyebrow}</p>
      <h1 className="mt-3 text-2xl font-black">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45">{subtitle}</p>
      <div className="mx-auto mt-7 grid max-w-sm grid-cols-3 divide-x divide-white/10">
        {stats.map((stat) => (
          <div className="px-3" key={stat.label}>
            <div className={`text-3xl font-black ${stat.tone === "gold" ? "text-[#c9a84c]" : "text-white"}`}>
              {stat.value}
            </div>
            <div className="mt-1 text-xs font-bold text-white/35">{stat.label}</div>
          </div>
        ))}
      </div>
      {children}
    </section>
  );
}

function SectionTitle({ subtitle, title }: { subtitle?: string; title: string }) {
  return (
    <div className="mb-2 mt-5 px-1">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa4b5]">{title}</p>
      {subtitle && <p className="mt-2 text-xs text-[#7b8596]">{subtitle}</p>}
    </div>
  );
}
