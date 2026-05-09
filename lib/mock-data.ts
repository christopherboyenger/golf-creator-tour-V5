export type MembershipTier = "standard" | "premium" | "elite" | "founder";

export type SocialPlatform = "youtube" | "tiktok" | "instagram";

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
  tier: MembershipTier;
  rank: string;
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
  status: "Open" | "Joined" | "Submitted" | "Coming Soon";
  deadline: string;
  spots: number;
  filled: number;
  color: string;
  tagline: string;
  description: string;
  requirements: string[];
  participants: Pick<Creator, "id" | "name" | "handle" | "initials" | "avatarTone">[];
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "achievement" | "match" | "streak" | "challenge" | "system";
  read?: boolean;
};

export const currentCreator: Creator = {
  id: "chris-boyenger",
  name: "Chris Boyenger",
  handle: "chrisboyenger",
  location: "West Palm Beach, FL",
  country: "United States",
  countryCode: "US",
  tier: "founder",
  rank: "#0",
  points: 5591,
  followers: "96.7K",
  memberNumber: "GCT-000",
  avatarTone: "from-[#416f54] to-[#1e2f49]",
  initials: "CB",
  isExempt: true,
  status: "Exempt",
  record: "2-0",
  challengesCompleted: 3,
  currentStreak: 7,
  socials: [
    { platform: "youtube", handle: "chrisboyenger", followers: "214", connected: true },
    { platform: "tiktok", handle: "chrisboyenger", followers: "10.0K", connected: true },
    { platform: "instagram", handle: "chrisboyenger", followers: "86.5K", connected: true }
  ],
  sponsors: ["L.A.B. Golf", "Garmin Golf"],
  golfBag: ["Titleist TSR3 Driver", "L.A.B. DF3 Putter", "Vokey SM10 Wedges"],
  bio: "Founder and tour host building the creator competition layer for golf."
};

export const creators: Creator[] = [
  {
    id: "keaton-veilllette",
    name: "Keaton Veilllette",
    handle: "Keaton_V",
    location: "Toronto, ON",
    country: "Canada",
    countryCode: "CA",
    tier: "elite",
    rank: "1",
    points: 294,
    followers: "121K",
    memberNumber: "GCT-001",
    avatarTone: "from-[#d4d0c4] to-[#6a7568]",
    initials: "KV",
    isExempt: true,
    status: "Exempt",
    record: "4-1",
    challengesCompleted: 5,
    currentStreak: 12,
    socials: [
      { platform: "instagram", handle: "keaton_v", followers: "72.1K", connected: true },
      { platform: "tiktok", handle: "keaton_v", followers: "48.9K", connected: true }
    ],
    sponsors: ["TaylorMade", "Greyson"],
    golfBag: ["Qi10 Driver", "Spider Tour Putter"],
    bio: "Short game creator and 2025 champion exemption holder."
  },
  {
    id: "jose-palayo",
    name: "Jose Palayo",
    handle: "josepelayogolf",
    location: "Orlando, FL",
    country: "United States",
    countryCode: "US",
    tier: "elite",
    rank: "2",
    points: 209,
    followers: "84.2K",
    memberNumber: "GCT-002",
    avatarTone: "from-[#191d1d] to-[#55615f]",
    initials: "JP",
    isExempt: true,
    status: "Exempt",
    record: "3-2",
    challengesCompleted: 4,
    currentStreak: 9,
    socials: [
      { platform: "instagram", handle: "josepelayogolf", followers: "62.4K", connected: true },
      { platform: "youtube", handle: "josepelayogolf", followers: "21.8K", connected: true }
    ],
    sponsors: ["Callaway", "Linksoul"],
    golfBag: ["Paradym Driver", "Chrome Tour Ball"],
    bio: "Course vlogs, match play, and Florida creator events."
  },
  {
    id: "cannon-claycomb",
    name: "Cannon Claycomb",
    handle: "cannonclaycomb",
    location: "Dallas, TX",
    country: "United States",
    countryCode: "US",
    tier: "elite",
    rank: "3",
    points: 0,
    followers: "65.8K",
    memberNumber: "GCT-003",
    avatarTone: "from-[#9ab4d1] to-[#284766]",
    initials: "CC",
    isExempt: true,
    status: "Exempt",
    record: "1-0",
    challengesCompleted: 2,
    currentStreak: 4,
    socials: [
      { platform: "instagram", handle: "cannonclaycomb", followers: "65.8K", connected: true }
    ],
    sponsors: ["Puma Golf"],
    golfBag: ["Cobra Driver", "Scotty Cameron Putter"],
    bio: "Tour-level creator with an exemption into the 2026 field."
  },
  currentCreator,
  {
    id: "epiphany-price",
    name: "Epiphany Price",
    handle: "epiphanygolf",
    location: "Atlanta, GA",
    country: "United States",
    countryCode: "US",
    tier: "premium",
    rank: "12",
    points: 1880,
    followers: "41.5K",
    memberNumber: "GCT-018",
    avatarTone: "from-[#955e7a] to-[#2c3158]",
    initials: "EP",
    status: "Qualified",
    record: "2-1",
    challengesCompleted: 6,
    currentStreak: 5,
    socials: [
      { platform: "instagram", handle: "epiphanygolf", followers: "35.4K", connected: true },
      { platform: "tiktok", handle: "epiphanygolf", followers: "6.1K", connected: true }
    ],
    sponsors: ["Rhoback"],
    golfBag: ["Ping G430 Driver", "Odyssey Eleven Putter"],
    bio: "Golf creator focused on women in the game and match-day stories."
  },
  {
    id: "maya-rowan",
    name: "Maya Rowan",
    handle: "mayarowangolf",
    location: "San Diego, CA",
    country: "United States",
    countryCode: "US",
    tier: "standard",
    rank: "23",
    points: 940,
    followers: "18.2K",
    memberNumber: "GCT-044",
    avatarTone: "from-[#be7b4e] to-[#364d64]",
    initials: "MR",
    status: "Scramble",
    record: "0-1",
    challengesCompleted: 3,
    currentStreak: 2,
    socials: [
      { platform: "instagram", handle: "mayarowangolf", followers: "18.2K", connected: true }
    ],
    sponsors: [],
    golfBag: ["Mizuno JPX Irons", "Odyssey White Hot Putter"],
    bio: "Range sessions, public course reviews, and creator meetups."
  }
];

export const challenges: Challenge[] = [
  {
    id: "lab-putter",
    title: "L.A.B. Putter Challenge",
    brand: "L.A.B. Golf",
    tier: "Standard",
    points: 350,
    status: "Open",
    deadline: "June 14, 2026",
    spots: 100,
    filled: 42,
    color: "#c9a84c",
    tagline: "Show us your most confident roll.",
    description:
      "Create a short-form putting video featuring a practice routine, a made putt, and a caption that tags the brand challenge.",
    requirements: [
      "Post one vertical video to Instagram Reels or TikTok.",
      "Show the setup, stroke, and result in the final edit.",
      "Tag the brand and include the GCT challenge caption."
    ],
    participants: [currentCreator, creators[4], creators[5]]
  },
  {
    id: "2k25-match-play",
    title: "TPGK 2K25 Match Play Challenge",
    brand: "2K Golf",
    tier: "Premium",
    points: 300,
    status: "Submitted",
    deadline: "May 28, 2026",
    spots: 64,
    filled: 61,
    color: "#7c3aed",
    tagline: "Turn a match into content.",
    description:
      "Capture a head-to-head creator match and package the story as a quick recap with a winner, score, and highlight.",
    requirements: [
      "Record the opening tee shot and winning moment.",
      "Include both creator handles in the caption.",
      "Submit the public post URL before the deadline."
    ],
    participants: [creators[1], creators[4]]
  },
  {
    id: "garmin-shot-map",
    title: "Garmin Shot Map",
    brand: "Garmin Golf",
    tier: "Elite",
    points: 500,
    status: "Open",
    deadline: "July 8, 2026",
    spots: 24,
    filled: 14,
    color: "#13a6b8",
    tagline: "Bring the data into the story.",
    description:
      "Use course data or shot tracking as the hook for a premium creator post about preparation, strategy, and execution.",
    requirements: [
      "Show one data point that changed your shot decision.",
      "Include a course visual or scorecard moment.",
      "Tag Garmin Golf and GCT in the post."
    ],
    participants: [creators[0], currentCreator]
  },
  {
    id: "giveaway-open",
    title: "Giveaway Challenge",
    brand: "Golf Creator Tour",
    tier: "GCT",
    points: 0,
    status: "Coming Soon",
    deadline: "TBD",
    spots: 0,
    filled: 0,
    color: "#1d2d50",
    tagline: "Platform-wide reward drop.",
    description:
      "A GCT-wide giveaway challenge reserved for the next campaign window.",
    requirements: ["Details will unlock when the campaign opens."],
    participants: []
  }
];

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Achievement Unlocked: Challenge Accepted",
    body: "Your L.A.B. Putter Challenge submission was approved.",
    time: "May 7, 11:21 PM",
    type: "achievement"
  },
  {
    id: "n2",
    title: "Achievement Unlocked: Challenge Accepted",
    body: "Your TPGK 2K25 Match Play Challenge submission was approved.",
    time: "May 7, 11:20 PM",
    type: "achievement"
  },
  {
    id: "n3",
    title: "Match Accepted",
    body: "Epiphany Price accepted your match challenge.",
    time: "May 6, 11:06 AM",
    type: "match"
  },
  {
    id: "n4",
    title: "7-Day Streak",
    body: "You have logged in 7 days in a row. Keep going.",
    time: "May 4, 08:07 PM",
    type: "streak"
  },
  {
    id: "n5",
    title: "New Challenge: L.A.B. Putter Challenge",
    body: "A new brand challenge is now open - 350 points available.",
    time: "May 2, 06:12 PM",
    type: "challenge",
    read: true
  }
];

export const profileStats = [
  { label: "Points", value: "5,591", tone: "gold" },
  { label: "Challenges", value: "3", tone: "default" },
  { label: "Matches", value: "2", tone: "default" }
] as const;

export const createStats = [
  { label: "Your Points", value: "5,591", tone: "gold" },
  { label: "Completed", value: "3", tone: "default" },
  { label: "Active", value: "0", tone: "default" }
] as const;

export const connectStats = [
  { label: "Nearby", value: "6", tone: "default" },
  { label: "Sent", value: "3", tone: "gold" },
  { label: "Requests", value: "0", tone: "default" }
] as const;
