-- Atomic member-number generation via a Postgres sequence.
-- Replaces the SELECT-max approach in approve-application and create-user,
-- which could mint duplicate member numbers under concurrent requests.

-- Seed the sequence from the highest existing number so we never go backwards.
DO $$
DECLARE
  max_seq INT;
BEGIN
  SELECT COALESCE(
    MAX(
      CASE
        WHEN member_number ~ '^GCT-\d{4}-\d+$'
        THEN split_part(member_number, '-', 3)::INT
        ELSE 0
      END
    ), 0
  )
  INTO max_seq
  FROM creators;

  -- (Re)create the sequence starting just after the current max.
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS creator_member_seq START %s', max_seq + 1);
  -- If the sequence already exists, advance it to at least max_seq + 1.
  PERFORM setval('creator_member_seq', GREATEST(nextval('creator_member_seq') - 1, max_seq) + 1, false);
END $$;

-- RPC: returns the next member number as a formatted string, e.g. 'GCT-2026-0042'.
-- Callable from server-side code via service role.
CREATE OR REPLACE FUNCTION next_member_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val BIGINT;
  year_str TEXT;
BEGIN
  seq_val  := nextval('creator_member_seq');
  year_str := extract(year FROM now())::TEXT;
  RETURN 'GCT-' || year_str || '-' || lpad(seq_val::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION next_member_number() TO service_role;
