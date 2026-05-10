-- ─────────────────────────────────────────────────────────────────────────────
-- 026 · chat-media storage bucket + RLS policies
--      Stores image attachments sent in match chats.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket, images served via public URL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'chat-media public read' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "chat-media public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'chat-media');
  END IF;
END $$;

-- Authenticated users can upload images to chat-media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'chat-media authenticated upload' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "chat-media authenticated upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated users can replace their own uploads (upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'chat-media authenticated update' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "chat-media authenticated update"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'chat-media' AND auth.role() = 'authenticated');
  END IF;
END $$;
