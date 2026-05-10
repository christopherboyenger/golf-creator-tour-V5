"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  Award,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  Flag,
  ImagePlus,
  MapPin,
  MessageCircle,
  Pencil,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Trophy,
  UsersRound,
  WifiOff
} from "lucide-react";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeDetailSheet } from "@/components/challenge-detail-sheet";
import { CompeteDashboard } from "@/components/compete-dashboard";
import { CreatorAvatar, CreatorCard, PlatformIcon } from "@/components/creator-card";
import { CreatorProfileSheet } from "@/components/creator-profile-sheet";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ModalSheet } from "@/components/modal-sheet";
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

type ProfileTab = "overview" | "social" | "badges";
type ProfileCelebration = { title: string; detail: string; points?: number };
type ProfileBadge = { id: string; label: string; detail: string; tone: "gold" | "dark" | "light" };

const profileTabs: { id: ProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "social", label: "Social" },
  { id: "badges", label: "Badges" }
];

const profileSocials = ["instagram", "tiktok", "youtube"] as const;

function ProfileDashboard({ data }: { data: DashboardSnapshot }) {
  const currentCreator = data.viewer;
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState<(typeof profileSocials)[number] | null>(null);
  const [celebration, setCelebration] = useState<ProfileCelebration | null>(null);

  if (data.loadError || !currentCreator) {
    return <DashboardLoadState body={data.loadError || "Your creator profile is not available yet."} title="Profile unavailable" />;
  }

  const activeChallenges = data.challenges.filter(
    (challenge) => challenge.status === "Joined" || challenge.status === "Submitted"
  );
  const tierLabel = currentCreator.isExempt || currentCreator.tier === "founder" ? "Founder" : currentCreator.tier;

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
                {tierLabel}
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

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#d7dde8] bg-[#dde3ed] p-1">
          {profileTabs.map((tab) => (
            <button
              className={`min-h-10 rounded-xl text-xs font-black ${
                activeTab === tab.id ? "bg-white text-[#071a33]" : "text-[#8b95a7]"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <ProfileOverview
            activeChallenges={activeChallenges}
            creator={currentCreator}
            onEditLocation={() => setLocationOpen(true)}
            onSelectChallenge={setSelectedChallenge}
          />
        ) : null}
        {activeTab === "social" ? (
          <ProfileSocial
            creator={currentCreator}
            onConnect={setSocialPlatform}
            onSync={() =>
              setCelebration({
                title: "Socials Synced",
                detail: "Tour Points are ready for the next live sync."
              })
            }
          />
        ) : null}
        {activeTab === "badges" ? <ProfileBadges badges={buildProfileBadges(currentCreator, data.seasonLabel)} /> : null}
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
      <LocationEditSheet creator={currentCreator} isOpen={locationOpen} onClose={() => setLocationOpen(false)} />
      <SocialConnectSheet
        creator={currentCreator}
        isOpen={!!socialPlatform}
        key={socialPlatform ?? "social"}
        onClose={() => setSocialPlatform(null)}
        onConnected={(handle) => {
          setSocialPlatform(null);
          setCelebration({
            title: `${socialPlatform ? platformLabel(socialPlatform) : "Social"} Connected`,
            detail: handle,
            points: 50
          });
        }}
        platform={socialPlatform}
      />
      {celebration ? <ProfileCelebrationOverlay celebration={celebration} onClose={() => setCelebration(null)} /> : null}
    </>
  );
}

function ProfileOverview({
  activeChallenges,
  creator,
  onEditLocation,
  onSelectChallenge
}: {
  activeChallenges: Challenge[];
  creator: Creator;
  onEditLocation: () => void;
  onSelectChallenge: (challenge: Challenge) => void;
}) {
  return (
    <div className="mt-3">
      <TourCard
        memberNumber={creator.memberNumber}
        name={creator.name}
        status={creator.status}
        variant={creator.tier === "founder" || creator.isExempt ? "founder" : "standard"}
      />

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

      <SectionTitle title="Avatar" />
      <article className="flex min-h-[78px] items-center gap-3 rounded-2xl border border-[#d7dde8] bg-white px-4 py-3">
        <CreatorAvatar creator={creator} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Avatar flow</p>
          <p className="mt-1 text-xs leading-5 text-[#7b8596]">Profile image upload placeholder for the storage phase.</p>
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f1b2e] text-white"
          onClick={() => toast.info("Avatar upload connects when profile storage is finalized.")}
          title="Upload avatar"
          type="button"
        >
          <ImagePlus size={17} />
        </button>
      </article>

      <SectionTitle title="Location" />
      <article className="flex min-h-[74px] items-center gap-3 rounded-2xl border border-[#d7dde8] bg-white px-4 py-3">
        <MapPin size={20} className="text-[#c9a84c]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{creator.country}</p>
          <p className="mt-1 text-xs text-[#7b8596]">{creator.location}</p>
        </div>
        <button
          className="flex min-h-10 items-center gap-2 rounded-xl bg-[#0f1b2e] px-4 text-xs font-black text-white"
          onClick={onEditLocation}
          type="button"
        >
          <Pencil size={14} />
          Edit
        </button>
      </article>

      <SectionTitle title="Creator Snapshot" />
      <section className="rounded-2xl border border-[#d7dde8] bg-white p-4">
        <p className="text-sm leading-6 text-[#5f6b7d]">{creator.bio}</p>
        <div className="mt-4 grid grid-cols-3 divide-x divide-[#d7dde8] rounded-2xl bg-[#f5f7fb] py-3 text-center">
          {[
            { label: "Rank", value: creator.rank },
            { label: "Followers", value: creator.followers },
            { label: "Streak", value: String(creator.currentStreak) }
          ].map((stat) => (
            <div className="px-2" key={stat.label}>
              <p className="text-base font-black text-[#071a33]">{stat.value}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#9aa4b5]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <SectionTitle title="Active Challenges" />
      {activeChallenges.length > 0 ? (
        <div className="grid gap-3">
          {activeChallenges.map((challenge) => (
            <ChallengeCard challenge={challenge} key={challenge.id} onSelect={onSelectChallenge} />
          ))}
        </div>
      ) : (
        <EmptyState body="Joined and submitted brand challenges will appear here." icon={CheckCircle2} title="No active challenges" />
      )}

      <SectionTitle title="Accepted Matches" />
      <EmptyState body="Accepted creator matches will appear here once a challenge is accepted." icon={Trophy} title="No matches yet" />

      <SectionTitle title="Sponsors" />
      {creator.sponsors.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {creator.sponsors.map((sponsor) => (
            <div className="rounded-2xl border border-[#d7dde8] bg-white px-4 py-3 text-sm font-black" key={sponsor}>
              {sponsor}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState body="Approved sponsors will appear on your public creator profile." icon={Shield} title="No sponsors yet" />
      )}

      <SectionTitle title="Golf Bag" />
      {creator.golfBag.length > 0 ? (
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
      ) : (
        <EmptyState body="Your clubs and equipment will appear here after they are added." icon={Flag} title="No golf bag items" />
      )}
    </div>
  );
}

function ProfileSocial({
  creator,
  onConnect,
  onSync
}: {
  creator: Creator;
  onConnect: (platform: (typeof profileSocials)[number]) => void;
  onSync: () => void;
}) {
  const connectedCount = creator.socials.filter((social) => social.connected).length;

  return (
    <div className="mt-4">
      <section className="rounded-2xl border border-[#d7dde8] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa4b5]">Social Accounts</p>
            <h2 className="mt-1 text-lg font-black">Connect Social Media</h2>
            <p className="mt-2 text-sm leading-6 text-[#6d7789]">Sync approved handles and keep Tour Points current.</p>
          </div>
          <button
            className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-[#0f1b2e] px-3 text-xs font-black text-white disabled:opacity-45"
            disabled={connectedCount === 0}
            onClick={onSync}
            type="button"
          >
            <RefreshCw size={14} />
            Sync
          </button>
        </div>
      </section>

      <div className="mt-3 overflow-hidden rounded-2xl border border-[#d7dde8] bg-white">
        {profileSocials.map((platform, index) => {
          const social = creator.socials.find((item) => item.platform === platform);
          return (
            <div
              className={`flex min-h-[72px] items-center gap-3 px-4 py-3 ${
                index < profileSocials.length - 1 ? "border-b border-[#d7dde8]" : ""
              }`}
              key={platform}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef2f8] text-[#0f1b2e]">
                <PlatformIcon platform={platform} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">{platformLabel(platform)}</p>
                <p className={`mt-1 truncate text-xs font-semibold ${social?.connected ? "text-emerald-600" : "text-[#8b95a7]"}`}>
                  {social?.connected ? `@${social.handle}` : "Not connected"}
                </p>
                {social?.connected ? <p className="mt-1 text-[10px] font-bold text-[#9aa4b5]">{social.followers} followers</p> : null}
              </div>
              <button
                className={`min-h-10 rounded-xl px-4 text-xs font-black ${
                  social?.connected ? "border border-[#d7dde8] bg-white text-[#071a33]" : "bg-[#0f1b2e] text-white"
                }`}
                onClick={() => onConnect(platform)}
                type="button"
              >
                {social?.connected ? "Update" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>

      {connectedCount === 0 ? (
        <div className="mt-3">
          <EmptyState
            body="Connect Instagram, TikTok, or YouTube to begin earning social connection points."
            icon={WifiOff}
            title="No social accounts connected"
          />
        </div>
      ) : null}
    </div>
  );
}

function ProfileBadges({ badges }: { badges: ProfileBadge[] }) {
  return (
    <div className="mt-4">
      {badges.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => (
            <article className={`min-h-[132px] rounded-2xl border p-4 ${badgeToneClass(badge.tone)}`} key={badge.id}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef2f8] text-[#c9a84c]">
                <Award size={22} />
              </div>
              <p className="mt-4 text-sm font-black">{badge.label}</p>
              <p className="mt-1 text-xs leading-5 text-[#7b8596]">{badge.detail}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState body="Earn Tour Points, complete challenges, and sync socials to unlock badges." icon={Award} title="No badges yet" />
      )}
    </div>
  );
}

function LocationEditSheet({ creator, isOpen, onClose }: { creator: Creator; isOpen: boolean; onClose: () => void }) {
  const [location, setLocation] = useState(creator.location);
  const [country, setCountry] = useState(creator.countryCode);

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} showHandle tone="light" title="Edit Location" variant="bottom">
      <div className="grid gap-3">
        <ProfileInput label="Location" onChange={setLocation} placeholder="West Palm Beach, FL" value={location} />
        <ProfileInput label="Country" onChange={setCountry} placeholder="US" value={country} />
        <button
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0f1b2e] text-sm font-black text-white"
          onClick={() => {
            toast.success("Location saved for this profile preview.");
            onClose();
          }}
          type="button"
        >
          <Save size={16} />
          Save Location
        </button>
      </div>
    </ModalSheet>
  );
}

function SocialConnectSheet({
  creator,
  isOpen,
  onClose,
  onConnected,
  platform
}: {
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
  onConnected: (handle: string) => void;
  platform: (typeof profileSocials)[number] | null;
}) {
  const currentSocial = creator.socials.find((social) => social.platform === platform);
  const [handle, setHandle] = useState(currentSocial?.handle ? `@${currentSocial.handle}` : "");

  if (!platform) return null;

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} showHandle tone="light" title={`Connect ${platformLabel(platform)}`} variant="bottom">
      <div className="grid gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[#d7dde8] bg-[#f5f7fb] p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0f1b2e]">
            <PlatformIcon platform={platform} />
          </span>
          <div>
            <p className="text-sm font-black">{platformLabel(platform)}</p>
            <p className="mt-1 text-xs leading-5 text-[#7b8596]">Approved creator handle for social points.</p>
          </div>
        </div>
        <ProfileInput label="Profile Handle" onChange={setHandle} placeholder="@yourhandle" value={handle} />
        <button
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0f1b2e] text-sm font-black text-white"
          onClick={() => {
            if (!handle.trim()) {
              toast.error("Enter your profile handle.");
              return;
            }
            onConnected(handle.trim());
          }}
          type="button"
        >
          <Check size={16} />
          Connect Platform
        </button>
      </div>
    </ModalSheet>
  );
}

function ProfileInput({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-[#9aa4b5]">{label}</span>
      <input
        className="w-full rounded-xl border border-[#d7dde8] bg-[#f7f9fc] px-4 py-4 text-sm font-semibold text-[#071a33] outline-none transition placeholder:text-[#a7b0bf] focus:border-[#c9a84c]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function ProfileCelebrationOverlay({
  celebration,
  onClose
}: {
  celebration: ProfileCelebration;
  onClose: () => void;
}) {
  return (
    <div className="gct-fixed fixed inset-y-0 z-[95] flex items-center justify-center bg-[#111318]/92 px-8 text-white backdrop-blur-md">
      <div className="animate-[gctFadeUp_0.35s_ease_both] text-center">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c9a84c,#e8d48b)] text-[#111318] shadow-[0_0_42px_rgba(201,168,76,0.42)]">
          <Sparkles size={44} strokeWidth={1.8} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#c9a84c]">
          {celebration.points ? `+${celebration.points} Tour Points` : "Tour Points Synced"}
        </p>
        <h2 className="mt-3 text-3xl font-black text-white">{celebration.title}</h2>
        <p className="mt-2 text-sm font-bold text-white/45">{celebration.detail}</p>
        <button
          className="tap-row mt-8 rounded-xl border border-[#c9a84c]/30 px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#c9a84c]"
          onClick={onClose}
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function buildProfileBadges(creator: Creator, seasonLabel: string): ProfileBadge[] {
  return [
    { id: "tour-member", label: "Tour Member", detail: creator.memberNumber, tone: "gold" },
    { id: "season", label: seasonLabel, detail: creator.status, tone: "dark" },
    ...(creator.socials.some((social) => social.connected)
      ? [{ id: "social-starter", label: "Social Starter", detail: `${creator.socials.length} linked`, tone: "light" as const }]
      : []),
    ...(creator.challengesCompleted > 0
      ? [{ id: "challenge-finisher", label: "Challenge Finisher", detail: `${creator.challengesCompleted} completed`, tone: "light" as const }]
      : [])
  ];
}

function badgeToneClass(tone: ProfileBadge["tone"]) {
  if (tone === "dark") return "border-[#13233f] bg-[#13233f] text-white";
  if (tone === "gold") return "border-[#c9a84c]/35 bg-[#fff8df] text-[#071a33]";
  return "border-[#d7dde8] bg-white text-[#071a33]";
}

function platformLabel(platform: (typeof profileSocials)[number]) {
  if (platform === "youtube") return "YouTube";
  if (platform === "tiktok") return "TikTok";
  return "Instagram";
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
            <StatCard label="State" value="Live" detail="Phase 6" />
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
