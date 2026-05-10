-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 034_sync_creator_email_with_auth.sql
-- Purpose: Guarantee that every creator row carries the email from auth.users
--          so the admin dashboard always shows it.
--
-- Background
-- ──────────
-- `creators.email` is populated by `handle_new_user` on signup and by the admin
-- "Add Member" API on creation. Two gaps left rows with NULL or stale emails:
--   1. Migration 032 wrapped the organic-signup body in EXCEPTION handlers, so
--      any failure after the auth.users insert leaves the creator without an
--      email until something reconciles it.
--   2. Nothing syncs `creators.email` when a user changes their address through
--      Supabase Auth — `auth.users.email` advances and `creators.email` rots.
--
-- This migration:
--   1. Backfills `creators.email` from `auth.users.email` wherever the creator
--      row is missing an email but is linked to an auth user.
--   2. Adds an AFTER UPDATE trigger on auth.users that mirrors the new email
--      onto the linked creator row so future changes stay in lockstep.
-- ════════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- Backfill: copy auth.users.email into creators.email where currently missing.
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE creators c
SET email = u.email,
    updated_at = NOW()
FROM auth.users u
WHERE c.auth_user_id = u.id
  AND u.email IS NOT NULL
  AND (c.email IS NULL OR btrim(c.email) = '');

-- ──────────────────────────────────────────────────────────────────────────────
-- Sync trigger: keep creators.email in step with auth.users.email going forward.
-- SECURITY DEFINER so it can write to public.creators from the auth schema
-- regardless of the caller's RLS context.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_creator_email_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
    UPDATE creators
    SET email = NEW.email,
        updated_at = NOW()
    WHERE auth_user_id = NEW.id
      AND (email IS DISTINCT FROM NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_creator_email_from_auth();
