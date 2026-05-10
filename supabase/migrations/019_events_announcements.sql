-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 019_events_announcements.sql
-- Purpose: Move home-page event schedule + announcements off hardcoded JSX
--          and into Postgres so admins can edit them without a redeploy.
--          RLS: public read (shown to all users), admin-only write.
-- ════════════════════════════════════════════════════════════════════════════════

-- ── events ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id    UUID REFERENCES seasons(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  venue        TEXT,
  -- Array of per-day cards:
  --   [{ date, day_label, title, subtitle, accent_color, description,
  --      stat_a_label, stat_a_value, stat_b_label, stat_b_value,
  --      stat_c_label, stat_c_value }, ...]
  days         JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of numbered updates: [{ text }, ...]
  notes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active, sort_order);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_read_all" ON events
  FOR SELECT USING (TRUE);

CREATE POLICY "events_admin_write" ON events
  FOR ALL
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.auth_user_id = auth.uid() AND c.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM creators c WHERE c.auth_user_id = auth.uid() AND c.role IN ('admin','superadmin')));

-- ── announcements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id    UUID REFERENCES seasons(id) ON DELETE SET NULL,
  event_id     UUID REFERENCES events(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  accent_color TEXT DEFAULT '#F59E0B',
  is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_read_all" ON announcements
  FOR SELECT USING (TRUE);

CREATE POLICY "announcements_admin_write" ON announcements
  FOR ALL
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.auth_user_id = auth.uid() AND c.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM creators c WHERE c.auth_user_id = auth.uid() AND c.role IN ('admin','superadmin')));

-- ── milestones (replace hardcoded client constant) ────────────────────────────
CREATE TABLE IF NOT EXISTS follower_milestones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold  INTEGER NOT NULL UNIQUE,
  points     INTEGER NOT NULL,
  label      TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE follower_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follower_milestones_read_all" ON follower_milestones
  FOR SELECT USING (TRUE);

CREATE POLICY "follower_milestones_admin_write" ON follower_milestones
  FOR ALL
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.auth_user_id = auth.uid() AND c.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM creators c WHERE c.auth_user_id = auth.uid() AND c.role IN ('admin','superadmin')));

-- Seed default milestones (same values the client currently hardcodes)
INSERT INTO follower_milestones (threshold, points, label, sort_order) VALUES
  (100,     100,  '100',  1),
  (1000,    25,   '1K',   2),
  (5000,    50,   '5K',   3),
  (10000,   75,   '10K',  4),
  (20000,   100,  '20K',  5),
  (50000,   150,  '50K',  6),
  (100000,  250,  '100K', 7),
  (250000,  500,  '250K', 8),
  (500000,  500,  '500K', 9),
  (1000000, 1000, '1M',   10)
ON CONFLICT (threshold) DO NOTHING;

-- ── seed the current Golf Creator Open event so production has data day 1 ─────
INSERT INTO events (name, start_date, end_date, venue, days, notes, is_active, sort_order)
SELECT
  'The Golf Creator Open',
  DATE '2026-10-02',
  DATE '2026-10-04',
  'Palm Beach National Golf Club',
  '[
    {
      "date": "2026-10-02",
      "day_label": "Friday · Oct 2",
      "title": "Creator Social",
      "subtitle": "PopStroke Rooftop · West Palm Beach",
      "accent_color": "#16A34A",
      "stat_a_label": "Time",  "stat_a_value": "7:00 PM",
      "stat_b_label": "Vibe",  "stat_b_value": "Social",
      "stat_c_label": "Dress", "stat_c_value": "Smart Casual",
      "description": "Drinks, networking, and content — kick off the weekend with fellow creators and sponsors."
    },
    {
      "date": "2026-10-03",
      "day_label": "Saturday · Oct 3",
      "title": "Creator Scramble",
      "subtitle": "Palm Beach National Golf Club",
      "accent_color": "#F59E0B",
      "stat_a_label": "Format",  "stat_a_value": "Best Ball",
      "stat_b_label": "Teams",   "stat_b_value": "4 Players",
      "stat_c_label": "Shotgun", "stat_c_value": "9:00 AM",
      "description": "Team scramble with content creation challenges throughout. Capture your best moments on the course."
    },
    {
      "date": "2026-10-04",
      "day_label": "Sunday · Oct 4",
      "title": "Championship Round",
      "subtitle": "Palm Beach National Golf Club",
      "accent_color": "#EF4444",
      "stat_a_label": "Format",   "stat_a_value": "Stroke Play",
      "stat_b_label": "Field",    "stat_b_value": "27 Creators",
      "stat_c_label": "Tee Time", "stat_c_value": "8:30 AM",
      "description": "Individual stroke play. Top finishers earn season points and the coveted Golf Creator Open title."
    }
  ]'::jsonb,
  '[
    {"text": "All participants must check in by 5:00 PM on Friday at PopStroke Rooftop."},
    {"text": "Saturday scramble teams will be announced Friday evening at the Creator Social."},
    {"text": "Sunday tee times will be based on Saturday scramble standings."},
    {"text": "Content from event weekend must be posted within 7 days for season point credit."}
  ]'::jsonb,
  TRUE,
  1
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'The Golf Creator Open');

-- Seed announcements
INSERT INTO announcements (title, body, accent_color, published_at)
SELECT * FROM (VALUES
  ('Registration Open',
   'Registration for The Golf Creator Open is now open. Qualify through the season leaderboard or receive a champion exemption.',
   '#F59E0B',
   TIMESTAMPTZ '2026-03-15 12:00:00+00'),
  ('Sponsor Spotlight: Topgolf',
   'Topgolf joins as the official presenting sponsor for the Creator Social on Friday evening.',
   '#10B981',
   TIMESTAMPTZ '2026-03-10 12:00:00+00'),
  ('Content Requirements Updated',
   'New content guidelines have been published for all event weekend activities. Check your challenge details for updates.',
   '#3B82F6',
   TIMESTAMPTZ '2026-03-05 12:00:00+00')
) AS seed(title, body, accent_color, published_at)
WHERE NOT EXISTS (SELECT 1 FROM announcements);
