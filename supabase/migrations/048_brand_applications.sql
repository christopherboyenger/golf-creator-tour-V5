-- ════════════════════════════════════════════════════════════════════════════════
-- Migration 048: brand_applications
-- Stores raw brand partnership submissions from golfcreatortour.com/apply.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS brand_applications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Brand info
  brand_name           TEXT NOT NULL,
  website              TEXT,
  instagram            TEXT,
  tiktok               TEXT,
  contact_name         TEXT NOT NULL,
  contact_email        TEXT NOT NULL,
  phone                TEXT,
  company_location     TEXT,
  -- Category & partnership
  category             TEXT,
  partnership_interest TEXT[],
  budget_range         TEXT,
  -- Admin workflow
  status               TEXT NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new', 'reviewing', 'approved', 'rejected')),
  admin_notes          TEXT,
  reviewed_by          UUID REFERENCES creators(id),
  reviewed_at          TIMESTAMP WITH TIME ZONE,
  -- Meta
  ip_address           TEXT,
  submitted_at         TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_apps_status    ON brand_applications(status);
CREATE INDEX IF NOT EXISTS idx_brand_apps_email     ON brand_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_brand_apps_submitted ON brand_applications(submitted_at DESC);

ALTER TABLE brand_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_can_apply_brand" ON brand_applications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admins_manage_brand_applications" ON brand_applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE brand_applications;
