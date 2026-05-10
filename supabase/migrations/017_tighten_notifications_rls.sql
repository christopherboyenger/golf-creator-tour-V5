-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 017_tighten_notifications_rls.sql
-- Purpose: The notifications INSERT policy was WITH CHECK (TRUE), meaning any
--          authenticated user could forge notifications to any recipient.
--          Replace with an admin-only client policy. Server-side code that
--          needs to insert system notifications must use the service role.
--
-- Handles both schemas the repo has produced (006 used creator_id, 007 used
-- recipient_id). Whichever one ended up live in prod, we tighten its policy.
-- ════════════════════════════════════════════════════════════════════════════════

-- Drop the over-permissive policies from both prior migrations if they exist
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;

-- Admin-only client-side inserts. Triggers / edge functions running under
-- service_role bypass RLS and are unaffected.
CREATE POLICY "notifications_insert_admin_only" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
        AND c.role IN ('admin', 'superadmin')
    )
  );
