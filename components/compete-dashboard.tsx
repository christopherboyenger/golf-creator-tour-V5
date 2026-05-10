"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Maximize2,
  Minus,
  Search,
  SlidersHorizontal,
  Trophy
} from "lucide-react";
import { CreatorAvatar } from "@/components/creator-card";
import { CreatorProfileSheet } from "@/components/creator-profile-sheet";
import { EmptyState } from "@/components/empty-state";
import { ModalSheet } from "@/components/modal-sheet";
import type { Creator, CreatorGender, DashboardSnapshot } from "@/lib/dashboard-types";

type RankedCreator = {
  creator: Creator;
  isTie: boolean;
  movement: number;
  rankLabel: string;
};

type ActivityItem = {
  detail: string;
  id: string;
  movement?: number;
  title: string;
};

const NO_RANK = "\u2014";

export function CompeteDashboard({ data }: { data: DashboardSnapshot }) {
  const [countryFilter, setCountryFilter] = useState("all");
  const [fullLeaderboardOpen, setFullLeaderboardOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  const allCreators = useMemo(() => {
    if (!data.viewer || data.creators.some((creator) => creator.id === data.viewer?.id)) return data.creators;
    return [data.viewer, ...data.creators];
  }, [data.creators, data.viewer]);

  const podiumCreators = useMemo(() => buildPodiumCreators(allCreators), [allCreators]);
  const leaderboard = useMemo(
    () => buildRankedCreators(allCreators, podiumCreators.length),
    [allCreators, podiumCreators.length]
  );
  const countries = useMemo(() => buildCountryOptions(leaderboard), [leaderboard]);
  const filteredLeaderboard = useMemo(
    () => filterLeaderboard(leaderboard, search, countryFilter, genderFilter),
    [countryFilter, genderFilter, leaderboard, search]
  );
  const activityItems = useMemo(
    () => buildActivityItems(data, leaderboard, podiumCreators),
    [data, leaderboard, podiumCreators]
  );
  const viewerRank = findViewerRank(data.viewer, leaderboard);
  const heroStats = useMemo(
    () =>
      data.competeStats.map((stat) => {
        if (stat.label === "Your Rank") return { ...stat, value: viewerRank };
        if (stat.label === "Total") return { ...stat, value: String(allCreators.length) };
        return stat;
      }),
    [allCreators.length, data.competeStats, viewerRank]
  );

  if (data.loadError) {
    return (
      <>
        <CompeteHero
          podiumCreators={[]}
          seasonLabel={data.seasonLabel}
          stats={heroStats}
          totalCreators={0}
          onSelectCreator={setSelectedCreator}
        />
        <section className="min-h-[56vh] rounded-t-[28px] bg-[#e9eef6] px-3 pb-28 pt-4 text-[#071a33]">
          <EmptyState body={data.loadError} icon={Trophy} title="Leaderboard unavailable" />
        </section>
      </>
    );
  }

  return (
    <>
      <CompeteHero
        podiumCreators={podiumCreators}
        seasonLabel={data.seasonLabel}
        stats={heroStats}
        totalCreators={allCreators.length}
        onSelectCreator={setSelectedCreator}
      />

      <section className="min-h-[56vh] rounded-t-[28px] bg-[#e9eef6] px-3 pb-28 pt-3 text-[#071a33]">
        <SearchField search={search} setSearch={setSearch} />

        {data.viewer ? <CurrentRankPill creator={data.viewer} rankLabel={viewerRank} /> : null}

        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa4b5]">Rankings</p>
            <p className="mt-1 text-xs font-bold text-[#7b8596]">
              {filteredLeaderboard.length} of {leaderboard.length} creators
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="tap-row inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#ccd4e1] bg-[#dfe5ee] px-3 text-[10px] font-black text-[#7b8596]"
              onClick={() => setFullLeaderboardOpen(true)}
              type="button"
            >
              <Maximize2 size={13} />
              Expand
            </button>
            <button
              className="tap-row inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#ccd4e1] bg-white px-3 text-[10px] font-black text-[#7b8596]"
              onClick={() => setFiltersOpen((open) => !open)}
              type="button"
            >
              <SlidersHorizontal size={13} />
              Filters
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <LeaderboardFilters
            countries={countries}
            countryFilter={countryFilter}
            genderFilter={genderFilter}
            setCountryFilter={setCountryFilter}
            setGenderFilter={setGenderFilter}
          />
        ) : null}

        <ActivityFeed items={activityItems} />

        <LeaderboardList
          emptyBody="Try a different creator, country, or gender filter."
          emptyTitle={leaderboard.length ? "No matching creators" : "No ranked creators yet"}
          rows={filteredLeaderboard}
          viewerId={data.viewer?.id}
          onSelectCreator={setSelectedCreator}
        />
      </section>

      <FullLeaderboardSheet
        countries={countries}
        countryFilter={countryFilter}
        genderFilter={genderFilter}
        isOpen={fullLeaderboardOpen}
        rows={filteredLeaderboard}
        search={search}
        setCountryFilter={setCountryFilter}
        setGenderFilter={setGenderFilter}
        setSearch={setSearch}
        viewerId={data.viewer?.id}
        onClose={() => setFullLeaderboardOpen(false)}
        onSelectCreator={(creator) => {
          setFullLeaderboardOpen(false);
          setSelectedCreator(creator);
        }}
      />
      <CreatorProfileSheet creator={selectedCreator} isOpen={!!selectedCreator} onClose={() => setSelectedCreator(null)} />
    </>
  );
}

function CompeteHero({
  onSelectCreator,
  podiumCreators,
  seasonLabel,
  stats,
  totalCreators
}: {
  onSelectCreator: (creator: Creator) => void;
  podiumCreators: Creator[];
  seasonLabel: string;
  stats: DashboardSnapshot["competeStats"];
  totalCreators: number;
}) {
  return (
    <section className="px-5 pb-7 pt-2 text-center text-white">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-white/42">Leaderboard</p>
      <p className="mt-2 text-sm font-semibold text-white/35">
        {seasonLabel} - {totalCreators} Creators
      </p>

      <div className="mx-auto mt-5 grid max-w-[310px] grid-cols-3 divide-x divide-white/10">
        {stats.map((stat) => (
          <div className="px-3" key={stat.label}>
            <div className={`text-2xl font-black ${stat.tone === "gold" ? "text-[#c9a84c]" : "text-white"}`}>
              {stat.value}
            </div>
            <div className="mt-1 text-[10px] font-bold text-white/35">{stat.label}</div>
          </div>
        ))}
      </div>

      {podiumCreators.length > 0 ? (
        <div className="mx-auto mt-8 grid max-w-[342px] grid-cols-3 items-end gap-1">
          {podiumCreators.map((creator, index) => {
            const isChampion = index === 1;
            const parsedRank = parseRankNumber(creator.rank) ?? index + 1;
            return (
              <button
                className="tap-row flex min-w-0 flex-col items-center text-center"
                key={creator.id}
                onClick={() => onSelectCreator(creator)}
                type="button"
              >
                <CreatorAvatar creator={creator} size={isChampion ? "lg" : "md"} />
                <p className="mt-3 w-full truncate px-1 text-sm font-black leading-4">{creator.name}</p>
                <p className="mt-1 w-full truncate px-1 text-xs font-semibold text-white/45">@{creator.handle}</p>
                <CountryBadge code={creator.countryCode} tone="dark" />
                <p className="mt-2 text-[10px] font-black leading-3 text-[#c9a84c]">Champion Exemption</p>
                <div
                  className={`mt-2 flex w-[58px] flex-col items-center justify-start rounded-t-xl border pt-3 ${
                    isChampion
                      ? "h-24 border-[#c9a84c]/45 bg-[#3f4040]/85"
                      : "h-16 border-white/10 bg-white/10"
                  }`}
                >
                  <span className={`text-xl font-black ${isChampion ? "text-[#c9a84c]" : "text-white/62"}`}>
                    {parsedRank}
                  </span>
                  <span className="mt-2 text-[10px] font-bold text-white/45">{creator.points.toLocaleString()}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-xs rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5">
          <p className="text-sm font-black">Exempt podium pending</p>
          <p className="mt-2 text-xs leading-5 text-white/40">
            Champion exemptions will appear when the season roster is seeded.
          </p>
        </div>
      )}
    </section>
  );
}

function SearchField({ search, setSearch }: { search: string; setSearch: (value: string) => void }) {
  return (
    <label className="relative block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa4b5]" size={15} />
      <input
        className="h-11 w-full rounded-xl border border-[#cfd6e2] bg-[#f5f7fb] pl-10 pr-3 text-sm font-semibold text-[#071a33] outline-none placeholder:text-[#a3acba] focus:border-[#c9a84c] focus:bg-white focus:ring-2 focus:ring-[#c9a84c]/20"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search creators..."
        type="search"
        value={search}
      />
    </label>
  );
}

function CurrentRankPill({ creator, rankLabel }: { creator: Creator; rankLabel: string }) {
  return (
    <div className="sticky top-2 z-30 mt-3 rounded-full border border-[#d5bd67]/45 bg-[#fff8df] px-3 py-2 shadow-[0_12px_26px_rgba(7,18,37,0.12)]">
      <div className="flex items-center gap-3">
        <CreatorAvatar creator={creator} size="sm" />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-black text-[#071a33]">Your current rank</p>
          <p className="mt-0.5 truncate text-[10px] font-bold text-[#7b682d]">@{creator.handle}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-[#c09a2b]">{rankLabel}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8b7a45]">Rank</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-[#071a33]">{creator.points.toLocaleString()}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8b7a45]">Points</p>
        </div>
      </div>
    </div>
  );
}

function LeaderboardFilters({
  countries,
  countryFilter,
  genderFilter,
  setCountryFilter,
  setGenderFilter
}: {
  countries: { code: string; label: string }[];
  countryFilter: string;
  genderFilter: string;
  setCountryFilter: (value: string) => void;
  setGenderFilter: (value: string) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <select
        aria-label="Country filter"
        className="h-10 min-w-0 rounded-lg border border-[#cfd6e2] bg-white px-3 text-xs font-black text-[#5f6b7d] outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20"
        onChange={(event) => setCountryFilter(event.target.value)}
        value={countryFilter}
      >
        <option value="all">All countries</option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Gender filter"
        className="h-10 min-w-0 rounded-lg border border-[#cfd6e2] bg-white px-3 text-xs font-black text-[#5f6b7d] outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20"
        onChange={(event) => setGenderFilter(event.target.value)}
        value={genderFilter}
      >
        <option value="all">All genders</option>
        <option value="M">Men</option>
        <option value="F">Women</option>
        <option value="NB">Nonbinary</option>
        <option value="unspecified">Unspecified</option>
      </select>
    </div>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="mt-4">
      <div className="flex items-center justify-between px-1">
        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa4b5]">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Activity
        </p>
        <button className="tap-row inline-flex items-center gap-1 text-[10px] font-black text-[#7b8596]" type="button">
          View all
          <ChevronDown size={12} />
        </button>
      </div>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <article className="rounded-xl border border-[#d7dde8] bg-white px-3 py-3" key={item.id}>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2f8] text-[#0f1b2e]">
                <Activity size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black">{item.title}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-[#8b95a7]">{item.detail}</p>
              </div>
              {typeof item.movement === "number" ? <RankMovement movement={item.movement} /> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LeaderboardList({
  emptyBody,
  emptyTitle,
  onSelectCreator,
  rows,
  viewerId
}: {
  emptyBody: string;
  emptyTitle: string;
  onSelectCreator: (creator: Creator) => void;
  rows: RankedCreator[];
  viewerId?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-3">
        <EmptyState body={emptyBody} icon={Trophy} title={emptyTitle} />
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-[#d7dde8] bg-white">
      <div className="grid grid-cols-[2.3rem_2.6rem_minmax(0,1fr)_4.8rem] items-center bg-[#dfe5ee] px-3 py-3 text-[8px] font-black uppercase tracking-[0.12em] text-[#8b95a7]">
        <span>#</span>
        <span>CTY</span>
        <span>Creator</span>
        <span className="text-right">Points</span>
      </div>
      {rows.map((row) => {
        const isViewer = row.creator.id === viewerId;
        return (
          <button
            className={`tap-row grid min-h-[72px] w-full grid-cols-[2.3rem_2.6rem_minmax(0,1fr)_4.8rem] items-center gap-0 border-t px-3 py-3 text-left ${
              isViewer ? "border-[#d5bd67]/55 bg-[#fff8df]" : "border-[#edf0f5] bg-white"
            }`}
            key={row.creator.id}
            onClick={() => onSelectCreator(row.creator)}
            type="button"
          >
            <span className={`text-xs font-black ${row.rankLabel === NO_RANK ? "text-[#a4adbb]" : "text-[#c9a84c]"}`}>
              {row.rankLabel}
            </span>
            <CountryBadge code={row.creator.countryCode} tone="light" />
            <span className="flex min-w-0 items-center gap-3 pr-2">
              <CreatorAvatar creator={row.creator} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-[#071a33]">{row.creator.name}</span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#8b95a7]">@{row.creator.handle}</span>
              </span>
            </span>
            <span className="text-right">
              <span className="block text-sm font-black text-[#071a33]">{row.creator.points.toLocaleString()}</span>
              <span className="mt-1 flex justify-end">
                <RankMovement movement={row.movement} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FullLeaderboardSheet({
  countries,
  countryFilter,
  genderFilter,
  isOpen,
  onClose,
  onSelectCreator,
  rows,
  search,
  setCountryFilter,
  setGenderFilter,
  setSearch,
  viewerId
}: {
  countries: { code: string; label: string }[];
  countryFilter: string;
  genderFilter: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectCreator: (creator: Creator) => void;
  rows: RankedCreator[];
  search: string;
  setCountryFilter: (value: string) => void;
  setGenderFilter: (value: string) => void;
  setSearch: (value: string) => void;
  viewerId?: string;
}) {
  return (
    <ModalSheet eyebrow="Leaderboard" isOpen={isOpen} onClose={onClose} title="Full leaderboard" tone="light" variant="bottom">
      <SearchField search={search} setSearch={setSearch} />
      <LeaderboardFilters
        countries={countries}
        countryFilter={countryFilter}
        genderFilter={genderFilter}
        setCountryFilter={setCountryFilter}
        setGenderFilter={setGenderFilter}
      />
      <LeaderboardList
        emptyBody="No creators match the active search and filters."
        emptyTitle="No matching creators"
        rows={rows}
        viewerId={viewerId}
        onSelectCreator={onSelectCreator}
      />
    </ModalSheet>
  );
}

function RankMovement({ movement }: { movement: number }) {
  if (movement > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-600">
        <ArrowUp size={10} />
        {movement}
      </span>
    );
  }

  if (movement < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black text-red-500">
        <ArrowDown size={10} />
        {Math.abs(movement)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2f8] px-2 py-0.5 text-[9px] font-black text-[#8b95a7]">
      <Minus size={10} />
      0
    </span>
  );
}

function CountryBadge({ code, tone }: { code: string; tone: "dark" | "light" }) {
  return (
    <span
      className={`mt-2 inline-flex min-h-5 min-w-8 items-center justify-center rounded-md px-1.5 text-[9px] font-black ${
        tone === "dark"
          ? "border border-white/10 bg-white/10 text-white/74"
          : "border border-[#d7dde8] bg-[#eef2f8] text-[#5f6b7d]"
      }`}
    >
      {code || "GCT"}
    </span>
  );
}

function buildPodiumCreators(creators: Creator[]) {
  const rankedExempt = creators
    .filter((creator) => creator.isExempt && (parseRankNumber(creator.rank) ?? 0) > 0)
    .sort((a, b) => {
      const aRank = parseRankNumber(a.rank) ?? Number.MAX_SAFE_INTEGER;
      const bRank = parseRankNumber(b.rank) ?? Number.MAX_SAFE_INTEGER;
      return aRank - bRank || b.points - a.points || a.name.localeCompare(b.name);
    })
    .slice(0, 3);

  return [rankedExempt[1], rankedExempt[0], rankedExempt[2]].filter((creator): creator is Creator => Boolean(creator));
}

function buildRankedCreators(creators: Creator[], exemptCount: number): RankedCreator[] {
  const standardCreators = creators
    .filter((creator) => !creator.isExempt)
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  const pointCounts = new Map<number, number>();

  standardCreators.forEach((creator) => {
    if (creator.points > 0) pointCounts.set(creator.points, (pointCounts.get(creator.points) ?? 0) + 1);
  });

  let positiveIndex = 0;
  let previousPoints: number | null = null;
  let previousRank = exemptCount;

  return standardCreators.map((creator) => {
    if (creator.points <= 0) {
      return {
        creator,
        isTie: false,
        movement: creator.rankMovement ?? 0,
        rankLabel: NO_RANK
      };
    }

    positiveIndex += 1;
    if (creator.points !== previousPoints) previousRank = exemptCount + positiveIndex;
    previousPoints = creator.points;

    const isTie = (pointCounts.get(creator.points) ?? 0) > 1;
    return {
      creator,
      isTie,
      movement: creator.rankMovement ?? 0,
      rankLabel: `${isTie ? "T" : ""}${previousRank}`
    };
  });
}

function filterLeaderboard(rows: RankedCreator[], search: string, country: string, gender: string) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    const creator = row.creator;
    const searchValue = [creator.name, creator.handle, creator.location, creator.memberNumber]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !query || searchValue.includes(query);
    const matchesCountry = country === "all" || creator.countryCode === country;
    const matchesGender = gender === "all" || genderValue(creator.gender) === gender;
    return matchesSearch && matchesCountry && matchesGender;
  });
}

function buildCountryOptions(rows: RankedCreator[]) {
  const countryMap = new Map<string, string>();
  rows.forEach(({ creator }) => {
    if (creator.countryCode) countryMap.set(creator.countryCode, creator.country || creator.countryCode);
  });

  return Array.from(countryMap, ([code, label]) => ({ code, label })).sort((a, b) => a.label.localeCompare(b.label));
}

function buildActivityItems(data: DashboardSnapshot, rows: RankedCreator[], podiumCreators: Creator[]): ActivityItem[] {
  const notificationItems = data.notifications.slice(0, 2).map((notification) => ({
    detail: notification.body,
    id: notification.id,
    title: notification.title
  }));

  if (notificationItems.length > 0) return notificationItems;

  const movers = rows.filter((row) => row.movement !== 0).slice(0, 2);
  if (movers.length > 0) {
    return movers.map((row) => ({
      detail: `${row.creator.points.toLocaleString()} Tour Points`,
      id: `movement-${row.creator.id}`,
      movement: row.movement,
      title: `${row.creator.name} moved to ${row.rankLabel}`
    }));
  }

  if (podiumCreators.length > 0) {
    const champion = podiumCreators[1] ?? podiumCreators[0];
    return [
      {
        detail: "Champion exemption podium is locked for the active season.",
        id: `podium-${champion.id}`,
        title: `${champion.name} holds the exemption lead`
      }
    ];
  }

  return [
    {
      detail: "Leaderboard activity will appear as creators earn Tour Points.",
      id: "activity-empty",
      title: "Waiting for first scoring event"
    }
  ];
}

function findViewerRank(viewer: Creator | null, rows: RankedCreator[]) {
  if (!viewer) return NO_RANK;
  const standardRow = rows.find((row) => row.creator.id === viewer.id);
  if (standardRow) return standardRow.rankLabel;
  return viewer.points > 0 ? viewer.rank : viewer.rank || NO_RANK;
}

function genderValue(gender?: CreatorGender) {
  return gender ?? "unspecified";
}

function parseRankNumber(rank: string) {
  const parsed = Number.parseInt(rank.replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}
