-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 022_cleanup_and_exempt_ranks.sql
-- Purpose:
--   1. Add exempt_rank column so exempt creators hold fixed podium positions
--      (1 = Keaton, 2 = Jose, 3 = Cannon) regardless of season points.
--   2. Delete all test accounts (testcreator*@gct-test.com) and their data.
--   3. Reset every remaining creator's season stats to zero for a clean start.
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. exempt_rank column ─────────────────────────────────────────────────────

ALTER TABLE creators ADD COLUMN IF NOT EXISTS exempt_rank INTEGER DEFAULT NULL;

-- Fixed podium positions (handle values are case-sensitive, match the DB)
UPDATE creators SET exempt_rank = 1 WHERE handle = 'Keaton_v';
UPDATE creators SET exempt_rank = 2 WHERE handle = 'josepelayogolf';
-- TODO: set Cannon's exempt_rank once handle is confirmed:
-- UPDATE creators SET exempt_rank = 3 WHERE handle = '<cannon_handle_here>';

-- ── 2. Delete test accounts ───────────────────────────────────────────────────

-- Remove from auth.users first; ON DELETE SET NULL nulls auth_user_id in creators.
DELETE FROM auth.users
WHERE email LIKE 'testcreator%@gct-test.com';

-- Remove creator records (cascades to creator_season_stats, activity_feed, etc.)
DELETE FROM creators
WHERE email LIKE 'testcreator%@gct-test.com';

-- ── 3. Reset all remaining season stats to zero ───────────────────────────────

UPDATE creator_season_stats
SET total_points         = 0,
    rank                 = NULL,
    challenges_completed = 0,
    challenges_active    = 0,
    current_streak       = 0,
    best_streak          = 0,
    matches_won          = 0,
    matches_lost         = 0,
    is_qualified         = FALSE;

-- Clear activity feed so the live feed starts fresh
DELETE FROM activity_feed;
