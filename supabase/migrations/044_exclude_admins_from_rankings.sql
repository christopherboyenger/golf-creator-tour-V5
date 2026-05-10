-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 044_exclude_admins_from_rankings.sql
-- Purpose:
--   Exclude admin/team/superadmin creators from points tracking, ranking
--   computation, leaderboards, and championship qualification logic.
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. Update rank recomputation to skip non-creator roles
CREATE OR REPLACE FUNCTION recompute_season_ranks(p_season_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT css.id,
           ROW_NUMBER() OVER (
             ORDER BY css.total_points DESC, css.updated_at ASC, css.id ASC
           ) AS new_rank
    FROM creator_season_stats css
    JOIN creators c ON c.id = css.creator_id
    WHERE css.season_id = p_season_id
      AND c.role NOT IN ('admin', 'team', 'superadmin')
  )
  UPDATE creator_season_stats css
  SET rank = r.new_rank
  FROM ranked r
  WHERE css.id = r.id
    AND css.rank IS DISTINCT FROM r.new_rank;

  -- Null out rank for admin/team rows so they never appear in standings
  UPDATE creator_season_stats css
  SET rank = NULL,
      total_points = 0,
      is_qualified = FALSE
  FROM creators c
  WHERE c.id = css.creator_id
    AND css.season_id = p_season_id
    AND c.role IN ('admin', 'team', 'superadmin')
    AND (css.rank IS NOT NULL OR css.total_points <> 0 OR css.is_qualified IS TRUE);
$$;

-- 2. Backfill: zero out admin season stats now and recompute every season's ranks
DO $$
DECLARE
  v_season UUID;
BEGIN
  UPDATE creator_season_stats css
  SET total_points = 0, rank = NULL, is_qualified = FALSE
  FROM creators c
  WHERE c.id = css.creator_id
    AND c.role IN ('admin', 'team', 'superadmin');

  FOR v_season IN SELECT DISTINCT season_id FROM creator_season_stats LOOP
    PERFORM recompute_season_ranks(v_season);
  END LOOP;
END $$;
