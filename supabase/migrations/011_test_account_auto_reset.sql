-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 011_test_account_auto_reset.sql
-- Purpose: Auto-reset test accounts (testcreator01-50@gct-test.com) on every
--          logout so they return to their initial "temp password + must reset"
--          state for the next tester.
--
--          The shared temp password is NOT stored in this migration. It must
--          be provided by the operator via a Postgres runtime setting:
--
--            ALTER DATABASE postgres SET app.gct_test_password = '<value>';
--
--          Run that once (from the Supabase SQL editor) before this migration
--          runs. If the setting is unset, the trigger is a no-op for safety —
--          it will NOT reset any password.
-- ════════════════════════════════════════════════════════════════════════════════

-- pgcrypto is required for crypt() / gen_salt() to hash the temp password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ──────────────────────────────────────────────────────────────────────────────
-- FUNCTION: reset_test_account_on_logout
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reset_test_account_on_logout()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_temp_password TEXT;
BEGIN
  -- Read the shared test password from a database runtime setting.
  -- If unset, bail out silently — never reset to a guessable default.
  v_temp_password := current_setting('app.gct_test_password', true);
  IF v_temp_password IS NULL OR length(v_temp_password) = 0 THEN
    RETURN OLD;
  END IF;

  -- Look up the email for the session's user
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = OLD.user_id;

  -- Only process accounts matching the test account pattern
  IF v_email LIKE 'testcreator%@gct-test.com' THEN

    -- 1. Reset the Supabase auth password to the shared temp password
    UPDATE auth.users
    SET
      encrypted_password = crypt(v_temp_password, gen_salt('bf')),
      updated_at         = NOW()
    WHERE id = OLD.user_id;

    -- 2. Reset the creators table flags so the next tester goes through the
    --    full first-login experience (password reset → onboarding)
    UPDATE creators
    SET
      must_reset_password  = TRUE,
      onboarding_completed = FALSE,
      status               = 'approved_not_activated'
    WHERE auth_user_id = OLD.user_id;

  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────────────────────────────
-- TRIGGER: fires after any session row is deleted (sign-out or expiry)
-- ──────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_reset_test_account_on_logout ON auth.sessions;
CREATE TRIGGER trg_reset_test_account_on_logout
  AFTER DELETE ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION reset_test_account_on_logout();

-- ──────────────────────────────────────────────────────────────────────────────
-- ONE-TIME FIX: reset the creators table flags for test accounts so they need
-- to go through the first-login flow. We do NOT reset auth.users.encrypted_password
-- here — that requires the runtime setting described above, and will happen
-- automatically on the next logout for each account.
--
-- If you need to reset passwords immediately for all 50 test accounts, set
-- the runtime setting first and then run:
--
--   DO $$
--   DECLARE u record; v text;
--   BEGIN
--     v := current_setting('app.gct_test_password', true);
--     IF v IS NULL OR length(v) = 0 THEN RAISE EXCEPTION 'app.gct_test_password not set'; END IF;
--     FOR u IN SELECT id FROM auth.users WHERE email LIKE 'testcreator%@gct-test.com' LOOP
--       UPDATE auth.users SET encrypted_password = crypt(v, gen_salt('bf')), updated_at = NOW() WHERE id = u.id;
--     END LOOP;
--   END $$;
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE creators
SET
  must_reset_password  = TRUE,
  onboarding_completed = FALSE,
  status               = 'approved_not_activated'
WHERE email LIKE 'testcreator%@gct-test.com';
