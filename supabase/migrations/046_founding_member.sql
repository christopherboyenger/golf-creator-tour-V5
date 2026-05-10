-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 046_founding_member.sql
-- Purpose: Track the first 100 Elite Annual subscribers as Founding Members.
--          founder_type on creators remains for OG company founders only.
--          founding_member_number on memberships is for the first 100 Elite
--          Annual paying subscribers (1–100). NULL = not a founding member.
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS founding_member_number INTEGER DEFAULT NULL;

-- Enforce uniqueness: two people cannot share the same founding member slot.
-- Partial index so NULL values (non-founders) aren't constrained.
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_founding_member_number
  ON memberships (founding_member_number)
  WHERE founding_member_number IS NOT NULL;

-- Ensure the number is always a valid slot (1–100).
ALTER TABLE memberships
  ADD CONSTRAINT chk_founding_member_number
  CHECK (founding_member_number IS NULL OR (founding_member_number >= 1 AND founding_member_number <= 100));

-- ────────────────────────────────────────────────────────────────────────────
-- assign_founding_member(p_creator_id UUID)
-- Called by the Stripe webhook on Elite Annual checkout.session.completed.
-- Uses a transaction-level advisory lock to prevent two concurrent webhook
-- calls from both claiming the last founding member slot.
-- Returns the assigned number (1–100), or NULL if slots are full.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_founding_member(p_creator_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count   INTEGER;
  v_number  INTEGER;
BEGIN
  -- Serialize all concurrent calls to this function.
  -- pg_advisory_xact_lock is auto-released at transaction end.
  PERFORM pg_advisory_xact_lock(8675309);

  -- Count slots already assigned.
  SELECT COUNT(*) INTO v_count
    FROM memberships
   WHERE founding_member_number IS NOT NULL;

  IF v_count >= 100 THEN
    RETURN NULL;
  END IF;

  v_number := v_count + 1;

  UPDATE memberships
     SET founding_member_number = v_number
   WHERE creator_id = p_creator_id
     AND founding_member_number IS NULL;

  RETURN v_number;
END;
$$;
