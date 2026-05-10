-- ══════════════════════════════════════════════════════════════════════════════
-- 020 — Rank maintenance trigger, realtime publication top-up, and
-- seasons.tour_card_deadline column (audit items D2, D7, F9).
-- ══════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- D2 — Auto-maintain creator_season_stats.rank whenever total_points changes.
-- The previous app computed rank client-side after every realtime UPDATE, which
-- meant two tabs could disagree and a new INSERT left `rank` NULL until the
-- next client commit. A statement-level AFTER trigger keyed on total_points
-- (not rank) sidesteps recursion: the recompute UPDATE only touches `rank`.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recompute_season_ranks(p_season_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             ORDER BY total_points DESC, updated_at ASC, id ASC
           ) AS new_rank
    FROM creator_season_stats
    WHERE season_id = p_season_id
  )
  UPDATE creator_season_stats css
  SET rank = r.new_rank
  FROM ranked r
  WHERE css.id = r.id
    AND css.rank IS DISTINCT FROM r.new_rank;
$$;

CREATE OR REPLACE FUNCTION trg_recompute_ranks_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    FOR v_season IN SELECT DISTINCT season_id FROM old_css LOOP
      PERFORM recompute_season_ranks(v_season);
    END LOOP;
  ELSE
    FOR v_season IN SELECT DISTINCT season_id FROM new_css LOOP
      PERFORM recompute_season_ranks(v_season);
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop if re-running this migration
DROP TRIGGER IF EXISTS trg_css_rank_on_insert ON creator_season_stats;
DROP TRIGGER IF EXISTS trg_css_rank_on_update ON creator_season_stats;
DROP TRIGGER IF EXISTS trg_css_rank_on_delete ON creator_season_stats;

CREATE TRIGGER trg_css_rank_on_insert
AFTER INSERT ON creator_season_stats
REFERENCING NEW TABLE AS new_css
FOR EACH STATEMENT
EXECUTE FUNCTION trg_recompute_ranks_after_change();

-- Only when points change — updating only `rank` must NOT retrigger.
CREATE TRIGGER trg_css_rank_on_update
AFTER UPDATE OF total_points ON creator_season_stats
REFERENCING NEW TABLE AS new_css
FOR EACH STATEMENT
EXECUTE FUNCTION trg_recompute_ranks_after_change();

CREATE TRIGGER trg_css_rank_on_delete
AFTER DELETE ON creator_season_stats
REFERENCING OLD TABLE AS old_css
FOR EACH STATEMENT
EXECUTE FUNCTION trg_recompute_ranks_after_change();

-- Backfill ranks for every existing season so data matches the new invariant.
DO $$
DECLARE
  v_season UUID;
BEGIN
  FOR v_season IN SELECT DISTINCT season_id FROM creator_season_stats LOOP
    PERFORM recompute_season_ranks(v_season);
  END LOOP;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- D7 — Top up supabase_realtime publication with tables the client subscribes
-- to. creator_season_stats, activity_feed, creator_achievements, notifications
-- were already added in earlier migrations; cover the remaining ones.
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['memberships', 'creators', 'match_messages', 'challenges', 'matches']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS %I', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- F9 — Move hardcoded "September 1, 2026" Tour Card deadline off the client
-- and onto the seasons table. Seed the active season with the known value so
-- the UI renders the same date until an admin edits it.
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS tour_card_deadline TIMESTAMP WITH TIME ZONE;

UPDATE seasons
SET tour_card_deadline = TIMESTAMP WITH TIME ZONE '2026-09-01 00:00:00+00'
WHERE tour_card_deadline IS NULL
  AND year = 2026;
