-- ═══════════════════════════════════════════
-- GCT V4 Migration: Fix functions + add missing triggers
-- Matches ACTUAL database schema (UUID IDs, real column names)
-- Already applied to production on 2026-03-28
-- ═══════════════════════════════════════════

-- ── 1. Fix increment_enrolled() — was using wrong column name and wrong ID type ──
DROP FUNCTION IF EXISTS increment_enrolled(bigint);
CREATE OR REPLACE FUNCTION increment_enrolled(cid uuid)
RETURNS void AS $$
BEGIN
  UPDATE challenges
  SET filled_slots = filled_slots + 1,
      updated_at = NOW()
  WHERE id = cid AND (max_slots IS NULL OR filled_slots < max_slots);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. handle_new_user() — auto-create creator profile on signup ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_member_number text;
  active_season_id uuid;
  new_creator_id uuid;
  next_rank int;
BEGIN
  new_member_number := 'GCT-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(
    (SELECT COALESCE(COUNT(*), 0) + 1 FROM creators)::text,
    4, '0'
  );

  SELECT id INTO active_season_id FROM seasons WHERE status = 'active' LIMIT 1;

  INSERT INTO creators (auth_user_id, name, handle, email, country, member_number, tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    LOWER(REPLACE(split_part(NEW.email, '@', 1), '.', '_')),
    NEW.email,
    'US',
    new_member_number,
    'standard'
  )
  RETURNING id INTO new_creator_id;

  IF active_season_id IS NOT NULL THEN
    SELECT COALESCE(MAX(rank), 0) + 1 INTO next_rank
    FROM creator_season_stats WHERE season_id = active_season_id;

    INSERT INTO creator_season_stats (creator_id, season_id, total_points, rank)
    VALUES (new_creator_id, active_season_id, 100, next_rank);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- ── 3. auto_complete_match() — auto-determine winner when both scores are in ──
CREATE OR REPLACE FUNCTION auto_complete_match()
RETURNS trigger AS $$
BEGIN
  IF NEW.challenger_score IS NOT NULL
    AND NEW.opponent_score IS NOT NULL
    AND NEW.status = 'accepted'
  THEN
    NEW.status := 'completed';
    NEW.completed_at := NOW();

    IF NEW.challenger_score < NEW.opponent_score THEN
      NEW.winner_id := NEW.challenger_id;
    ELSIF NEW.opponent_score < NEW.challenger_score THEN
      NEW.winner_id := NEW.opponent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_match_score_update'
  ) THEN
    CREATE TRIGGER on_match_score_update
      BEFORE UPDATE ON matches
      FOR EACH ROW
      EXECUTE FUNCTION auto_complete_match();
  END IF;
END $$;

-- ── 4. Add creator_achievements to Realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE creator_achievements;

-- ── 5. Create avatars storage bucket ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public avatar access' AND tablename = 'objects') THEN
    CREATE POLICY "Public avatar access"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated avatar upload' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated avatar upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar owner update' AND tablename = 'objects') THEN
    CREATE POLICY "Avatar owner update"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END $$;
