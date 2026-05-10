-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 035_safe_follower_milestone_sync.sql
-- Purpose: Make follower-milestone awarding idempotent and concurrency-safe.
--
--   1. social_follower_milestones — one row per (creator, season, platform,
--      threshold).  The UNIQUE constraint is the idempotency fence: a second
--      concurrent INSERT for the same milestone is silently discarded.
--
--   2. award_follower_milestones() — SECURITY DEFINER RPC called from the
--      Next.js route.  Everything (milestone record, points_log row, and the
--      creator_season_stats increment) happens inside a single PL/pgSQL call
--      that Postgres executes atomically.  The +total_points path uses an
--      additive UPDATE rather than a read-then-write, eliminating the lost-
--      update race in the old route.
--
--   3. GRANT EXECUTE on the function to the authenticated role so the route
--      can call it with the user's anon key without needing a service client.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1.  Milestone tracking table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_follower_milestones (
  id             UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id     UUID                     NOT NULL REFERENCES creators  ON DELETE CASCADE,
  season_id      UUID                     NOT NULL REFERENCES seasons   ON DELETE CASCADE,
  platform       TEXT                     NOT NULL
                   CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  threshold      INTEGER                  NOT NULL,
  points_awarded INTEGER                  NOT NULL,
  awarded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- This constraint is the single-award guarantee.
  -- ON CONFLICT DO NOTHING on this key makes every duplicate a no-op.
  UNIQUE (creator_id, season_id, platform, threshold)
);

CREATE INDEX IF NOT EXISTS idx_sfm_creator_season
  ON social_follower_milestones (creator_id, season_id);

ALTER TABLE social_follower_milestones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'social_follower_milestones' AND policyname = 'sfm_read_own'
  ) THEN
    CREATE POLICY "sfm_read_own" ON social_follower_milestones
      FOR SELECT
      USING (
        creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'social_follower_milestones' AND policyname = 'sfm_read_admins'
  ) THEN
    CREATE POLICY "sfm_read_admins" ON social_follower_milestones
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM creators c
          WHERE c.auth_user_id = auth.uid()
            AND c.role IN ('admin', 'superadmin')
        )
      );
  END IF;
END $$;


-- ── 2.  Atomic, idempotent RPC ────────────────────────────────────────────────
--
--  Parameters
--    p_creator_id  UUID    — the creator whose milestone is being evaluated
--    p_season_id   UUID    — active season (pass NULL to skip points logic)
--    p_platform    TEXT    — 'instagram' | 'youtube' | 'tiktok'
--    p_old_count   INTEGER — follower count before this sync
--    p_new_count   INTEGER — follower count just fetched from the platform API
--
--  Returns one row per threshold that was *evaluated* (old < threshold <= new).
--    threshold  — the milestone boundary
--    points     — points attached to that milestone
--    awarded    — TRUE if newly granted this call, FALSE if already held

CREATE OR REPLACE FUNCTION award_follower_milestones(
  p_creator_id UUID,
  p_season_id  UUID,
  p_platform   TEXT,
  p_old_count  INTEGER,
  p_new_count  INTEGER
)
RETURNS TABLE (
  threshold INTEGER,
  points    INTEGER,
  awarded   BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Milestone table as parallel arrays so the function owns the definition.
  -- Keeping it here (rather than a lookup table) means the route and the DB
  -- stay in sync automatically after this migration runs.
  v_thresholds  INTEGER[] :=
    ARRAY[100, 1000, 5000, 10000, 20000, 50000, 100000, 250000, 500000, 1000000];
  v_point_vals  INTEGER[] :=
    ARRAY[100,   25,   50,    75,   100,   150,    250,    500,    500,    1000];

  v_i            INTEGER;
  v_threshold    INTEGER;
  v_pts          INTEGER;
  v_total        INTEGER := 0;
  v_row_inserted BOOLEAN;
BEGIN
  -- Bail out early when there is nothing to evaluate.
  IF p_new_count <= p_old_count THEN
    RETURN;
  END IF;

  FOR v_i IN 1 .. array_length(v_thresholds, 1) LOOP
    v_threshold := v_thresholds[v_i];
    v_pts       := v_point_vals[v_i];

    -- Only process thresholds that were newly crossed this sync.
    IF p_new_count >= v_threshold AND p_old_count < v_threshold THEN

      -- Attempt to claim the milestone.
      -- The unique constraint (creator_id, season_id, platform, threshold)
      -- means a second call (retry, concurrent request, repeated sync) produces
      -- zero inserted rows — FOUND stays FALSE — and nothing else changes.
      IF p_season_id IS NOT NULL THEN
        INSERT INTO social_follower_milestones
               (creator_id, season_id, platform, threshold, points_awarded)
        VALUES (p_creator_id, p_season_id, p_platform, v_threshold, v_pts)
        ON CONFLICT (creator_id, season_id, platform, threshold) DO NOTHING;

        v_row_inserted := FOUND;   -- TRUE only when a new row was written
      ELSE
        v_row_inserted := FALSE;
      END IF;

      IF v_row_inserted THEN
        -- Immutable audit entry — one row per award, never updated.
        INSERT INTO points_log (creator_id, season_id, source, points, description)
        VALUES (
          p_creator_id,
          p_season_id,
          p_platform || '_milestone',
          v_pts,
          p_platform || ' reached ' || v_threshold::TEXT || ' followers'
        );

        v_total := v_total + v_pts;
      END IF;

      RETURN QUERY SELECT v_threshold, v_pts, v_row_inserted;
    END IF;
  END LOOP;

  -- Single additive UPDATE — no read-modify-write, safe under concurrency.
  IF v_total > 0 THEN
    INSERT INTO creator_season_stats (creator_id, season_id, total_points)
    VALUES (p_creator_id, p_season_id, v_total)
    ON CONFLICT (creator_id, season_id)
    DO UPDATE SET
      total_points = creator_season_stats.total_points + EXCLUDED.total_points,
      updated_at   = now();
  END IF;
END;
$$;

-- Authenticated users may invoke the function; SECURITY DEFINER provides the
-- elevated privileges needed to bypass RLS on the tables written inside it.
GRANT EXECUTE ON FUNCTION award_follower_milestones(UUID, UUID, TEXT, INTEGER, INTEGER)
  TO authenticated;
