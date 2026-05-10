-- ─────────────────────────────────────────────────────────────────────────────
-- 030 · match-proof storage bucket + RLS policies
--      Stores match videos (video/*) and signed scorecard images
--      (scorecard/*) uploaded from the "Submit Match Score" flow.
--      Without this bucket, uploadMatchProof() fails with
--      "Upload failed. Please try again."
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('match-proof', 'match-proof', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket; admins review via public URL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'match-proof public read' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "match-proof public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'match-proof');
  END IF;
END $$;

-- Authenticated users can upload match proof files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'match-proof authenticated upload' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "match-proof authenticated upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'match-proof' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated users can replace (upsert) their uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'match-proof authenticated update' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "match-proof authenticated update"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'match-proof' AND auth.role() = 'authenticated');
  END IF;
END $$;
