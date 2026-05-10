-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 007_v4_1_feature_updates.sql
-- Purpose: Schema additions for GCT V4.1 feature updates
--   - Notifications system
--   - Golf bag equipment
--   - Golf data provider connections (real architecture)
--   - Streak tracking fields
--   - Founder designation
--   - Match request visibility
--   - Challenge logo storage
--   - Social totals cache
-- ════════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- CREATORS TABLE — new columns
-- ──────────────────────────────────────────────────────────────────────────────

-- Founder type: distinguishes founders from regular exempt users
ALTER TABLE creators ADD COLUMN IF NOT EXISTS founder_type TEXT DEFAULT NULL
  CHECK (founder_type IN ('founder', 'co_founder', NULL));

-- First login tracking for streak calculation
ALTER TABLE creators ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Current login streak (computed on login)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- Total social followers cache (computed on sync)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS total_followers INTEGER DEFAULT 0;

-- ──────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS TABLE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'match_request', 'match_accepted', 'match_declined', 'match_completed',
    'challenge_update', 'challenge_completed', 'challenge_new',
    'admin_announcement', 'achievement_unlocked', 'streak_milestone',
    'follower_milestone', 'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own" ON notifications
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM creators WHERE id = recipient_id));

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM creators WHERE id = recipient_id));

CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (TRUE);

-- ──────────────────────────────────────────────────────────────────────────────
-- GOLF BAG TABLE — editable equipment
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS golf_bag_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  club_type TEXT NOT NULL CHECK (club_type IN (
    'driver', '3-wood', '5-wood', '7-wood', 'hybrid',
    '2-iron', '3-iron', '4-iron', '5-iron', '6-iron', '7-iron', '8-iron', '9-iron',
    'pitching-wedge', 'gap-wedge', 'sand-wedge', 'lob-wedge',
    'putter', 'other'
  )),
  brand TEXT,
  model TEXT,
  specs TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_golf_bag_creator ON golf_bag_items(creator_id, sort_order);

ALTER TABLE golf_bag_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "golf_bag_read_all" ON golf_bag_items
  FOR SELECT USING (TRUE);

CREATE POLICY "golf_bag_write_own" ON golf_bag_items
  FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM creators WHERE id = creator_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- GOLF DATA PROVIDERS — real connection architecture
-- ──────────────────────────────────────────────────────────────────────────────

-- Update golf_integrations to support connection states
ALTER TABLE golf_integrations ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'not_connected'
  CHECK (connection_status IN ('not_connected', 'connecting', 'connected', 'syncing', 'failed'));
ALTER TABLE golf_integrations ADD COLUMN IF NOT EXISTS error_message TEXT DEFAULT NULL;
ALTER TABLE golf_integrations ADD COLUMN IF NOT EXISTS access_token TEXT DEFAULT NULL;
ALTER TABLE golf_integrations ADD COLUMN IF NOT EXISTS refresh_token TEXT DEFAULT NULL;
ALTER TABLE golf_integrations ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ──────────────────────────────────────────────────────────────────────────────
-- CHALLENGES TABLE — add logo support
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS brand_logo_url TEXT DEFAULT NULL;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES creators(id) ON DELETE SET NULL;

-- ──────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ──────────────────────────────────────────────────────────────────────────────

-- Challenge logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-logos', 'challenge-logos', true)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS — streak calculation
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_login_streak(p_auth_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_login TIMESTAMP WITH TIME ZONE;
  v_current_streak INTEGER;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_hours_since_last NUMERIC;
BEGIN
  SELECT last_login_at, current_streak INTO v_last_login, v_current_streak
  FROM creators WHERE auth_user_id = p_auth_user_id;

  IF v_last_login IS NULL THEN
    -- First login ever
    UPDATE creators SET
      first_login_at = v_now,
      last_login_at = v_now,
      current_streak = 1
    WHERE auth_user_id = p_auth_user_id;
    RETURN 1;
  END IF;

  v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_last_login)) / 3600;

  IF v_hours_since_last < 24 THEN
    -- Same day login, no streak change, just update last_login
    UPDATE creators SET last_login_at = v_now WHERE auth_user_id = p_auth_user_id;
    RETURN COALESCE(v_current_streak, 1);
  ELSIF v_hours_since_last < 48 THEN
    -- Next day login, increment streak
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
    UPDATE creators SET
      last_login_at = v_now,
      current_streak = v_current_streak
    WHERE auth_user_id = p_auth_user_id;

    -- Update best_streak in season stats if applicable
    UPDATE creator_season_stats SET
      current_streak = v_current_streak,
      best_streak = GREATEST(best_streak, v_current_streak)
    WHERE creator_id = (SELECT id FROM creators WHERE auth_user_id = p_auth_user_id)
    AND season_id = (SELECT id FROM seasons WHERE status = 'active' LIMIT 1);

    RETURN v_current_streak;
  ELSE
    -- Streak broken, reset to 1
    UPDATE creators SET
      last_login_at = v_now,
      current_streak = 1
    WHERE auth_user_id = p_auth_user_id;

    UPDATE creator_season_stats SET
      current_streak = 1
    WHERE creator_id = (SELECT id FROM creators WHERE auth_user_id = p_auth_user_id)
    AND season_id = (SELECT id FROM seasons WHERE status = 'active' LIMIT 1);

    RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS — create notification on match request
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_match_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, sender_id, type, title, body, metadata)
  VALUES (
    NEW.opponent_id,
    NEW.challenger_id,
    'match_request',
    'New Match Challenge',
    (SELECT name FROM creators WHERE id = NEW.challenger_id) || ' challenged you to a match',
    jsonb_build_object('match_id', NEW.id, 'match_type', NEW.match_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_match_request ON matches;
CREATE TRIGGER trg_notify_match_request
  AFTER INSERT ON matches
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_match_request();

-- ──────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS — create notification on challenge update
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_challenge_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO notifications (recipient_id, type, title, body, metadata)
    SELECT cp.creator_id, 'challenge_update', 'Challenge Updated',
      NEW.title || ' status changed to ' || NEW.status,
      jsonb_build_object('challenge_id', NEW.id, 'new_status', NEW.status)
    FROM challenge_participations cp
    WHERE cp.challenge_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_challenge_update ON challenges;
CREATE TRIGGER trg_notify_challenge_update
  AFTER UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION notify_challenge_update();

-- ──────────────────────────────────────────────────────────────────────────────
-- REALTIME — enable for notifications
-- ──────────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
