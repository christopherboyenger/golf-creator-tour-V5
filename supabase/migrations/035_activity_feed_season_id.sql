-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 035_activity_feed_season_id.sql
-- Purpose: Add season_id to activity_feed so the feed can be filtered by season.
--   The table previously stored season_id only inside the metadata JSONB; this
--   promotes it to a proper indexed column.
-- Steps:
--   1. Add season_id column (nullable FK so legacy rows without a season remain valid)
--   2. Backfill from metadata->>'season_id' for rows written by the old trigger
--   3. Index the column for efficient per-season queries
--   4. Re-create the points_log → activity_feed trigger to populate the column
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. Add column ─────────────────────────────────────────────────────────────────
ALTER TABLE activity_feed
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE SET NULL;

-- 2. Backfill from JSONB ─────────────────────────────────────────────────────────
UPDATE activity_feed
SET season_id = (metadata->>'season_id')::UUID
WHERE season_id IS NULL
  AND metadata->>'season_id' IS NOT NULL
  AND (metadata->>'season_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 3. Index ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_af_season_id ON activity_feed(season_id);

-- 4. Update trigger to write season_id as a real column ──────────────────────────
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

  INSERT INTO activity_feed (creator_id, season_id, event_type, title, description, points, metadata)
  VALUES (
    NEW.creator_id,
    NEW.season_id,
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
