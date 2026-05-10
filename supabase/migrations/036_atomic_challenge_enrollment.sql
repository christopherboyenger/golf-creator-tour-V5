-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 036_atomic_challenge_enrollment.sql
-- Purpose: Replace the two-step insert + RPC pattern for challenge enrollment
--          with atomic functions that do both in a single transaction.
--          This eliminates the window where filled_slots can diverge from the
--          real participation count and prevents over-enrollment races.
--
--   enroll_in_challenge(p_challenge_id, p_creator_id) → jsonb
--     Checks: duplicate enrollment, challenge capacity, challenge exists.
--     On success: inserts participation row + increments filled_slots atomically.
--     Returns: { success: true } | { success: false, error: "<code>" }
--
--   drop_challenge(p_challenge_id, p_creator_id) → jsonb
--     Deletes participation row + decrements filled_slots atomically.
--     Returns: { success: true } | { success: false, error: "<code>" }
-- ════════════════════════════════════════════════════════════════════════════════

-- ── enroll_in_challenge ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION enroll_in_challenge(p_challenge_id uuid, p_creator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ch challenges%ROWTYPE;
  existing_id uuid;
BEGIN
  -- Detect duplicate before acquiring row lock
  SELECT id INTO existing_id
  FROM challenge_participations
  WHERE challenge_id = p_challenge_id AND creator_id = p_creator_id;

  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_enrolled');
  END IF;

  -- Lock the challenge row for the remainder of this transaction to prevent
  -- concurrent over-enrollment (two users grabbing the last slot at once).
  SELECT * INTO ch FROM challenges WHERE id = p_challenge_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'challenge_not_found');
  END IF;

  IF ch.status NOT IN ('open', 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'challenge_closed');
  END IF;

  IF ch.max_slots IS NOT NULL AND ch.filled_slots >= ch.max_slots THEN
    RETURN jsonb_build_object('success', false, 'error', 'challenge_full');
  END IF;

  INSERT INTO challenge_participations (challenge_id, creator_id, status)
  VALUES (p_challenge_id, p_creator_id, 'enrolled');

  UPDATE challenges
  SET filled_slots = filled_slots + 1,
      updated_at   = NOW()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION enroll_in_challenge(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION enroll_in_challenge(uuid, uuid) TO authenticated, service_role;

-- ── drop_challenge ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION drop_challenge(p_challenge_id uuid, p_creator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM challenge_participations
  WHERE challenge_id = p_challenge_id AND creator_id = p_creator_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_enrolled');
  END IF;

  UPDATE challenges
  SET filled_slots = GREATEST(COALESCE(filled_slots, 0) - 1, 0),
      updated_at   = NOW()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION drop_challenge(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION drop_challenge(uuid, uuid) TO authenticated, service_role;
