-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 041_match_completion_awards.sql
-- Purpose: Wire up match approvals so that admins marking a match complete
--          awards points to both creators, increments win/loss counters, and
--          unlocks the "First Win" / "Triple Crown" badges atomically.
--
--          Also seeds the achievements catalog (the table existed but was
--          empty in production, so creator_achievements rows had nothing to
--          point at).
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. Seed the achievements catalog ────────────────────────────────────────────
INSERT INTO achievements (name, letter, description, category, sort_order) VALUES
  ('First Win',         'W',   'Win your first match',                       'match',     10),
  ('Triple Crown',      'TC',  'Win 3 matches in a row',                     'match',     20),
  ('Fan Favorite',      'FF',  'Reach 50K total followers',                  'social',    30),
  ('Viral Creator',     'V',   'Reach 100K followers on any platform',       'social',    40),
  ('Iron Streak',       '7',   'Maintain a 7-day activity streak',           'streak',    50),
  ('Diamond Streak',    '30',  'Maintain a 30-day activity streak',          'streak',    60),
  ('Points Machine',    'PM',  'Earn 5,000+ points in a season',             'points',    70),
  ('Elite Status',      'E',   'Reach the top 10 on the leaderboard',        'rank',      80),
  ('Challenge Master',  'CM',  'Complete 10 brand challenges',               'challenge', 90),
  ('Rising Creator',    'RC',  'Connect your first social platform',         'social',   100),
  ('GCO Champion',      'GCO', 'Win The Golf Creator Open',                  'event',    110),
  ('Season Exempt',     'SE',  'Earn a champion exemption',                  'rank',     120),
  ('OG Member',         'OG',  'Be a Season 1 founding creator',             'tenure',   130)
ON CONFLICT (letter) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  category    = EXCLUDED.category,
  sort_order  = EXCLUDED.sort_order;

-- ── 2. Match completion awards RPC ──────────────────────────────────────────────
-- Called from /api/admin/update-match after a match is marked completed with a
-- winner_id. Runs SECURITY DEFINER so it can write to points_log,
-- creator_season_stats, creator_achievements, and notifications regardless of
-- the calling admin's RLS-visible scope.
--
-- Idempotency: a unique reference_id pattern on points_log ('match_win:<id>'
-- and 'match_loss:<id>') would be ideal but points_log has no unique
-- constraint, so we instead guard on whether the match already has a row in
-- points_log with source='match_win' for this match. This means re-running
-- the RPC for the same match is a no-op.

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
    ELSE v_pts_win := 500; v_pts_lose := 250;
  END CASE;

  -- Persist the awarded amounts on the match row
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
  -- Walk back through the winner's most recent completed matches; count the
  -- consecutive wins ending with this one.
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
    'success',            true,
    'winner_id',          v_winner_id,
    'loser_id',           v_loser_id,
    'points_winner',      v_pts_win,
    'points_loser',       v_pts_lose,
    'unlocked',           v_unlocked
  );
END;
$$;

GRANT EXECUTE ON FUNCTION award_match_completion(UUID) TO authenticated, service_role;
