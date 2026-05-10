-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 014_auth_rpcs.sql
-- Purpose: Define auth RPCs the app runtime depends on. These existed in prod
--          but were never written to migration files, making the repo unable
--          to reproduce the database from scratch.
--
--   get_creator_auth_status(p_auth_user_id uuid) → jsonb
--   record_login(p_auth_user_id uuid)            → void
--   activate_creator(p_auth_user_id uuid)        → jsonb
--   decrement_enrolled(cid uuid)                 → void
-- ════════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- get_creator_auth_status
-- Returns a JSON blob describing the linked creator row for the given auth user.
-- Consumed by /api/auth/status and hooks/use-auth.tsx.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_creator_auth_status(p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c creators%ROWTYPE;
BEGIN
  SELECT * INTO c
  FROM creators
  WHERE auth_user_id = p_auth_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'id', c.id,
    'status', c.status,
    'role', c.role,
    'must_reset_password', COALESCE(c.must_reset_password, false),
    'mfa_enabled', COALESCE(c.mfa_enabled, false),
    'onboarding_completed', COALESCE(c.onboarding_completed, false)
  );
END;
$$;

REVOKE ALL ON FUNCTION get_creator_auth_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_creator_auth_status(uuid) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────────
-- record_login
-- Stamps last_login_at on the creator row. No-op if no creator is linked.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_login(p_auth_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE creators
  SET last_login_at = NOW()
  WHERE auth_user_id = p_auth_user_id;
END;
$$;

REVOKE ALL ON FUNCTION record_login(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_login(uuid) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────────
-- activate_creator
-- Completes first-time activation: clears must_reset_password, marks active,
-- stamps activated_at. Returns { success, name, member_number } or { success:false, error }.
-- Called by /api/auth/reset-password after the supabase auth password update.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION activate_creator(p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c creators%ROWTYPE;
BEGIN
  SELECT * INTO c
  FROM creators
  WHERE auth_user_id = p_auth_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Creator not found');
  END IF;

  IF c.status IN ('suspended', 'banned') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is not eligible for activation');
  END IF;

  UPDATE creators
  SET must_reset_password = false,
      status = CASE WHEN status = 'active' THEN status ELSE 'active' END,
      activated_at = COALESCE(activated_at, NOW()),
      updated_at = NOW()
  WHERE id = c.id
  RETURNING * INTO c;

  RETURN jsonb_build_object(
    'success', true,
    'name', c.name,
    'member_number', c.member_number
  );
END;
$$;

REVOKE ALL ON FUNCTION activate_creator(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION activate_creator(uuid) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────────
-- decrement_enrolled
-- Decrements challenges.filled_slots, clamped at zero. Mirror of increment_enrolled.
-- Called by lib/queries.ts dropChallenge.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_enrolled(cid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE challenges
  SET filled_slots = GREATEST(COALESCE(filled_slots, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = cid;
END;
$$;

REVOKE ALL ON FUNCTION decrement_enrolled(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrement_enrolled(uuid) TO authenticated, service_role;
