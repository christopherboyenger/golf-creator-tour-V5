-- ════════════════════════════════════════════════════════════════════════════════
-- Migration 033: creator_applications
-- Stores raw signup form submissions from golfcreatortour.com/apply.
-- Separate from `creators` table — admin reviews and promotes to creator record.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS creator_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Personal info
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  handle        TEXT NOT NULL,
  country       TEXT,
  state         TEXT,
  city          TEXT,
  gender        CHAR(2),
  handicap      NUMERIC(4,1),
  bio           TEXT,
  -- Social handles (raw text, not yet verified)
  instagram     TEXT,
  tiktok        TEXT,
  youtube       TEXT,
  -- Referral
  referral_code TEXT,
  -- Admin workflow
  status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'reviewing', 'approved', 'rejected')),
  admin_notes   TEXT,
  reviewed_by   UUID REFERENCES creators(id),
  reviewed_at   TIMESTAMP WITH TIME ZONE,
  -- Converts to a creator record when approved
  creator_id    UUID REFERENCES creators(id),
  -- Meta
  ip_address    TEXT,
  submitted_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_apps_status    ON creator_applications(status);
CREATE INDEX IF NOT EXISTS idx_creator_apps_email     ON creator_applications(email);
CREATE INDEX IF NOT EXISTS idx_creator_apps_submitted ON creator_applications(submitted_at DESC);

ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;

-- Public: anyone can submit (INSERT only, no auth required)
CREATE POLICY "public_can_apply" ON creator_applications
  FOR INSERT
  WITH CHECK (true);

-- Admins can read/update all applications
CREATE POLICY "admins_manage_applications" ON creator_applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- Enable realtime for live admin dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE creator_applications;
