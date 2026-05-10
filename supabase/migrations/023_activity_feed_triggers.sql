-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 023_activity_feed_triggers.sql
-- Purpose: Auto-populate activity_feed from all point-awarding events:
--   1. points_log INSERT → activity_feed (covers challenge_approved,
--      social milestones, streak_bonus, referral_bonus)
--   2. calculate_login_streak() updated to award streak_bonus points at
--      milestone streaks (7, 14, 30, 60, 100 days)
--   3. Referral bonus trigger on creators INSERT when referred_by IS NOT NULL
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. points_log → activity_feed trigger ─────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_points_log_to_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event_type TEXT;
  v_title      TEXT;
BEGIN
  v_event_type := CASE NEW.source
    WHEN 'challenge_approved'  THEN 'challenge_approved'
    WHEN 'youtube_milestone'   THEN 'social_milestone'
    WHEN 'instagram_milestone' THEN 'social_milestone'
    WHEN 'tiktok_milestone'    THEN 'social_milestone'
    WHEN 'social_connection'   THEN 'social_milestone'
    WHEN 'streak_bonus'        THEN 'streak_bonus'
    WHEN 'referral_bonus'      THEN 'referral_bonus'
    ELSE NEW.source
  END;

  v_title := CASE NEW.source
    WHEN 'challenge_approved'  THEN 'Content approved'
    WHEN 'youtube_milestone'   THEN 'Social milestone'
    WHEN 'instagram_milestone' THEN 'Social milestone'
    WHEN 'tiktok_milestone'    THEN 'Social milestone'
    WHEN 'social_connection'   THEN 'Social connection'
    WHEN 'streak_bonus'        THEN 'Streak bonus'
    WHEN 'referral_bonus'      THEN 'Referral bonus'
    ELSE NEW.source
  END;

  INSERT INTO activity_feed (creator_id, event_type, title, description, points, metadata)
  VALUES (
    NEW.creator_id,
    v_event_type,
    v_title,
    NEW.description,
    NEW.points::INTEGER,
    jsonb_build_object(
      'source',       NEW.source,
      'season_id',    NEW.season_id,
      'reference_id', NEW.reference_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_points_log_to_activity ON points_log;
CREATE TRIGGER trg_points_log_to_activity
  AFTER INSERT ON points_log
  FOR EACH ROW
  EXECUTE FUNCTION fn_points_log_to_activity();

-- ── 2. calculate_login_streak() — award streak_bonus at milestone days ─────────
--    Milestones: 7, 14, 30, 60, 100 days → +50 pts each via points_log
--    (the points_log trigger above will create the activity_feed entry)

CREATE OR REPLACE FUNCTION calculate_login_streak(p_auth_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_login      TIMESTAMP WITH TIME ZONE;
  v_current_streak  INTEGER;
  v_now             TIMESTAMP WITH TIME ZONE := now();
  v_hours_since     NUMERIC;
  v_creator_id      UUID;
  v_season_id       UUID;
  v_streak_milestones INTEGER[] := ARRAY[7, 14, 30, 60, 100];
BEGIN
  SELECT id INTO v_creator_id FROM creators WHERE auth_user_id = p_auth_user_id;
  SELECT id INTO v_season_id  FROM seasons  WHERE status = 'active' LIMIT 1;

  SELECT last_login_at, current_streak
  INTO   v_last_login, v_current_streak
  FROM   creators WHERE auth_user_id = p_auth_user_id;

  -- First ever login
  IF v_last_login IS NULL THEN
    UPDATE creators
    SET first_login_at = v_now, last_login_at = v_now, current_streak = 1
    WHERE auth_user_id = p_auth_user_id;
    RETURN 1;
  END IF;

  v_hours_since := EXTRACT(EPOCH FROM (v_now - v_last_login)) / 3600;

  -- Same day — just update last_login_at
  IF v_hours_since < 24 THEN
    UPDATE creators SET last_login_at = v_now WHERE auth_user_id = p_auth_user_id;
    RETURN COALESCE(v_current_streak, 1);

  -- Consecutive day — increment streak
  ELSIF v_hours_since < 48 THEN
    v_current_streak := COALESCE(v_current_streak, 0) + 1;

    UPDATE creators
    SET last_login_at = v_now, current_streak = v_current_streak
    WHERE auth_user_id = p_auth_user_id;

    IF v_creator_id IS NOT NULL AND v_season_id IS NOT NULL THEN
      UPDATE creator_season_stats
      SET current_streak = v_current_streak,
          best_streak    = GREATEST(best_streak, v_current_streak)
      WHERE creator_id = v_creator_id AND season_id = v_season_id;

      -- Award streak bonus at milestone days
      IF v_current_streak = ANY(v_streak_milestones) THEN
        INSERT INTO points_log (creator_id, season_id, source, points, description)
        VALUES (
          v_creator_id,
          v_season_id,
          'streak_bonus',
          50,
          v_current_streak || '-day login streak bonus'
        );

        UPDATE creator_season_stats
        SET total_points = total_points + 50
        WHERE creator_id = v_creator_id AND season_id = v_season_id;
      END IF;
    END IF;

    RETURN v_current_streak;

  -- Streak broken — reset to 1
  ELSE
    UPDATE creators
    SET last_login_at = v_now, current_streak = 1
    WHERE auth_user_id = p_auth_user_id;

    IF v_creator_id IS NOT NULL AND v_season_id IS NOT NULL THEN
      UPDATE creator_season_stats
      SET current_streak = 1
      WHERE creator_id = v_creator_id AND season_id = v_season_id;
    END IF;

    RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Referral bonus on creators INSERT ──────────────────────────────────────
--    Referrer receives +25 pts; new creator receives +25 pts welcome bonus.
--    Both get activity_feed entries via the points_log trigger above.

CREATE OR REPLACE FUNCTION fn_referral_bonus()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_season_id UUID;
BEGIN
  SELECT id INTO v_season_id FROM seasons WHERE status = 'active' LIMIT 1;
  IF v_season_id IS NULL THEN RETURN NEW; END IF;

  -- Award referrer +25 pts
  INSERT INTO points_log (creator_id, season_id, source, points, description, reference_id)
  VALUES (NEW.referred_by, v_season_id, 'referral_bonus', 25,
          'Referral bonus: new creator signed up', NEW.id);

  INSERT INTO creator_season_stats (creator_id, season_id, total_points)
  VALUES (NEW.referred_by, v_season_id, 25)
  ON CONFLICT (creator_id, season_id)
  DO UPDATE SET total_points = creator_season_stats.total_points + 25;

  -- Award new creator +25 pts welcome bonus
  INSERT INTO points_log (creator_id, season_id, source, points, description, reference_id)
  VALUES (NEW.id, v_season_id, 'referral_bonus', 25,
          'Welcome bonus: signed up via referral', NEW.referred_by);

  INSERT INTO creator_season_stats (creator_id, season_id, total_points)
  VALUES (NEW.id, v_season_id, 25)
  ON CONFLICT (creator_id, season_id)
  DO UPDATE SET total_points = creator_season_stats.total_points + 25;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_bonus ON creators;
CREATE TRIGGER trg_referral_bonus
  AFTER INSERT ON creators
  FOR EACH ROW
  WHEN (NEW.referred_by IS NOT NULL)
  EXECUTE FUNCTION fn_referral_bonus();
