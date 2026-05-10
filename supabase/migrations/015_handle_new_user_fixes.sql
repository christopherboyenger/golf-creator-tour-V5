-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 015_handle_new_user_fixes.sql
-- Purpose: Repair handle_new_user trigger so new signups are honest:
--   1. Do NOT seed 100 points — leaderboard was contaminated from day one
--   2. Replace COUNT(*)-based member_number with a sequence (race-safe)
--   3. Guarantee unique handle with a numeric suffix on collision
-- ════════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- Race-safe member_number generator. Sequence ensures concurrent signups can
-- never collide on the UNIQUE constraint.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS creators_member_number_seq;

-- Catch the sequence up to the current max so new signups don't reuse an
-- existing member_number. Runs once; idempotent.
DO $$
DECLARE
  max_existing int;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(member_number, '^GCT-\d{4}-', ''), '')::int), 0)
  INTO max_existing
  FROM creators;

  IF max_existing > 0 THEN
    PERFORM setval('creators_member_number_seq', max_existing);
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Replace handle_new_user
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_member_number text;
  active_season_id uuid;
  new_creator_id uuid;
  next_rank int;
  base_handle text;
  candidate_handle text;
  suffix int := 0;
BEGIN
  new_member_number := 'GCT-' || EXTRACT(YEAR FROM NOW())::text || '-' ||
    LPAD(nextval('creators_member_number_seq')::text, 4, '0');

  base_handle := LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-z0-9_]', '_', 'g'));
  IF base_handle = '' THEN base_handle := 'creator'; END IF;
  candidate_handle := base_handle;

  -- Ensure uniqueness. Bounded loop; gives up after 1000 attempts (effectively impossible).
  WHILE EXISTS (SELECT 1 FROM creators WHERE handle = candidate_handle) AND suffix < 1000 LOOP
    suffix := suffix + 1;
    candidate_handle := base_handle || suffix::text;
  END LOOP;

  SELECT id INTO active_season_id FROM seasons WHERE status = 'active' LIMIT 1;

  INSERT INTO creators (auth_user_id, name, handle, email, country, member_number, tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    candidate_handle,
    NEW.email,
    'US',
    new_member_number,
    'standard'
  )
  RETURNING id INTO new_creator_id;

  -- Seed a zero-point season stats row so the creator is visible on the
  -- leaderboard at the bottom. No free points.
  IF active_season_id IS NOT NULL THEN
    SELECT COALESCE(MAX(rank), 0) + 1 INTO next_rank
    FROM creator_season_stats WHERE season_id = active_season_id;

    INSERT INTO creator_season_stats (creator_id, season_id, total_points, rank)
    VALUES (new_creator_id, active_season_id, 0, next_rank);
  END IF;

  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- One-time cleanup: zero out the bogus 100-point seed for any creator whose
-- stats row still shows exactly 100 points and no earned history. Skips anyone
-- who has real activity.
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
    UPDATE creator_season_stats s
    SET total_points = 0
    WHERE total_points = 100
      AND NOT EXISTS (
        SELECT 1 FROM activity_feed a
        WHERE a.creator_id = s.creator_id
      );
  END IF;
END $$;
