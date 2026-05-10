-- Allow creators to create their own social connection rows during onboarding.
-- Existing policy only covered updates, so first-time social connects could not
-- be saved through the authenticated client.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'social_connections'
      AND policyname = 'social_connections_insert_own'
  ) THEN
    CREATE POLICY "social_connections_insert_own" ON social_connections
      FOR INSERT
      WITH CHECK (
        creator_id = (
          SELECT id
          FROM creators
          WHERE auth_user_id = auth.uid()
          LIMIT 1
        )
      );
  END IF;
END $$;
