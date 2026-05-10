/* ═══════════════════════════════════════════
   GCT V4.1 — Typed Supabase Schema
   Matches ACTUAL database (UUID IDs, real column names)
   Updated: notifications, golf_bag, golf data states, founder
   ═══════════════════════════════════════════ */

export type Tier = 'standard' | 'premium' | 'elite' | 'founder';
export type CreatorStatus = 'pending' | 'invited' | 'approved_not_activated' | 'active' | 'suspended' | 'banned' | 'rejected';
export type CreatorRole = 'creator' | 'team' | 'admin' | 'superadmin';
export type FounderType = 'founder' | 'co_founder' | null;
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Creator {
  id: string;
  auth_user_id: string | null;
  member_number: string;
  name: string;
  handle: string;
  email: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  gender: 'M' | 'F' | 'NB' | null;
  handicap: number | null;
  tier: Tier;
  is_exempt: boolean;
  exempt_rank: number | null;
  founder_type: FounderType;
  avatar_url: string | null;
  bio: string | null;
  referred_by: string | null;
  referral_code: string | null;
  status: CreatorStatus;
  role: CreatorRole;
  must_reset_password: boolean;
  onboarding_completed: boolean;
  activated_at: string | null;
  first_login_at: string | null;
  last_login_at: string | null;
  current_streak: number;
  total_followers: number;
  mfa_enabled: boolean;
  notif_push: boolean;
  notif_email: boolean;
  notif_match: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorAuthStatus {
  found: boolean;
  id?: string;
  status?: CreatorStatus;
  role?: CreatorRole;
  must_reset_password?: boolean;
  mfa_enabled?: boolean;
}

export interface Season {
  id: string;
  year: number;
  name: string;
  status: 'active' | 'upcoming' | 'completed';
  starts_at: string;
  ends_at: string;
  qualification_deadline: string | null;
  tour_card_deadline: string | null;
  championship_purse: number;
  created_at: string;
}

export interface CreatorSeasonStats {
  id: string;
  creator_id: string;
  season_id: string;
  total_points: number;
  rank: number | null;
  challenges_completed: number;
  challenges_active: number;
  current_streak: number;
  best_streak: number;
  matches_won: number;
  matches_lost: number;
  is_qualified: boolean;
  updated_at: string;
}

export interface SocialConnection {
  id: string;
  creator_id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  handle: string;
  followers: number;
  connected: boolean;
  last_synced_at: string | null;
  created_at: string;
}

export interface Challenge {
  id: string;
  season_id: string | null;
  brand: string;
  title: string;
  description: string | null;
  tier: 'Standard' | 'Premium' | 'Elite' | 'GCT';
  points: number;
  deadline: string | null;
  status: 'draft' | 'open' | 'active' | 'judging' | 'completed' | 'cancelled';
  color: string;
  brand_tag: string | null;
  brand_logo_url: string | null;
  requirements: string[];
  max_slots: number | null;
  filled_slots: number;
  sponsor_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  creator_id: string;
  status: 'enrolled' | 'submitted' | 'approved' | 'rejected';
  submission_url: string | null;
  submission_notes: string | null;
  proof_urls: string[];
  points_awarded: number | null;
  enrolled_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface Match {
  id: string;
  season_id: string | null;
  challenger_id: string;
  opponent_id: string;
  match_type: 'stroke' | 'match' | 'skins' | 'scramble' | '9hole';
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  winner_id: string | null;
  challenger_score: number | null;
  opponent_score: number | null;
  challenger_holes_won: number | null;
  opponent_holes_won: number | null;
  is_rematch: boolean;
  location: string | null;
  course_name: string | null;
  proof_url: string | null;
  scorecard_url: string | null;
  points_winner: number | null;
  points_loser: number | null;
  challenged_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

export interface PointsLog {
  id: string;
  creator_id: string;
  season_id: string | null;
  source: string;
  points: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  letter: string;
  description: string | null;
  category: string;
  icon_url: string | null;
  sort_order: number;
}

export interface CreatorAchievement {
  id: string;
  creator_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface Membership {
  id: string;
  creator_id: string;
  tier: 'standard' | 'premium' | 'elite';
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  founding_member_number: number | null;
  created_at: string;
}

export interface ActivityFeed {
  id: string;
  creator_id: string;
  season_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  points: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type GolfConnectionStatus = 'not_connected' | 'connecting' | 'connected' | 'syncing' | 'failed';

export interface GolfIntegration {
  id: string;
  creator_id: string;
  platform: 'ghin' | 'arccos' | 'thegrint' | 'garmin';
  connected: boolean;
  connection_status: GolfConnectionStatus;
  external_id: string | null;
  handicap: number | null;
  data: Record<string, unknown>;
  error_message: string | null;
  last_synced_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: 'match_request' | 'match_accepted' | 'match_declined' | 'match_completed' |
    'challenge_update' | 'challenge_completed' | 'challenge_new' |
    'admin_announcement' | 'achievement_unlocked' | 'streak_milestone' |
    'follower_milestone' | 'system';
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
  sender?: Pick<Creator, 'id' | 'name' | 'handle' | 'avatar_url'>;
}

export type ClubType = 'driver' | '3-wood' | '5-wood' | '7-wood' | 'hybrid' |
  '2-iron' | '3-iron' | '4-iron' | '5-iron' | '6-iron' | '7-iron' | '8-iron' | '9-iron' |
  'pitching-wedge' | 'gap-wedge' | 'sand-wedge' | 'lob-wedge' | 'putter' | 'other';

export interface GolfBagItem {
  id: string;
  creator_id: string;
  club_type: ClubType;
  brand: string | null;
  model: string | null;
  specs: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/* ── Joined/computed types used by the frontend ── */

export interface RankedCreator extends Creator {
  total_points: number;
  rank: number | null;
  total_followers: number;
  challenges_completed: number;
  matches_won: number;
  matches_lost: number;
  current_streak: number;
}

export interface CreatorProfile extends Creator {
  stats: CreatorSeasonStats;
  socials: SocialConnection[];
  achievements: (CreatorAchievement & { achievement?: Achievement })[];
  membership: Membership | null;
  integrations: GolfIntegration[];
  golf_bag: GolfBagItem[];
  participations: (ChallengeParticipation & { challenge?: Challenge })[];
}

export interface MatchWithCreators extends Match {
  challenger: Pick<Creator, 'id' | 'name' | 'handle' | 'avatar_url' | 'country'>;
  opponent: Pick<Creator, 'id' | 'name' | 'handle' | 'avatar_url' | 'country'>;
}

export interface MatchMessage {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: Pick<Creator, 'id' | 'name' | 'handle' | 'avatar_url'>;
}

export interface MatchRead {
  match_id: string;
  user_id: string;
  last_read_at: string;
}

export interface CreatorSponsor {
  id: string;
  creator_id: string;
  name: string;
  website: string | null;
  note: string | null;
  category: string | null;
  logo_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventDay {
  date: string;
  day_label: string;
  title: string;
  subtitle: string | null;
  accent_color: string;
  stat_a_label: string;
  stat_a_value: string;
  stat_b_label: string;
  stat_b_value: string;
  stat_c_label: string;
  stat_c_value: string;
  description: string | null;
}

export interface EventNote {
  text: string;
}

export interface GctEvent {
  id: string;
  season_id: string | null;
  name: string;
  start_date: string;
  end_date: string;
  venue: string | null;
  days: EventDay[];
  notes: EventNote[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  season_id: string | null;
  event_id: string | null;
  title: string;
  body: string | null;
  accent_color: string;
  is_pinned: boolean;
  published_at: string;
  created_at: string;
}

export interface FollowerMilestone {
  id: string;
  threshold: number;
  points: number;
  label: string;
  sort_order: number;
}

/** One row per (creator, season, platform, threshold) — the idempotency record
 *  written by award_follower_milestones().  A row's presence means the milestone
 *  has already been awarded and cannot be awarded again. */
export interface SocialFollowerMilestone {
  id:             string;
  creator_id:     string;
  season_id:      string;
  platform:       'instagram' | 'tiktok' | 'youtube';
  threshold:      number;
  points_awarded: number;
  awarded_at:     string;
}

/** Single element returned by the award_follower_milestones() RPC. */
export interface MilestoneAwardResult {
  threshold: number;
  points:    number;
  /** true = awarded this call; false = already held (idempotent skip) */
  awarded:   boolean;
}

type TableDefinition<Row> = {
  Row: Row & Record<string, unknown>;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      achievements: TableDefinition<Achievement>;
      activity_feed: TableDefinition<ActivityFeed>;
      announcements: TableDefinition<Announcement>;
      challenges: TableDefinition<Challenge>;
      challenge_participations: TableDefinition<ChallengeParticipation>;
      creators: TableDefinition<Creator>;
      creator_achievements: TableDefinition<CreatorAchievement>;
      creator_season_stats: TableDefinition<CreatorSeasonStats>;
      creator_sponsors: TableDefinition<CreatorSponsor>;
      follower_milestones: TableDefinition<FollowerMilestone>;
      gct_events: TableDefinition<GctEvent>;
      golf_bag_items: TableDefinition<GolfBagItem>;
      golf_integrations: TableDefinition<GolfIntegration>;
      match_messages: TableDefinition<MatchMessage>;
      match_reads: TableDefinition<MatchRead>;
      matches: TableDefinition<Match>;
      memberships: TableDefinition<Membership>;
      notifications: TableDefinition<Notification>;
      points_log: TableDefinition<PointsLog>;
      seasons: TableDefinition<Season>;
      social_connections: TableDefinition<SocialConnection>;
      social_follower_milestones: TableDefinition<SocialFollowerMilestone>;
    };
    Views: Record<string, never>;
    Functions: {
      get_creator_auth_status: {
        Args: { p_auth_user_id: string };
        Returns: CreatorAuthStatus & { onboarding_completed?: boolean };
      };
      record_login: {
        Args: { p_auth_user_id: string };
        Returns: undefined;
      };
      activate_creator: {
        Args: { p_auth_user_id: string };
        Returns: { success: boolean; error?: string; name?: string; member_number?: string };
      };
      award_connection_bonus: {
        Args: { p_creator_id: string; p_season_id: string; p_platform: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SupabaseRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type SupabaseTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: SupabaseRelationship[];
};

type SupabaseFunction = {
  Args: Record<string, unknown> | never;
  Returns: unknown;
};

export type PublicSchema = {
  Tables: Database["public"]["Tables"] & Record<string, SupabaseTable>;
  Views: Record<string, never>;
  Functions: Database["public"]["Functions"] & Record<string, SupabaseFunction>;
  Enums: Database["public"]["Enums"];
  CompositeTypes: Database["public"]["CompositeTypes"];
};
