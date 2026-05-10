import { createClient } from "@/lib/supabase/server";
import {
  emptyDashboardShellSnapshot,
  emptyDashboardSnapshot,
  type Challenge,
  type ChallengeTier,
  type Creator,
  type DashboardShellSnapshot,
  type DashboardSnapshot,
  type NotificationItem,
  type SocialPlatform
} from "@/lib/dashboard-types";
import type {
  Challenge as DbChallenge,
  ChallengeParticipation,
  Creator as DbCreator,
  CreatorSeasonStats,
  CreatorSponsor,
  GolfBagItem,
  Match,
  Notification,
  Season,
  SocialConnection
} from "@/types/database";

type CreatorRow = Partial<DbCreator> & {
  creator_season_stats?: Partial<CreatorSeasonStats>[];
  social_connections?: Partial<SocialConnection>[];
  creator_sponsors?: Partial<CreatorSponsor>[];
  golf_bag_items?: Partial<GolfBagItem>[];
};

type ChallengeRow = Partial<DbChallenge>;

type ChallengeParticipantRow = Partial<ChallengeParticipation> & {
  creator?: CreatorRow | null;
};

type MatchCounts = {
  active: number;
  requests: number;
  sent: number;
  unread: number;
};

const avatarTones = [
  "from-[#416f54] to-[#1e2f49]",
  "from-[#d4d0c4] to-[#6a7568]",
  "from-[#191d1d] to-[#55615f]",
  "from-[#9ab4d1] to-[#284766]",
  "from-[#955e7a] to-[#2c3158]",
  "from-[#be7b4e] to-[#364d64]",
  "from-[#34495e] to-[#0f1b2e]"
];

const countryNames: Record<string, string> = {
  AU: "Australia",
  CA: "Canada",
  GB: "United Kingdom",
  UK: "United Kingdom",
  US: "United States",
  USA: "United States"
};

const countryCodes: Record<string, string> = {
  australia: "AU",
  canada: "CA",
  "united kingdom": "GB",
  "united states": "US",
  usa: "US"
};

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function firstRow<T>(value: T[] | null | undefined): T | undefined {
  return asArray(value)[0];
}

function formatNumber(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("en-US");
}

function formatCompactNumber(value: number | null | undefined) {
  const next = value ?? 0;
  if (next >= 1_000_000) return `${trimNumber(next / 1_000_000)}M`;
  if (next >= 1_000) return `${trimNumber(next / 1_000)}K`;
  return formatNumber(next);
}

function trimNumber(value: number) {
  return value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, "");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function initialsFromName(name?: string | null) {
  const parts = (name || "GCT Creator")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (parts[0]?.[0] || "G") + (parts[1]?.[0] || parts[0]?.[1] || "C");
}

function toneFromId(id?: string | null) {
  if (!id) return avatarTones[0];
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }
  return avatarTones[Math.abs(hash) % avatarTones.length];
}

function countryCode(country?: string | null) {
  const clean = country?.trim();
  if (!clean) return "US";
  const upper = clean.toUpperCase();
  if (upper.length <= 3) return upper === "USA" ? "US" : upper;
  return countryCodes[clean.toLowerCase()] ?? upper.slice(0, 2);
}

function countryName(country?: string | null) {
  const code = countryCode(country);
  return countryNames[code] ?? country?.trim() ?? "United States";
}

function locationFromCreator(creator: CreatorRow) {
  const city = creator.city?.trim();
  const state = creator.state?.trim();
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return countryName(creator.country);
}

function normalizeTier(creator: CreatorRow): Creator["tier"] {
  if (creator.founder_type || creator.tier === "founder") return "founder";
  if (creator.tier === "premium" || creator.tier === "elite") return creator.tier;
  return "standard";
}

function normalizeChallengeTier(tier?: string | null): ChallengeTier {
  if (tier === "Premium" || tier === "Elite" || tier === "GCT") return tier;
  return "Standard";
}

function normalizeSocialPlatform(platform?: string | null): SocialPlatform | null {
  if (platform === "instagram" || platform === "tiktok" || platform === "youtube") return platform;
  return null;
}

function socialFollowerTotal(socials: Partial<SocialConnection>[]) {
  return socials
    .filter((social) => social.connected)
    .reduce((sum, social) => sum + (social.followers ?? 0), 0);
}

function mapCreator(creator: CreatorRow): Creator {
  const stats = firstRow(creator.creator_season_stats);
  const socials = asArray(creator.social_connections);
  const totalFollowers = socialFollowerTotal(socials) || creator.total_followers || 0;
  const isExempt = Boolean(creator.is_exempt);
  const rankValue = isExempt
    ? String(creator.exempt_rank ?? stats?.rank ?? 0)
    : stats?.rank
      ? `#${stats.rank}`
      : "Unranked";
  const points = stats?.total_points ?? 0;
  const tier = normalizeTier(creator);
  const sponsors = asArray(creator.creator_sponsors)
    .map((sponsor) => sponsor.name)
    .filter((name): name is string => Boolean(name));
  const golfBag = asArray(creator.golf_bag_items)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((item) => [item.brand, item.model].filter(Boolean).join(" ").trim() || item.club_type || "Golf club");

  return {
    id: creator.id || "creator",
    name: creator.name || "GCT Creator",
    handle: creator.handle || "gctcreator",
    location: locationFromCreator(creator),
    country: countryName(creator.country),
    countryCode: countryCode(creator.country),
    tier,
    rank: rankValue,
    gender: creator.gender ?? null,
    points,
    followers: formatCompactNumber(totalFollowers),
    memberNumber: creator.member_number || "GCT-2026",
    avatarTone: toneFromId(creator.id),
    initials: initialsFromName(creator.name),
    isExempt,
    status: isExempt ? "Exempt" : stats?.is_qualified ? "Qualified" : points > 0 ? "Tracking" : "Scramble",
    record: `${stats?.matches_won ?? 0}-${stats?.matches_lost ?? 0}`,
    challengesCompleted: stats?.challenges_completed ?? 0,
    currentStreak: stats?.current_streak ?? creator.current_streak ?? 0,
    socials: socials
      .map((social) => {
        const platform = normalizeSocialPlatform(social.platform);
        if (!platform) return null;
        return {
          platform,
          handle: social.handle || "",
          followers: formatCompactNumber(social.followers),
          connected: Boolean(social.connected)
        };
      })
      .filter((social): social is Creator["socials"][number] => Boolean(social)),
    sponsors,
    golfBag,
    bio: creator.bio || "Golf creator competing on the Golf Creator Tour."
  };
}

function sortCreators(creators: Creator[]) {
  return [...creators].sort((a, b) => {
    if (a.isExempt && b.isExempt) {
      const aRank = Number.parseInt(a.rank, 10) || Number.MAX_SAFE_INTEGER;
      const bRank = Number.parseInt(b.rank, 10) || Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return b.points - a.points;
    }
    if (a.isExempt) return -1;
    if (b.isExempt) return 1;
    return b.points - a.points || a.name.localeCompare(b.name);
  });
}

function challengeStatus(
  challenge: ChallengeRow,
  myParticipation?: Partial<ChallengeParticipation>
): Challenge["status"] {
  if (myParticipation?.status === "submitted" || myParticipation?.status === "approved") return "Submitted";
  if (myParticipation?.status === "enrolled") return "Joined";
  if (challenge.status === "open" || challenge.status === "active" || challenge.status === "judging") return "Open";
  if (challenge.status === "completed" || challenge.status === "cancelled") return "Closed";
  return "Coming Soon";
}

function mapChallenge(
  challenge: ChallengeRow,
  myParticipation?: Partial<ChallengeParticipation>,
  participants: ChallengeParticipantRow[] = []
): Challenge {
  const participantCreators = participants
    .map((participant) => (participant.creator ? mapCreator(participant.creator) : null))
    .filter((creator): creator is Creator => Boolean(creator));

  return {
    id: challenge.id || "challenge",
    title: challenge.title || "GCT Challenge",
    brand: challenge.brand || "Golf Creator Tour",
    tier: normalizeChallengeTier(challenge.tier),
    points: challenge.points ?? 0,
    status: challengeStatus(challenge, myParticipation),
    deadline: formatDate(challenge.deadline),
    spots: challenge.max_slots ?? 0,
    filled: challenge.filled_slots ?? participantCreators.length,
    color: challenge.color || "#c9a84c",
    tagline: challenge.brand_tag || "Create, submit, and earn Tour Points.",
    description: challenge.description || "Challenge details will appear here when the campaign opens.",
    requirements: challenge.requirements?.length
      ? challenge.requirements
      : ["Follow the challenge brief.", "Post the required content.", "Submit the public URL for review."],
    participants: participantCreators.map(({ id, name, handle, initials, avatarTone, isExempt }) => ({
      id,
      name,
      handle,
      initials,
      avatarTone,
      isExempt
    }))
  };
}

function notificationType(type?: string | null): NotificationItem["type"] {
  if (!type) return "system";
  if (type.startsWith("match_")) return "match";
  if (type.startsWith("challenge_")) return "challenge";
  if (type === "achievement_unlocked") return "achievement";
  if (type === "streak_milestone" || type === "follower_milestone") return "streak";
  return "system";
}

function mapNotification(notification: Partial<Notification>): NotificationItem {
  return {
    id: notification.id || "notification",
    title: notification.title || "Tour Update",
    body: notification.body || "A new Golf Creator Tour update is available.",
    time: formatTimestamp(notification.created_at),
    type: notificationType(notification.type),
    read: Boolean(notification.read)
  };
}

async function getActiveSeason(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Season | null) ?? null;
}

async function getViewerRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authUserId: string,
  seasonId?: string
) {
  let query = supabase
    .from("creators")
    .select(
      `
      *,
      creator_season_stats (
        id, creator_id, season_id, total_points, rank,
        challenges_completed, challenges_active,
        matches_won, matches_lost, current_streak, best_streak, is_qualified
      ),
      social_connections (*),
      creator_sponsors (*),
      golf_bag_items (*)
    `
    )
    .eq("auth_user_id", authUserId);

  if (seasonId) query = query.eq("creator_season_stats.season_id", seasonId);

  const { data } = await query.maybeSingle();
  return (data as CreatorRow | null) ?? null;
}

async function getLeaderboardRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  seasonId?: string
) {
  let query = supabase
    .from("creators")
    .select(
      `
      id, auth_user_id, member_number, name, handle, country, state, city, gender,
      tier, is_exempt, exempt_rank, founder_type, avatar_url, bio,
      status, role, current_streak, total_followers,
      creator_season_stats (
        total_points, rank, challenges_completed, matches_won,
        matches_lost, current_streak, is_qualified
      ),
      social_connections (platform, handle, followers, connected)
    `
    )
    .in("status", ["pending", "approved_not_activated", "active"])
    .not("role", "in", "(admin,team,superadmin)")
    .order("name", { ascending: true })
    .limit(120);

  if (seasonId) query = query.eq("creator_season_stats.season_id", seasonId);

  const { data } = await query;
  return (data as CreatorRow[] | null) ?? [];
}

async function getChallengeRows(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .in("status", ["open", "active", "judging", "completed"])
    .order("deadline", { ascending: true })
    .limit(30);

  return (data as ChallengeRow[] | null) ?? [];
}

async function getMyParticipations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId: string
) {
  const { data } = await supabase
    .from("challenge_participations")
    .select("*")
    .eq("creator_id", creatorId);

  return (data as Partial<ChallengeParticipation>[] | null) ?? [];
}

async function getChallengeParticipants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeIds: string[]
) {
  if (challengeIds.length === 0) return [];

  const { data } = await supabase
    .from("challenge_participations")
    .select(
      `
      id, challenge_id, creator_id, status,
      creator:creators!challenge_participations_creator_id_fkey (
        id, member_number, name, handle, country, state, city, gender, tier,
        is_exempt, exempt_rank, founder_type, avatar_url, bio,
        current_streak, total_followers,
        social_connections (platform, handle, followers, connected)
      )
    `
    )
    .in("challenge_id", challengeIds)
    .limit(120);

  return (data as ChallengeParticipantRow[] | null) ?? [];
}

async function getNotificationRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId: string,
  limit = 20
) {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as Partial<Notification>[] | null) ?? [];
}

async function getMatchCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId: string
): Promise<MatchCounts> {
  const { data: matches } = await supabase
    .from("matches")
    .select("id, challenger_id, opponent_id, status")
    .or(`challenger_id.eq.${creatorId},opponent_id.eq.${creatorId}`)
    .order("challenged_at", { ascending: false })
    .limit(100);

  const rows = ((matches as Partial<Match>[] | null) ?? []).filter((match) => match.id);
  const active = rows.filter((match) => match.status === "accepted" || match.status === "in_progress").length;
  const requests = rows.filter((match) => match.status === "pending" && match.opponent_id === creatorId).length;
  const sent = rows.filter((match) => match.status === "pending" && match.challenger_id === creatorId).length;
  const activeMatchIds = rows
    .filter((match) => match.status === "accepted" || match.status === "in_progress")
    .map((match) => match.id)
    .filter((id): id is string => Boolean(id));

  let unread = 0;
  if (activeMatchIds.length > 0) {
    const { count } = await supabase
      .from("match_messages")
      .select("*", { count: "exact", head: true })
      .in("match_id", activeMatchIds)
      .neq("sender_id", creatorId);
    unread = count ?? 0;
  }

  return { active, requests, sent, unread };
}

function buildSnapshot({
  challenges,
  creators,
  isAdmin,
  matchCounts,
  notifications,
  season,
  viewer
}: {
  challenges: Challenge[];
  creators: Creator[];
  matchCounts: MatchCounts;
  notifications: NotificationItem[];
  season: Season | null;
  viewer: Creator;
  isAdmin: boolean;
}): DashboardSnapshot {
  const ranked = sortCreators(creators.some((creator) => creator.id === viewer.id) ? creators : [viewer, ...creators]);
  const nearbyCreators = ranked.filter((creator) => creator.id !== viewer.id);
  const activeChallengeCount = challenges.filter((challenge) => challenge.status === "Joined").length;
  const completedChallengeCount = Math.max(
    viewer.challengesCompleted,
    challenges.filter((challenge) => challenge.status === "Submitted").length
  );

  return {
    ...emptyDashboardSnapshot,
    isAdmin,
    notifications,
    unreadMessages: matchCounts.unread,
    unreadNotifications: notifications.filter((notification) => !notification.read).length,
    viewer,
    creators: ranked,
    nearbyCreators,
    challenges,
    profileStats: [
      { label: "Points", value: formatNumber(viewer.points), tone: "gold" },
      { label: "Challenges", value: String(completedChallengeCount) },
      { label: "Matches", value: matchCounts.active ? String(matchCounts.active) : viewer.record }
    ],
    competeStats: [
      { label: "Your Rank", value: viewer.rank, tone: "gold" },
      { label: "Your Points", value: formatNumber(viewer.points) },
      { label: "Total", value: String(ranked.length) }
    ],
    createStats: [
      { label: "Your Points", value: formatNumber(viewer.points), tone: "gold" },
      { label: "Completed", value: String(completedChallengeCount) },
      { label: "Active", value: String(activeChallengeCount) }
    ],
    connectStats: [
      { label: "Nearby", value: String(nearbyCreators.length) },
      { label: "Sent", value: String(matchCounts.sent), tone: "gold" },
      { label: "Requests", value: String(matchCounts.requests) }
    ],
    seasonLabel: season?.year ? `Season ${season.year}` : "Season"
  };
}

export async function getDashboardShellSnapshot(): Promise<DashboardShellSnapshot> {
  if (!hasSupabaseEnv()) return emptyDashboardShellSnapshot;

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return emptyDashboardShellSnapshot;

    const { data: creator } = await supabase
      .from("creators")
      .select("id,role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const creatorId = creator?.id as string | undefined;
    if (!creatorId) return emptyDashboardShellSnapshot;

    const [notificationRows, matchCounts] = await Promise.all([
      getNotificationRows(supabase, creatorId, 12),
      getMatchCounts(supabase, creatorId)
    ]);
    const notifications = notificationRows.map(mapNotification);

    return {
      isAdmin: creator?.role === "admin" || creator?.role === "superadmin",
      notifications,
      unreadMessages: matchCounts.unread,
      unreadNotifications: notifications.filter((notification) => !notification.read).length
    };
  } catch {
    return emptyDashboardShellSnapshot;
  }
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!hasSupabaseEnv()) {
    return {
      ...emptyDashboardSnapshot,
      loadError: "Supabase environment variables are not configured."
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ...emptyDashboardSnapshot,
        loadError: "Sign in to load your dashboard."
      };
    }

    const season = await getActiveSeason(supabase);
    const viewerRow = await getViewerRow(supabase, user.id, season?.id);

    if (!viewerRow?.id) {
      return {
        ...emptyDashboardSnapshot,
        loadError: "No approved creator profile is linked to this account."
      };
    }

    const [leaderboardRows, challengeRows, participations, notificationRows, matchCounts] = await Promise.all([
      getLeaderboardRows(supabase, season?.id),
      getChallengeRows(supabase),
      getMyParticipations(supabase, viewerRow.id),
      getNotificationRows(supabase, viewerRow.id),
      getMatchCounts(supabase, viewerRow.id)
    ]);

    const challengeIds = challengeRows.map((challenge) => challenge.id).filter((id): id is string => Boolean(id));
    const participantRows = await getChallengeParticipants(supabase, challengeIds);
    const participationByChallenge = new Map(
      participations
        .filter((participation) => participation.challenge_id)
        .map((participation) => [participation.challenge_id as string, participation])
    );
    const participantsByChallenge = new Map<string, ChallengeParticipantRow[]>();
    participantRows.forEach((participant) => {
      if (!participant.challenge_id) return;
      const current = participantsByChallenge.get(participant.challenge_id) ?? [];
      current.push(participant);
      participantsByChallenge.set(participant.challenge_id, current);
    });

    const viewer = mapCreator(viewerRow);
    const creators = leaderboardRows.map(mapCreator);
    const challenges = challengeRows.map((challenge) =>
      mapChallenge(
        challenge,
        challenge.id ? participationByChallenge.get(challenge.id) : undefined,
        challenge.id ? participantsByChallenge.get(challenge.id) : undefined
      )
    );
    const notifications = notificationRows.map(mapNotification);

    return buildSnapshot({
      challenges,
      creators,
      isAdmin: viewerRow.role === "admin" || viewerRow.role === "superadmin",
      matchCounts,
      notifications,
      season,
      viewer
    });
  } catch (error) {
    return {
      ...emptyDashboardSnapshot,
      loadError: error instanceof Error ? error.message : "Dashboard data is unavailable right now."
    };
  }
}
