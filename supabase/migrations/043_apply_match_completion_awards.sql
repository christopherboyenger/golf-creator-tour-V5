-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 043_apply_match_completion_awards.sql
-- Purpose: The award_match_completion RPC was written in 041 but never applied
--          to the live database. As a result, admins marking matches complete
--          triggered a silent RPC error — notifications fired (via the separate
--          trg_notify_match_status trigger) but no points were ever issued.
--
--          This migration:
--            1. Creates award_match_completion — awards points to both creators,
--               increments win/loss counters, unlocks First Win / Triple Crown,
--               and creates rich match_completed notifications (with points info).
--            2. Removes the 'completed' branch from notify_match_status_change so
--               the trigger no longer creates bare notifications; the RPC handles
--               those with full points metadata.
--            3. Retroactively awards points for any already-completed matches
--               that have no points_log entry yet.
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. award_match_completion RPC ────────────────────────────────────────────
-- Called from /api/admin/update-match after a match is marked completed with a
-- winner_id. SECURITY DEFINER so it can write to all tables regardless of RLS.
-- Idempotent: re-running for the same match is a no-op.

CREATE OR REPLACE FUNCTION award_match_completion(p_match_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match            RECORD;
  v_winner_id        UUID;
  v_loser_id         UUID;
  v_season_id        UUID;
  v_match_type       TEXT;
  v_pts_win          INTEGER;
  v_pts_lose         INTEGER;
  v_existing         INTEGER;
  v_first_win_id     UUID;
  v_triple_crown_id  UUID;
  v_winner_wins      INTEGER;
  v_recent_streak    INTEGER;
  v_unlocked         JSONB := '[]'::jsonb;
  v_achievement      RECORD;
  v_inserted_count   INTEGER;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND OR v_match.winner_id IS NULL OR v_match.status <> 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'match_not_completed');
  END IF;

  -- Idempotency guard
  SELECT COUNT(*) INTO v_existing
    FROM points_log
    WHERE source = 'match_win' AND reference_id = p_match_id;
  IF v_existing > 0 THEN
    RETURN jsonb_build_object('success', true, 'already_awarded', true);
  END IF;

  v_winner_id  := v_match.winner_id;
  v_loser_id   := CASE WHEN v_winner_id = v_match.challenger_id
                       THEN v_match.opponent_id
                       ELSE v_match.challenger_id END;
  v_season_id  := v_match.season_id;
  v_match_type := v_match.match_type;

  -- Points table mirrors lib/constants.ts::MATCH_TYPES
  CASE v_match_type
    WHEN 'stroke'   THEN v_pts_win := 750; v_pts_lose := 250;
    WHEN 'match'    THEN v_pts_win := 750; v_pts_lose := 250;
    WHEN 'skins'    THEN v_pts_win := 500; v_pts_lose := 300;
    WHEN 'scramble' THEN v_pts_win := 600; v_pts_lose := 350;
    WHEN '9hole'    THEN v_pts_win := 400; v_pts_lose := 150;
    ELSE                 v_pts_win := 500; v_pts_lose := 250;
  END CASE;

  -- Persist the awarded amounts on the match row itself
  UPDATE matches
     SET points_winner = v_pts_win,
         points_loser  = v_pts_lose
   WHERE id = p_match_id;

  -- ── Winner ────────────────────────────────────────────────────────────────
  INSERT INTO points_log (creator_id, season_id, source, points, description, reference_id)
  VALUES (v_winner_id, v_season_id, 'match_win', v_pts_win,
          'Won ' || v_match_type || ' match', p_match_id);

  INSERT INTO creator_season_stats (creator_id, season_id, total_points, matches_won)
  VALUES (v_winner_id, v_season_id, v_pts_win, 1)
  ON CONFLICT (creator_id, season_id) DO UPDATE SET
    total_points = creator_season_stats.total_points + EXCLUDED.total_points,
    matches_won  = creator_season_stats.matches_won  + 1,
    updated_at   = now();

  -- ── Loser ─────────────────────────────────────────────────────────────────
  INSERT INTO points_log (creator_id, season_id, source, points, description, reference_id)
  VALUES (v_loser_id, v_season_id, 'match_loss', v_pts_lose,
          'Played ' || v_match_type || ' match', p_match_id);

  INSERT INTO creator_season_stats (creator_id, season_id, total_points, matches_lost)
  VALUES (v_loser_id, v_season_id, v_pts_lose, 1)
  ON CONFLICT (creator_id, season_id) DO UPDATE SET
    total_points = creator_season_stats.total_points + EXCLUDED.total_points,
    matches_lost = creator_season_stats.matches_lost + 1,
    updated_at   = now();

  -- ── Notifications: winner + loser ─────────────────────────────────────────
  INSERT INTO notifications (recipient_id, type, title, body, metadata)
  VALUES (
    v_winner_id, 'match_completed', 'Match Complete',
    'You won the match!',
    jsonb_build_object(
      'match_id',       p_match_id,
      'match_type',     v_match_type,
      'result',         'win',
      'points_awarded', v_pts_win
    )
  );

  INSERT INTO notifications (recipient_id, type, title, body, metadata)
  VALUES (
    v_loser_id, 'match_completed', 'Match Complete',
    'You earned ' || v_pts_lose || ' pts for playing — better luck next time!',
    jsonb_build_object(
      'match_id',       p_match_id,
      'match_type',     v_match_type,
      'result',         'loss',
      'points_awarded', v_pts_lose
    )
  );

  -- ── Achievement: First Win ────────────────────────────────────────────────
  SELECT id INTO v_first_win_id FROM achievements WHERE letter = 'W';
  SELECT matches_won INTO v_winner_wins
    FROM creator_season_stats
    WHERE creator_id = v_winner_id AND season_id = v_season_id;

  IF v_first_win_id IS NOT NULL AND v_winner_wins >= 1 THEN
    INSERT INTO creator_achievements (creator_id, achievement_id)
    VALUES (v_winner_id, v_first_win_id)
    ON CONFLICT (creator_id, achievement_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    IF v_inserted_count > 0 THEN
      SELECT * INTO v_achievement FROM achievements WHERE id = v_first_win_id;
      INSERT INTO notifications (recipient_id, type, title, body, metadata)
      VALUES (
        v_winner_id, 'achievement_unlocked',
        'Achievement Unlocked: ' || v_achievement.name,
        v_achievement.description,
        jsonb_build_object(
          'achievement_id',     v_achievement.id,
          'achievement_letter', v_achievement.letter,
          'achievement_name',   v_achievement.name,
          'points_awarded',     0
        )
      );
      v_unlocked := v_unlocked || jsonb_build_array(v_achievement.letter);
    END IF;
  END IF;

  -- ── Achievement: Triple Crown (3 wins in a row) ───────────────────────────
  SELECT COUNT(*) INTO v_recent_streak FROM (
    SELECT winner_id
      FROM matches
      WHERE status = 'completed'
        AND completed_at IS NOT NULL
        AND (challenger_id = v_winner_id OR opponent_id = v_winner_id)
      ORDER BY completed_at DESC
      LIMIT 3
  ) t WHERE winner_id = v_winner_id;

  IF v_recent_streak >= 3 THEN
    SELECT id INTO v_triple_crown_id FROM achievements WHERE letter = 'TC';
    IF v_triple_crown_id IS NOT NULL THEN
      INSERT INTO creator_achievements (creator_id, achievement_id)
      VALUES (v_winner_id, v_triple_crown_id)
      ON CONFLICT (creator_id, achievement_id) DO NOTHING;
      GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

      IF v_inserted_count > 0 THEN
        SELECT * INTO v_achievement FROM achievements WHERE id = v_triple_crown_id;
        INSERT INTO notifications (recipient_id, type, title, body, metadata)
        VALUES (
          v_winner_id, 'achievement_unlocked',
          'Achievement Unlocked: ' || v_achievement.name,
          v_achievement.description,
          jsonb_build_object(
            'achievement_id',     v_achievement.id,
            'achievement_letter', v_achievement.letter,
            'achievement_name',   v_achievement.name,
            'points_awarded',     0
          )
        );
        v_unlocked := v_unlocked || jsonb_build_array(v_achievement.letter);
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success',       true,
    'winner_id',     v_winner_id,
    'loser_id',      v_loser_id,
    'points_winner', v_pts_win,
    'points_loser',  v_pts_lose,
    'unlocked',      v_unlocked
  );
END;
$$;

GRANT EXECUTE ON FUNCTION award_match_completion(UUID) TO authenticated, service_role;

-- ── 2. Remove match_completed branch from notify_match_status_change ──────────
-- The trigger previously sent bare "Match Complete" notifications for completed
-- matches. The RPC now handles those with richer metadata (points_awarded,
-- result). Removing the branch here prevents duplicate notifications.

CREATE OR REPLACE FUNCTION notify_match_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  IF NEW.status = 'accepted' THEN
    INSERT INTO notifications (recipient_id, sender_id, type, title, body, metadata)
    VALUES (
      NEW.challenger_id,
      NEW.opponent_id,
      'match_accepted',
      'Match Accepted',
      (SELECT name FROM creators WHERE id = NEW.opponent_id) || ' accepted your match challenge',
      jsonb_build_object('match_id', NEW.id, 'match_type', NEW.match_type)
    );

  ELSIF NEW.status = 'declined' THEN
    INSERT INTO notifications (recipient_id, sender_id, type, title, body, metadata)
    VALUES (
      NEW.challenger_id,
      NEW.opponent_id,
      'match_declined',
      'Match Declined',
      (SELECT name FROM creators WHERE id = NEW.opponent_id) || ' declined your match request',
      jsonb_build_object('match_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ── 3. Retroactively award points for already-completed matches ───────────────
-- Any match that is completed with a winner but has no points_log entry yet
-- gets processed. The RPC is idempotent so this is safe to re-run.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT m.id
      FROM matches m
      WHERE m.status = 'completed'
        AND m.winner_id IS NOT NULL
        AND m.season_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM points_log pl
          WHERE pl.source = 'match_win' AND pl.reference_id = m.id
        )
  LOOP
    PERFORM award_match_completion(r.id);
  END LOOP;
END $$;
