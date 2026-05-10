-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 013_instagram_token_storage.sql
-- Purpose: Add OAuth token storage columns to social_connections so the
-- Instagram/YouTube/TikTok callback handlers can persist access tokens,
-- platform user IDs, and expiration timestamps. Without these columns the
-- callback INSERT fails and connections never complete.
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE social_connections
  ADD COLUMN IF NOT EXISTS access_token     TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token    TEXT,
  ADD COLUMN IF NOT EXISTS platform_user_id TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Tighten read policy: the previous policy let any authenticated user read rows
-- where connected=TRUE, which would expose the new token columns. Restrict the
-- table-level SELECT to the owning creator. Cross-user follower counts are
-- surfaced via creators.total_followers / creators.ig_followers aggregates and
-- via the social_connections_public view below.
DROP POLICY IF EXISTS "social_connections_read" ON social_connections;

CREATE POLICY "social_connections_read_own" ON social_connections
  FOR SELECT
  USING (
    creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- Public view exposing only non-sensitive columns for browse pages
-- (connect/leaderboard cards that show follower counts per platform).
CREATE OR REPLACE VIEW social_connections_public AS
  SELECT id, creator_id, platform, handle, followers, connected, last_synced_at
  FROM social_connections
  WHERE connected = TRUE;

GRANT SELECT ON social_connections_public TO anon, authenticated;
