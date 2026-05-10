-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 009_onboarding_tracking.sql
-- Purpose: Track onboarding completion in the creators table so the server
--          can enforce the onboarding flow for newly activated accounts.
--          Previously onboarding state was only in localStorage, which meant
--          test accounts (and real accounts) could skip onboarding entirely
--          if they refreshed or hit a race condition after password reset.
-- ════════════════════════════════════════════════════════════════════════════════

-- Add onboarding_completed flag — defaults to FALSE for new creators
ALTER TABLE creators ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Back-fill: mark every already-active creator as onboarded so existing
-- users are not forced through the flow again.
UPDATE creators SET onboarding_completed = TRUE WHERE status = 'active' AND onboarding_completed IS NOT TRUE;
