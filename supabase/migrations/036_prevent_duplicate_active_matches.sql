-- Prevent duplicate active/pending matches between the same pair of players.
--
-- The client already checks for existing active matches before inserting, but
-- that SELECT→INSERT sequence has a race-condition window.  A unique partial
-- index makes the INSERT itself atomic: if a concurrent request slips through
-- the client-side guard the database will reject it with a unique_violation,
-- which sendMatchChallenge already surfaces to the user as a friendly error.
--
-- The index is normalised (LEAST/GREATEST) so it catches both orderings of
-- challenger_id / opponent_id regardless of who sent the challenge first.
--
-- We clean up any pre-existing duplicates first (keep the oldest row) so the
-- migration doesn't fail on dirty data.

-- 1. Remove duplicate active/pending matches (keep earliest challenged_at)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        LEAST(challenger_id::text, opponent_id::text),
        GREATEST(challenger_id::text, opponent_id::text)
      ORDER BY challenged_at ASC
    ) AS rn
  FROM matches
  WHERE status IN ('pending', 'accepted', 'in_progress')
)
DELETE FROM matches
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Add the unique partial index
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_match_pair
  ON matches (
    LEAST(challenger_id::text, opponent_id::text),
    GREATEST(challenger_id::text, opponent_id::text)
  )
  WHERE status IN ('pending', 'accepted', 'in_progress');
