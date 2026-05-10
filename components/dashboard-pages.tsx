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
import { emptyDashboardSnapshot, type Challenge, type Creator, type DashboardSnapshot } from "@/lib/dashboard-types";

type DashboardPageProps = {
  data?: DashboardSnapshot;
  route: string;
};

export function DashboardPage({ data = emptyDashboardSnapshot, route }: DashboardPageProps) {
  if (route === "/profile") {
    return <ProfileDashboard data={data} />;
  }

  if (route === "/compete") {
    return <CompeteDashboard data={data} />;
  }

  if (route === "/create") {
    return <CreateDashboard data={data} />;
  }

  if (route === "/connect") {
    return <ConnectDashboard data={data} />;
  }

  const page = Object.values(dashboardPages).find((item) => item.route === route) ?? dashboardPages.home;
  return <FallbackDashboard data={data} page={page} />;
}

function ProfileDashboard({ data }: { data: DashboardSnapshot }) {
  const currentCreator = data.viewer;

  if (data.loadError || !currentCreator) {
    return <DashboardLoadState body={data.loadError || "Your creator profile is not available yet."} title="Profile unavailable" />;
  }

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
          {data.profileStats.map((stat) => (
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
            onClick={() => toast.info("Open Messages from the top bar to continue the conversation.")}
            type="button"
          >
            <MessageCircle size={15} />
            Message
          </button>
          <button
            className="flex min-h-12 items-center justify-center gap-2 text-sm font-black text-[#9aa4b5]"
            onClick={() => toast.info("Match score submission is reserved for the match-play phase.")}
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
            onClick={() => toast.info("Profile editing is reserved for the profile tools phase.")}
            type="button"
          >
            Edit
          </button>
        </article>

        <SectionTitle title="Connected Platforms" />
        {currentCreator.socials.length > 0 ? (
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
        ) : (
          <EmptyState body="Connect a social platform during onboarding to start earning Tour Points." icon={WifiOff} title="No socials connected" />
        )}

        <SectionTitle title="Sponsors" />
        {currentCreator.sponsors.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {currentCreator.sponsors.map((sponsor) => (
              <div className="rounded-2xl border border-[#d7dde8] bg-white px-4 py-3 text-sm font-black" key={sponsor}>
                {sponsor}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState body="Approved sponsors will appear on your public creator profile." icon={Shield} title="No sponsors yet" />
        )}

        <SectionTitle title="Golf Bag" />
        {currentCreator.golfBag.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[#d7dde8] bg-white">
            {currentCreator.golfBag.map((item, index) => (
              <div
                className={`flex min-h-[52px] items-center gap-3 px-4 py-3 ${
                  index < currentCreator.golfBag.length - 1 ? "border-b border-[#d7dde8]" : ""
                }`}
                key={item}
              >
                <Flag size={16} className="text-[#c9a84c]" />
                <span className="text-sm font-bold">{item}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState body="Your clubs and equipment will appear here after they are added." icon={Flag} title="No golf bag items" />
        )}

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

function CompeteDashboard({ data }: { data: DashboardSnapshot }) {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const podium = data.creators.slice(0, 3);

  if (data.loadError) {
    return <DashboardLoadState body={data.loadError} title="Leaderboard unavailable" />;
  }

  return (
    <>
      <HeroShell
        eyebrow="Leaderboard"
        icon={<Trophy size={22} />}
        subtitle={`${data.seasonLabel} - ${data.creators.length} Creators`}
        title="Leaderboard"
        stats={data.competeStats}
      >
        {podium.length > 0 ? <div className="mt-8 grid grid-cols-3 items-end gap-2">
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
        </div> : null}
      </HeroShell>

      <section className="min-h-[50vh] rounded-t-[28px] bg-[#e9eef6] px-3 pb-28 pt-4 text-[#071a33]">
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9aa4b5]">Full leaderboard</p>
            <h2 className="mt-1 text-lg font-black">Creator rankings</h2>
          </div>
          <span className="rounded-full border border-[#d7dde8] bg-white px-3 py-1 text-[10px] font-black text-[#8b95a7]">
            Live
          </span>
        </div>
        {data.creators.length > 0 ? (
          <div className="grid gap-2.5">
            {data.creators.map((creator) => (
              <CreatorCard creator={creator} key={creator.id} onSelect={setSelectedCreator} />
            ))}
          </div>
        ) : (
          <EmptyState body="Creator rankings will appear when the active season has competitors." icon={Trophy} title="No ranked creators yet" />
        )}
      </section>

      <CreatorProfileSheet creator={selectedCreator} isOpen={!!selectedCreator} onClose={() => setSelectedCreator(null)} />
    </>
  );
}

function CreateDashboard({ data }: { data: DashboardSnapshot }) {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (data.loadError) {
    return <DashboardLoadState body={data.loadError} title="Challenges unavailable" />;
  }

  return (
    <>
      <HeroShell
        eyebrow="Brand Challenges"
        icon={<Camera size={22} />}
        subtitle={`${data.challenges.filter((challenge) => challenge.status === "Open").length} Active - ${data.challenges.length} Total`}
        title="Brand Challenges"
        stats={data.createStats}
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

        {data.challenges.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {data.challenges.map((challenge) => (
              <ChallengeCard challenge={challenge} key={challenge.id} onSelect={setSelectedChallenge} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              body="Brand campaigns will appear here as admins publish them."
              icon={CheckCircle2}
              title="No challenges available"
            />
          </div>
        )}

        <div className="mt-4">
          <EmptyState
            body="Filters and submission review are kept ready for the next challenge workflow pass."
            icon={CheckCircle2}
            title="Challenge states connected"
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

function ConnectDashboard({ data }: { data: DashboardSnapshot }) {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const nearby = data.nearbyCreators;

  if (data.loadError) {
    return <DashboardLoadState body={data.loadError} title="Connect unavailable" />;
  }

  return (
    <>
      <HeroShell
        eyebrow="Connect"
        icon={<UsersRound size={22} />}
        subtitle="Find creators near you & challenge them"
        title="Connect"
        stats={data.connectStats}
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

        {nearby.length > 0 ? (
          <div className="mt-4 grid gap-2.5">
            {nearby.map((creator) => (
              <CreatorCard creator={creator} key={creator.id} onSelect={setSelectedCreator} variant="match" />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState body="Active creators will appear here as the season roster fills in." icon={UsersRound} title="No creators found nearby" />
          </div>
        )}

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

function FallbackDashboard({ data, page }: { data: DashboardSnapshot; page: PageConfig }) {
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
          <EmptyState body={data.loadError || page.emptyTitle} icon={WifiOff} title={page.route} />
          <LoadingSkeleton rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="State" value="Live" detail="Phase 5" />
            <StatCard label="Route" value="Ready" detail="Shared UI" tone="gold" />
          </div>
        </div>
      </section>
    </>
  );
}

function DashboardLoadState({ body, title }: { body: string; title: string }) {
  return (
    <>
      <HeroShell
        eyebrow="Dashboard"
        icon={<WifiOff size={22} />}
        stats={[
          { label: "Points", value: "0", tone: "gold" },
          { label: "Routes", value: "4" },
          { label: "State", value: "Hold" }
        ]}
        subtitle="The mobile shell is ready, but live Tour data could not load."
        title={title}
      />
      <section className="min-h-[56vh] rounded-t-[28px] bg-[#e9eef6] px-3 pb-28 pt-4 text-[#071a33]">
        <EmptyState body={body} icon={WifiOff} title={title} />
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
