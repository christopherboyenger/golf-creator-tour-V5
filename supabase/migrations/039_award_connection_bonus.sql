-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 039_award_connection_bonus.sql
-- Purpose: Add SECURITY DEFINER RPC for the one-time 50-pt connection bonus.
--
--   Background
--   ──────────
--   The OAuth callback routes (instagram, tiktok, youtube) and connect-handle
--   route tried to INSERT into points_log directly using the authenticated user
--   client, but points_log has no INSERT RLS policy for regular users — those
--   inserts fail silently, so the connection bonus and milestone points were
--   never saved.
--
--   This function mirrors award_follower_milestones() — it runs as SECURITY
--   DEFINER (bypassing RLS), uses ON CONFLICT DO NOTHING on the
--   social_follower_milestones unique key (threshold = -1 as the connection-
--   bonus sentinel) for idempotency, and performs a single additive UPDATE
--   on creator_season_stats to avoid the read-modify-write race condition.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION award_connection_bonus(
  p_creator_id UUID,
  p_season_id  UUID,
  p_platform   TEXT
)
RETURNS INTEGER   -- 50 if newly awarded, 0 if already awarded this season
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bonus    INTEGER := 50;
  v_inserted BOOLEAN;
BEGIN
  IF p_season_id IS NULL THEN
    RETURN 0;
  END IF;

  -- threshold = -1 is the connection-bonus sentinel.
  -- The unique constraint (creator_id, season_id, platform, threshold)
  -- ensures this is awarded exactly once per platform per season.
  INSERT INTO social_follower_milestones
         (creator_id, season_id, platform, threshold, points_awarded)
  VALUES (p_creator_id, p_season_id, p_platform, -1, v_bonus)
  ON CONFLICT (creator_id, season_id, platform, threshold) DO NOTHING;

  v_inserted := FOUND;

  IF NOT v_inserted THEN
    RETURN 0;
  END IF;

  INSERT INTO points_log (creator_id, season_id, source, points, description)
  VALUES (p_creator_id, p_season_id, 'social_connection', v_bonus,
          p_platform || ' account connected');

  -- Additive UPDATE — no read-modify-write, safe under concurrency.
  INSERT INTO creator_season_stats (creator_id, season_id, total_points)
  VALUES (p_creator_id, p_season_id, v_bonus)
  ON CONFLICT (creator_id, season_id)
  DO UPDATE SET
    total_points = creator_season_stats.total_points + EXCLUDED.total_points,
    updated_at   = now();

  RETURN v_bonus;
END;
$$;

GRANT EXECUTE ON FUNCTION award_connection_bonus(UUID, UUID, TEXT) TO authenticated;
