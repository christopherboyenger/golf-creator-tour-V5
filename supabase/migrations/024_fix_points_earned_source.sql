-- Migration: 024_fix_points_earned_source.sql
-- Add 'points_earned' to the activity feed trigger so it no longer falls
-- through to the raw source value in event_type / title.

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
    WHEN 'points_earned'       THEN 'points_earned'
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
    WHEN 'points_earned'       THEN 'Points earned'
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
