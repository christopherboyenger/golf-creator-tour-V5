-- Create the match-proof storage bucket for scorecard images and match video uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'match-proof',
  'match-proof',
  true,
  104857600, -- 100MB limit (covers videos)
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload match proof files
CREATE POLICY "Authenticated match proof upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'match-proof');

-- Allow public read access to match proof files
CREATE POLICY "Public match proof access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'match-proof');
