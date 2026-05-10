-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: 012_match_delete_policy.sql
-- Purpose: Allow match participants (and admins) to DELETE their own matches,
--          and the associated match_messages rows.
--
--          Prior migrations (006_complete_schema.sql) defined SELECT / INSERT /
--          UPDATE policies on `matches` but no DELETE policy, so the
--          "Delete Match" action from the chat sheet silently failed with an
--          RLS rejection. This migration closes that gap.
-- ════════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- matches: DELETE policies
-- ──────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "matches_delete_participants" ON matches;
CREATE POLICY "matches_delete_participants" ON matches
  FOR DELETE
  USING (
    challenger_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1) OR
    opponent_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "matches_delete_admins" ON matches;
CREATE POLICY "matches_delete_admins" ON matches
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM creators c
      WHERE c.auth_user_id = auth.uid()
      AND c.role IN ('admin', 'superadmin')
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- match_messages: DELETE policies
--
-- The table is created out-of-band (not in a migration in this repo), so guard
-- everything with IF EXISTS checks and only apply if the table is present.
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'match_messages'
  ) THEN
    EXECUTE 'ALTER TABLE match_messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "match_messages_delete_participants" ON match_messages';
    EXECUTE $p$
      CREATE POLICY "match_messages_delete_participants" ON match_messages
        FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = match_messages.match_id
            AND (
              m.challenger_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1) OR
              m.opponent_id  = (SELECT id FROM creators WHERE auth_user_id = auth.uid() LIMIT 1)
            )
          )
        )
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS "match_messages_delete_admins" ON match_messages';
    EXECUTE $p$
      CREATE POLICY "match_messages_delete_admins" ON match_messages
        FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM creators c
            WHERE c.auth_user_id = auth.uid()
            AND c.role IN ('admin', 'superadmin')
          )
        )
    $p$;
  END IF;
END
$$;
