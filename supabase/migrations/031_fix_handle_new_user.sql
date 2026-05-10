-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 031_fix_handle_new_user.sql
-- Purpose: Prevent handle_new_user trigger from running for admin-created users.
--
-- When an admin creates a user via the admin API, the API sets
-- raw_app_meta_data = { "admin_created": true }. The trigger skips automatic
-- creator record creation so the API can insert the record with the correct
-- admin-specified fields (handle, status, role, tier, etc.).
--
-- Without this, the trigger fires during auth user creation, fails for any
-- reason (sequence conflict, handle collision, etc.), and Supabase auth wraps
-- the exception as "Database error creating new user" — blocking the whole flow.
-- ════════════════════════════════════════════════════════════════════════════════

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
  -- Admin-created users: skip automatic creator record creation.
  -- The admin API inserts the creator record itself with correct data.
  IF (NEW.raw_app_meta_data->>'admin_created')::boolean IS TRUE THEN
    RETURN NEW;
  END IF;

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
