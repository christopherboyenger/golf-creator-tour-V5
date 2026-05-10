-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 006_complete_schema.sql
-- Purpose: Comprehensive idempotent schema for GCT V4 production
-- Ensures all tables, columns, indexes, RLS policies, triggers, and realtime config exist
-- Uses IF NOT EXISTS everywhere for safe re-execution
-- ════════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- CREATORS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  member_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  email TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  gender CHAR(2),
  handicap NUMERIC(4, 1),
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'premium', 'elite')),
  is_exempt BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  bio TEXT,
  referred_by UUID,
  referral_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'approved_not_activated', 'active', 'suspended', 'banned')),
  role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'team', 'admin', 'superadmin')),
  must_reset_password BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creators_auth_user_id ON creators(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_creators_member_number ON creators(member_number);
CREATE INDEX IF NOT EXISTS idx_creators_state_status ON creators(state, status);
CREATE INDEX IF NOT EXISTS idx_creators_handle ON creators(handle);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- Creators can read their own profile + all public creator data
CREATE POLICY "creators_read_own_and_public" ON creators
  FOR SELECT
  USING (
    auth.uid() = auth_user_id OR
    status = 'active'
  );

-- Creators can update their own profile
CREATE POLICY "creators_update_own" ON creators
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Admins and superadmins have full access
CREATE POLICY "admins_all_access" ON creators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- SEASONS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'completed')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  qualification_deadline TIMESTAMP WITH TIME ZONE,
  championship_purse NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(year)
);

CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Everyone can read seasons
CREATE POLICY "seasons_read_all" ON seasons
  FOR SELECT
  USING (TRUE);

-- Only admins can write
CREATE POLICY "seasons_write_admins" ON seasons
  FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "seasons_update_admins" ON seasons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- CREATOR_SEASON_STATS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creator_season_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons ON DELETE CASCADE,
  total_points NUMERIC(10, 2) DEFAULT 0,
  rank INTEGER,
  challenges_completed INTEGER DEFAULT 0,
  challenges_active INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  is_qualified BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(creator_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_css_season_rank ON creator_season_stats(season_id, rank);
CREATE INDEX IF NOT EXISTS idx_css_season_points ON creator_season_stats(season_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_css_creator_season ON creator_season_stats(creator_id, season_id);

ALTER TABLE creator_season_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can read leaderboard data
CREATE POLICY "creator_season_stats_read_all" ON creator_season_stats
  FOR SELECT
  USING (TRUE);

-- Creators can update their own stats
CREATE POLICY "creator_season_stats_update_own" ON creator_season_stats
  FOR UPDATE
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Admins can update any stats
CREATE POLICY "creator_season_stats_update_admins" ON creator_season_stats
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- CHALLENGES TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons ON DELETE SET NULL,
  brand TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('Standard', 'Premium', 'Elite')),
  points INTEGER NOT NULL DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'active', 'judging', 'completed', 'cancelled')),
  color TEXT DEFAULT '#000000',
  brand_tag TEXT,
  requirements TEXT[] DEFAULT '{}',
  max_slots INTEGER,
  filled_slots INTEGER DEFAULT 0,
  sponsor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_season_status ON challenges(season_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_deadline ON challenges(deadline);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Everyone can read challenges with 'open' or 'active' status; admins can read all
CREATE POLICY "challenges_read" ON challenges
  FOR SELECT
  USING (
    status IN ('open', 'active') OR
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- Only admins can write
CREATE POLICY "challenges_write_admins" ON challenges
  FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "challenges_update_admins" ON challenges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- CHALLENGE_PARTICIPATIONS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'submitted', 'approved', 'rejected')),
  submission_url TEXT,
  submission_notes TEXT,
  proof_urls TEXT[] DEFAULT '{}',
  points_awarded INTEGER,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_challenge ON challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_cp_creator ON challenge_participations(creator_id);
CREATE INDEX IF NOT EXISTS idx_cp_status ON challenge_participations(status);

ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;

-- Creators can read their own participations; admins can read all
CREATE POLICY "challenge_participations_read" ON challenge_participations
  FOR SELECT
  USING (
    creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1) OR
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- Creators can insert (enroll) and update their own participations
CREATE POLICY "challenge_participations_insert_own" ON challenge_participations
  FOR INSERT
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "challenge_participations_update_own" ON challenge_participations
  FOR UPDATE
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Admins can update all participations
CREATE POLICY "challenge_participations_update_admins" ON challenge_participations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- MATCHES TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons ON DELETE SET NULL,
  challenger_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('stroke', 'match', 'skins', 'scramble', '9hole')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled')),
  winner_id UUID REFERENCES creators ON DELETE SET NULL,
  challenger_score NUMERIC(4, 1),
  opponent_score NUMERIC(4, 1),
  location TEXT,
  course_name TEXT,
  proof_url TEXT,
  scorecard_url TEXT,
  points_winner INTEGER,
  points_loser INTEGER,
  challenged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_challenger ON matches(challenger_id);
CREATE INDEX IF NOT EXISTS idx_matches_opponent ON matches(opponent_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season_id);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Participants can read their own matches; public can read completed matches; admins can read all
CREATE POLICY "matches_read" ON matches
  FOR SELECT
  USING (
    challenger_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1) OR
    opponent_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1) OR
    status = 'completed' OR
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- Challenger can insert new matches
CREATE POLICY "matches_insert_challenger" ON matches
  FOR INSERT
  WITH CHECK (challenger_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Participants can update their own matches
CREATE POLICY "matches_update_participants" ON matches
  FOR UPDATE
  USING (
    challenger_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1) OR
    opponent_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- Admins can update all matches
CREATE POLICY "matches_update_admins" ON matches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- SOCIAL_CONNECTIONS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  handle TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  connected BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(creator_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_sc_creator ON social_connections(creator_id);
CREATE INDEX IF NOT EXISTS idx_sc_platform ON social_connections(platform);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Creators can read their own socials; public data is readable
CREATE POLICY "social_connections_read" ON social_connections
  FOR SELECT
  USING (
    creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1) OR
    connected = TRUE
  );

-- Creators can update their own socials
CREATE POLICY "social_connections_update_own" ON social_connections
  FOR UPDATE
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- ──────────────────────────────────────────────────────────────────────────────
-- ACHIEVEMENTS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  letter TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_sort_order ON achievements(sort_order);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can read achievements
CREATE POLICY "achievements_read_all" ON achievements
  FOR SELECT
  USING (TRUE);

-- Only admins can write
CREATE POLICY "achievements_write_admins" ON achievements
  FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- CREATOR_ACHIEVEMENTS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creator_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(creator_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_ca_creator ON creator_achievements(creator_id);
CREATE INDEX IF NOT EXISTS idx_ca_achievement ON creator_achievements(achievement_id);

ALTER TABLE creator_achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can read achievements (public profile data)
CREATE POLICY "creator_achievements_read_all" ON creator_achievements
  FOR SELECT
  USING (TRUE);

-- Creators can read their own unlocks
CREATE POLICY "creator_achievements_read_own" ON creator_achievements
  FOR SELECT
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Admins can write
CREATE POLICY "creator_achievements_write_admins" ON creator_achievements
  FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- ACTIVITY_FEED TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_af_creator ON activity_feed(creator_id);
CREATE INDEX IF NOT EXISTS idx_af_created_at_desc ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_af_event_type ON activity_feed(event_type);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Everyone can read activity feed (public)
CREATE POLICY "activity_feed_read_all" ON activity_feed
  FOR SELECT
  USING (TRUE);

-- Creators can insert their own activity
CREATE POLICY "activity_feed_insert_own" ON activity_feed
  FOR INSERT
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Admins can insert any activity
CREATE POLICY "activity_feed_insert_admins" ON activity_feed
  FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- SPONSOR_PARTNERS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sponsor_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  contact_email TEXT,
  tier TEXT CHECK (tier IN ('standard', 'premium', 'elite')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sp_status ON sponsor_partners(status);

ALTER TABLE sponsor_partners ENABLE ROW LEVEL SECURITY;

-- Everyone can read active sponsors
CREATE POLICY "sponsor_partners_read" ON sponsor_partners
  FOR SELECT
  USING (status = 'active');

-- Admins can manage sponsors
CREATE POLICY "sponsor_partners_write_admins" ON sponsor_partners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- EVENTS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  location TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  event_type TEXT,
  max_participants INTEGER,
  registration_fee NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_season ON events(season_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Everyone can read events
CREATE POLICY "events_read_all" ON events
  FOR SELECT
  USING (TRUE);

-- Admins can manage events
CREATE POLICY "events_write_admins" ON events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- EVENT_REGISTRATIONS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  UNIQUE(event_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_er_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_er_creator ON event_registrations(creator_id);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Creators can read their own registrations; admins can read all
CREATE POLICY "event_registrations_read" ON event_registrations
  FOR SELECT
  USING (
    creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1) OR
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- Creators can insert their own registrations
CREATE POLICY "event_registrations_insert_own" ON event_registrations
  FOR INSERT
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Creators can update their own registrations
CREATE POLICY "event_registrations_update_own" ON event_registrations
  FOR UPDATE
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- ──────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_creator ON notifications(creator_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notif_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Creators can only read their own notifications
CREATE POLICY "notifications_read_own" ON notifications
  FOR SELECT
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Creators can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- System/admins can insert notifications
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- MEMBERSHIPS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL UNIQUE REFERENCES creators ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('standard', 'premium', 'elite')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_m_creator ON memberships(creator_id);
CREATE INDEX IF NOT EXISTS idx_m_status ON memberships(status);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Creators can read their own membership
CREATE POLICY "memberships_read_own" ON memberships
  FOR SELECT
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Creators can update their own membership
CREATE POLICY "memberships_update_own" ON memberships
  FOR UPDATE
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Admins can manage all memberships
CREATE POLICY "memberships_all_admins" ON memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- GOLF_INTEGRATIONS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS golf_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ghin', 'arccos', 'thegrint', 'garmin')),
  connected BOOLEAN DEFAULT FALSE,
  external_id TEXT,
  handicap NUMERIC(4, 1),
  data JSONB DEFAULT '{}',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(creator_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_gi_creator ON golf_integrations(creator_id);
CREATE INDEX IF NOT EXISTS idx_gi_platform ON golf_integrations(platform);

ALTER TABLE golf_integrations ENABLE ROW LEVEL SECURITY;

-- Creators can read their own integrations; admins can read all
CREATE POLICY "golf_integrations_read" ON golf_integrations
  FOR SELECT
  USING (
    creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1) OR
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- Creators can manage their own integrations
CREATE POLICY "golf_integrations_update_own" ON golf_integrations
  FOR UPDATE
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Creators can insert their own integrations
CREATE POLICY "golf_integrations_insert_own" ON golf_integrations
  FOR INSERT
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- ──────────────────────────────────────────────────────────────────────────────
-- POINTS_LOG TABLE (for audit trail)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators ON DELETE CASCADE,
  season_id UUID REFERENCES seasons ON DELETE SET NULL,
  source TEXT NOT NULL,
  points NUMERIC(10, 2) NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pl_creator ON points_log(creator_id);
CREATE INDEX IF NOT EXISTS idx_pl_season ON points_log(season_id);
CREATE INDEX IF NOT EXISTS idx_pl_created_at ON points_log(created_at);

ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;

-- Creators can read their own logs
CREATE POLICY "points_log_read_own" ON points_log
  FOR SELECT
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

-- Admins can read all logs
CREATE POLICY "points_log_read_admins" ON points_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- TRIGGERS FOR UPDATED_AT
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
DROP TRIGGER IF EXISTS update_seasons_updated_at ON seasons;
DROP TRIGGER IF EXISTS update_creator_season_stats_updated_at ON creator_season_stats;
DROP TRIGGER IF EXISTS update_challenges_updated_at ON challenges;
DROP TRIGGER IF EXISTS update_social_connections_updated_at ON social_connections;
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
DROP TRIGGER IF EXISTS update_sponsor_partners_updated_at ON sponsor_partners;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
DROP TRIGGER IF EXISTS update_golf_integrations_updated_at ON golf_integrations;

-- Create triggers
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_season_stats_updated_at
  BEFORE UPDATE ON creator_season_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_connections_updated_at
  BEFORE UPDATE ON social_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsor_partners_updated_at
  BEFORE UPDATE ON sponsor_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_golf_integrations_updated_at
  BEFORE UPDATE ON golf_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────────────────────
-- REALTIME CONFIGURATION
-- ──────────────────────────────────────────────────────────────────────────────

BEGIN;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS creator_season_stats;
  ALTER PUBLICATION supabase_realtime ADD TABLE creator_season_stats;
EXCEPTION WHEN OTHERS THEN NULL;
END;

BEGIN;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS activity_feed;
  ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
EXCEPTION WHEN OTHERS THEN NULL;
END;

BEGIN;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS creator_achievements;
  ALTER PUBLICATION supabase_realtime ADD TABLE creator_achievements;
EXCEPTION WHEN OTHERS THEN NULL;
END;

BEGIN;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END;

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════════════════════
