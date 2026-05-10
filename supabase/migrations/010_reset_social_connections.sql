-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 010_reset_social_connections.sql
-- Purpose: Reset all social_connections to disconnected state and clear
-- the creators.total_followers cache. No users have logged into the
-- platform yet so all connections should read as connected=false.
-- ════════════════════════════════════════════════════════════════════════════════

-- Reset every social connection row
UPDATE social_connections
SET
  connected      = FALSE,
  followers      = 0,
  last_synced_at = NULL,
  updated_at     = NOW();

-- Clear the cached aggregate on the creators table
UPDATE creators
SET total_followers = 0;
