-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 032_handle_new_user_exception_safe.sql
-- Purpose: Make the on_auth_user_created trigger truly bullet-proof so it can
--          NEVER block auth.users inserts.
--
-- Background
-- ──────────
-- The admin "Add Member" flow calls `auth.admin.createUser`, which inserts into
-- auth.users and fires the `handle_new_user` trigger. If the trigger raises any
-- exception, Postgres rolls back the auth.users insert and Supabase Auth wraps
-- the failure as the opaque "Database error creating new user" surface error —
-- there's no useful detail in the response, only in the Postgres logs.
--
-- Migration 031 added an early-return guard for `admin_created` users, but that
-- only fixes the admin path. Regular signup still has unguarded steps
-- (sequence, season lookup, creator insert, season-stats insert) that can each
-- raise. And if 031 hasn't been applied to a given environment, the admin path
-- is also broken.
--
-- This migration:
--   1. Re-applies the admin_created early-return (idempotent with 031)
--   2. Wraps the regular-signup body in EXCEPTION handlers so any failure is
--      logged via RAISE WARNING and the trigger still RETURN NEW, letting the
--      auth user be created. The admin API (or signup flow) can then reconcile.
--   3. Adds a UNIQUE constraint on creators.auth_user_id so an ON CONFLICT
--      upsert path is deterministic.
-- ════════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- Ensure auth_user_id is unique. Required for ON CONFLICT upsert in the admin
-- API and in any future trigger-driven creator reconciliation.
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Drop any duplicate creator rows for the same auth_user_id, keeping the
  -- earliest one. Defensive — under normal operation there should be none.
  DELETE FROM creators c
  USING creators c2
  WHERE c.auth_user_id IS NOT NULL
    AND c.auth_user_id = c2.auth_user_id
    AND c.created_at > c2.created_at;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'creators_auth_user_id_key'
  ) THEN
    ALTER TABLE creators ADD CONSTRAINT creators_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Replace handle_new_user with an exception-safe version.
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
  -- Admin-created users: skip automatic creator record creation.
  -- The admin API inserts the creator record itself with correct data.
  IF (NEW.raw_app_meta_data->>'admin_created')::boolean IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Everything below runs for organic signups. Wrap in EXCEPTION so a failure
  -- here NEVER blocks the auth.users insert — instead we log a warning and let
  -- the application reconcile the missing creator row on next admin touch.
  BEGIN
    new_member_number := 'GCT-' || EXTRACT(YEAR FROM NOW())::text || '-' ||
      LPAD(nextval('creators_member_number_seq')::text, 4, '0');

    base_handle := LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-z0-9_]', '_', 'g'));
    IF base_handle = '' THEN base_handle := 'creator'; END IF;
    candidate_handle := base_handle;

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
    ON CONFLICT (auth_user_id) DO NOTHING
    RETURNING id INTO new_creator_id;

    IF new_creator_id IS NOT NULL AND active_season_id IS NOT NULL THEN
      SELECT COALESCE(MAX(rank), 0) + 1 INTO next_rank
      FROM creator_season_stats WHERE season_id = active_season_id;

      INSERT INTO creator_season_stats (creator_id, season_id, total_points, rank)
      VALUES (new_creator_id, active_season_id, 0, next_rank)
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: skipped creator seed for auth user %: % (%)',
      NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

-- Re-bind the trigger in case it was dropped or never created in this env.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
