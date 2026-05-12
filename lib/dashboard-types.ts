export type MembershipTier = "standard" | "premium" | "elite" | "founder";

export type SocialPlatform = "youtube" | "tiktok" | "instagram";

export type CreatorGender = "M" | "F" | "NB" | null;

export type SocialStat = {
  platform: SocialPlatform;
  handle: string;
  followers: string;
  connected: boolean;
};

export type Creator = {
  id: string;
  name: string;
  handle: string;
  location: string;
  country: string;
  countryCode: string;
  gender?: CreatorGender;
  tier: MembershipTier;
  rank: string;
  rankMovement?: number;
  points: number;
  followers: string;
  memberNumber: string;
  avatarTone: string;
  initials: string;
  isExempt?: boolean;
  status: "Qualified" | "Exempt" | "Scramble" | "Tracking";
  record: string;
  challengesCompleted: number;
  currentStreak: number;
  socials: SocialStat[];
  sponsors: string[];
  golfBag: string[];
  bio: string;
};

export type ChallengeTier = "Standard" | "Premium" | "Elite" | "GCT";

export type Challenge = {
  id: string;
  title: string;
  brand: string;
  tier: ChallengeTier;
  points: number;
  status: "Open" | "Joined" | "Submitted" | "Coming Soon" | "Closed";
  deadline: string;
  spots: number;
  filled: number;
  color: string;
  tagline: string;
  description: string;
  requirements: string[];
  participants: Pick<Creator, "id" | "name" | "handle" | "initials" | "avatarTone" | "isExempt">[];
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "achievement" | "match" | "streak" | "challenge" | "system";
  read?: boolean;
};

export type DashboardStat = {
  label: string;
  value: string;
  tone?: "default" | "gold";
};

export type DashboardShellSnapshot = {
  isAdmin: boolean;
  notifications: NotificationItem[];
  unreadMessages: number;
  unreadNotifications: number;
};

export type DashboardSnapshot = DashboardShellSnapshot & {
  viewer: Creator | null;
  creators: Creator[];
  nearbyCreators: Creator[];
  challenges: Challenge[];
  profileStats: DashboardStat[];
  competeStats: DashboardStat[];
  createStats: DashboardStat[];
  connectStats: DashboardStat[];
  seasonLabel: string;
  loadError?: string;
};

export const emptyDashboardShellSnapshot: DashboardShellSnapshot = {
  isAdmin: false,
  notifications: [],
  unreadMessages: 0,
  unreadNotifications: 0
};

export const emptyDashboardSnapshot: DashboardSnapshot = {
  ...emptyDashboardShellSnapshot,
  viewer: null,
  creators: [],
  nearbyCreators: [],
  challenges: [],
  profileStats: [
    { label: "Points", value: "0", tone: "gold" },
    { label: "Challenges", value: "0" },
    { label: "Matches", value: "0-0" }
  ],
  competeStats: [
    { label: "Your Rank", value: "Unranked", tone: "gold" },
    { label: "Your Points", value: "0" },
    { label: "Total", value: "0" }
  ],
  createStats: [
    { label: "Your Points", value: "0", tone: "gold" },
    { label: "Completed", value: "0" },
    { label: "Active", value: "0" }
  ],
  connectStats: [
    { label: "Nearby", value: "0" },
    { label: "Sent", value: "0", tone: "gold" },
    { label: "Requests", value: "0" }
  ],
  seasonLabel: "Season"
};
