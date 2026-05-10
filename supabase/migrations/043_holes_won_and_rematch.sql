-- ──────────────────────────────────────────────────────────────────────────────
-- 043 — Holes won + rematch tracking
--   * Adds challenger_holes_won / opponent_holes_won to matches
--   * Adds is_rematch flag to matches
--   * Updates the match-request notification trigger so rematches surface as
--     "challenged you to a rematch" and carry a 2x points multiplier metadata
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS challenger_holes_won int,
  ADD COLUMN IF NOT EXISTS opponent_holes_won int,
  ADD COLUMN IF NOT EXISTS is_rematch boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION notify_match_request()
RETURNS TRIGGER AS $$
DECLARE
  challenger_name text;
BEGIN
  SELECT name INTO challenger_name FROM creators WHERE id = NEW.challenger_id;

  INSERT INTO notifications (recipient_id, sender_id, type, title, body, metadata)
  VALUES (
    NEW.opponent_id,
    NEW.challenger_id,
    'match_request',
    CASE WHEN NEW.is_rematch THEN 'New Rematch Challenge' ELSE 'New Match Challenge' END,
    challenger_name || ' challenged you to a ' || CASE WHEN NEW.is_rematch THEN 'rematch' ELSE 'match' END,
    jsonb_build_object(
      'match_id', NEW.id,
      'match_type', NEW.match_type,
      'is_rematch', NEW.is_rematch,
      'points_multiplier', CASE WHEN NEW.is_rematch THEN 2 ELSE 1 END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
