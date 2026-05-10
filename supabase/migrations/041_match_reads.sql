-- Per-(match, user) read state used to drive the "Seen" indicator in chats.
-- A row exists for a participant the first time they open the conversation
-- after a new message arrives, and last_read_at is bumped each subsequent open.

CREATE TABLE IF NOT EXISTS match_reads (
  match_id     UUID NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS match_reads_match_idx ON match_reads (match_id);

ALTER TABLE match_reads ENABLE ROW LEVEL SECURITY;

-- Either participant of the match can read both rows (so the sender can see
-- whether the recipient has read their message).
DROP POLICY IF EXISTS "match_reads_select_participants" ON match_reads;
CREATE POLICY "match_reads_select_participants" ON match_reads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM matches m
      JOIN creators c1 ON c1.id = m.challenger_id
      JOIN creators c2 ON c2.id = m.opponent_id
      WHERE m.id = match_reads.match_id
        AND (c1.auth_user_id = auth.uid() OR c2.auth_user_id = auth.uid())
    )
  );

-- A user may only insert/update their OWN read row, and only for a match
-- they're a participant of.
DROP POLICY IF EXISTS "match_reads_insert_self" ON match_reads;
CREATE POLICY "match_reads_insert_self" ON match_reads
  FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM creators WHERE auth_user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_reads.match_id
        AND (m.challenger_id = match_reads.user_id OR m.opponent_id = match_reads.user_id)
    )
  );

DROP POLICY IF EXISTS "match_reads_update_self" ON match_reads;
CREATE POLICY "match_reads_update_self" ON match_reads
  FOR UPDATE
  USING (user_id IN (SELECT id FROM creators WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM creators WHERE auth_user_id = auth.uid()));
