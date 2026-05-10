-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 016_auto_complete_match_by_format.sql
-- Purpose: Replace auto_complete_match so it respects matches.match_type.
--   - stroke / scramble / 9hole → LOW score wins (stroke play)
--   - match / skins             → HIGH score wins (holes or skins count)
--   Ties leave winner_id NULL for manual resolution.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_complete_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.challenger_score IS NOT NULL
     AND NEW.opponent_score IS NOT NULL
     AND NEW.status = 'accepted'
  THEN
    NEW.status := 'completed';
    NEW.completed_at := NOW();

    IF NEW.match_type IN ('stroke', 'scramble', '9hole') THEN
      -- Stroke play: lowest score wins
      IF NEW.challenger_score < NEW.opponent_score THEN
        NEW.winner_id := NEW.challenger_id;
      ELSIF NEW.opponent_score < NEW.challenger_score THEN
        NEW.winner_id := NEW.opponent_id;
      ELSE
        NEW.winner_id := NULL; -- tie, manual resolve
      END IF;
    ELSIF NEW.match_type IN ('match', 'skins') THEN
      -- Match play / skins: highest score (holes or skins won) wins
      IF NEW.challenger_score > NEW.opponent_score THEN
        NEW.winner_id := NEW.challenger_id;
      ELSIF NEW.opponent_score > NEW.challenger_score THEN
        NEW.winner_id := NEW.opponent_id;
      ELSE
        NEW.winner_id := NULL; -- tie, manual resolve
      END IF;
    ELSE
      -- Unknown format: don't guess
      NEW.winner_id := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
