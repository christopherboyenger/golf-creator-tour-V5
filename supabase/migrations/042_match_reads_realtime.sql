-- Add match_reads to the supabase_realtime publication so the sender's chat
-- receives a postgres_changes event the moment the recipient marks the
-- conversation read. Without this, the "Seen" indicator never lights up for
-- the sender after the recipient opens the chat.

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS match_reads;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE match_reads;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Ensure UPDATE payloads carry the full OLD row so the client-side filter
-- (user_id !== me) works even when only last_read_at changes.
ALTER TABLE match_reads REPLICA IDENTITY FULL;
