-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 029_admin_audit_log.sql
-- Purpose:   Append-only audit trail of every admin write (create/update/delete).
--            Captures actor, action, target, and the field-level diff so we can
--            reconstruct what a given admin changed and when.
--
-- Security:  Admins/superadmins can INSERT and SELECT. No UPDATE or DELETE
--            policies are defined — the table is append-only by design.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid REFERENCES creators(id) ON DELETE SET NULL,
  actor_role    text,
  action        text NOT NULL,
  target_table  text,
  target_id     text,
  diff          jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor_id
  ON admin_audit_log(actor_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target
  ON admin_audit_log(target_table, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action
  ON admin_audit_log(action);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_log_select_admins" ON admin_audit_log;
CREATE POLICY "admin_audit_log_select_admins" ON admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
        AND c.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "admin_audit_log_insert_admins" ON admin_audit_log;
CREATE POLICY "admin_audit_log_insert_admins" ON admin_audit_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
        AND c.role IN ('admin', 'superadmin')
    )
  );
