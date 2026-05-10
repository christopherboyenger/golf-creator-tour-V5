-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 045_creator_sponsors_category_logo.sql
-- Purpose: Extend creator_sponsors with category/niche classification and a
--          logo URL so the redesigned sponsor library can render branded cards
--          and support category filtering.
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE creator_sponsors
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE INDEX IF NOT EXISTS idx_creator_sponsors_category
  ON creator_sponsors(creator_id, category);
