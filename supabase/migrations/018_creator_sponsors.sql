-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 018_creator_sponsors.sql
-- Purpose: Move creator sponsor list off localStorage and into Postgres so
--          the data survives cache clears and follows the creator across
--          devices. RLS: readable by anyone (shown on public profile),
--          writable only by the creator it belongs to.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS creator_sponsors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  website    TEXT,
  note       TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_sponsors_creator ON creator_sponsors(creator_id, sort_order);

ALTER TABLE creator_sponsors ENABLE ROW LEVEL SECURITY;

-- Public read — sponsors appear on the public creator profile
CREATE POLICY "creator_sponsors_read_all" ON creator_sponsors
  FOR SELECT USING (TRUE);

-- Owner-only write
CREATE POLICY "creator_sponsors_insert_own" ON creator_sponsors
  FOR INSERT
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "creator_sponsors_update_own" ON creator_sponsors
  FOR UPDATE
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "creator_sponsors_delete_own" ON creator_sponsors
  FOR DELETE
  USING (creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1));
