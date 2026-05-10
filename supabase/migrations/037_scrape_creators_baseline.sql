-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 037_scrape_creators_baseline.sql
--
-- Adds public-scrape tracking to social_connections:
--   • baseline_followers  — count recorded on first verified scrape; used by
--                           leaderboard to compute growth = followers - baseline
--   • scrape_verified_at  — timestamp of last successful Scrape Creators fetch
--
-- Creates follower_snapshots for daily time-series storage:
--   One row per (creator, platform, date).  ON CONFLICT DO UPDATE means the
--   cron job is idempotent — re-running it on the same calendar day is safe.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1.  Extend social_connections ────────────────────────────────────────────

ALTER TABLE social_connections
  ADD COLUMN IF NOT EXISTS baseline_followers  INTEGER,
  ADD COLUMN IF NOT EXISTS scrape_verified_at  TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN social_connections.baseline_followers IS
  'Follower count on first successful Scrape Creators fetch. Never overwritten. '
  'Leaderboard growth = followers - baseline_followers.';

COMMENT ON COLUMN social_connections.scrape_verified_at IS
  'Timestamp of the most recent successful Scrape Creators public-data fetch.';

-- ── 2.  follower_snapshots ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS follower_snapshots (
  id           UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   UUID                     NOT NULL REFERENCES creators  ON DELETE CASCADE,
  platform     TEXT                     NOT NULL
                 CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  snapshot_date DATE                    NOT NULL DEFAULT CURRENT_DATE,
  followers    INTEGER                  NOT NULL,
  recorded_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE (creator_id, platform, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_fs_creator_platform
  ON follower_snapshots (creator_id, platform, snapshot_date DESC);

ALTER TABLE follower_snapshots ENABLE ROW LEVEL SECURITY;

-- Creators read their own snapshots; admins read all.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'follower_snapshots' AND policyname = 'fs_read_own'
  ) THEN
    CREATE POLICY "fs_read_own" ON follower_snapshots
      FOR SELECT
      USING (
        creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'follower_snapshots' AND policyname = 'fs_read_admins'
  ) THEN
    CREATE POLICY "fs_read_admins" ON follower_snapshots
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
