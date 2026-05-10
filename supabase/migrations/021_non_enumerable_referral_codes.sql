-- ══════════════════════════════════════════════════════════════════════════════
-- 021 — Non-enumerable referral codes (audit items D5 / S6).
-- The app used to derive referral codes from the first 8 hex chars of the
-- creator's UUID, meaning anyone holding a referral code could recover the
-- corresponding auth UUID prefix. Switch to a random 10-char code from a
-- Crockford-ish alphabet (no 0/1/I/O) generated in the DB, with a BEFORE
-- INSERT trigger so new rows always get one automatically.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..10 LOOP
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION set_referral_code_if_null()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  attempts INT := 0;
BEGIN
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM creators WHERE referral_code = candidate);
    attempts := attempts + 1;
    IF attempts >= 5 THEN
      -- Exceptionally unlikely with 32^10 space, but belt-and-suspenders.
      candidate := candidate || encode(gen_random_bytes(3), 'hex');
      EXIT;
    END IF;
  END LOOP;
  NEW.referral_code := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_creators_set_referral_code ON creators;

CREATE TRIGGER trg_creators_set_referral_code
BEFORE INSERT ON creators
FOR EACH ROW
EXECUTE FUNCTION set_referral_code_if_null();

-- Backfill existing rows.
DO $$
DECLARE
  r RECORD;
  candidate TEXT;
  attempts INT;
BEGIN
  FOR r IN SELECT id FROM creators WHERE referral_code IS NULL LOOP
    attempts := 0;
    LOOP
      candidate := generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM creators WHERE referral_code = candidate);
      attempts := attempts + 1;
      IF attempts >= 5 THEN
        candidate := candidate || encode(gen_random_bytes(3), 'hex');
        EXIT;
      END IF;
    END LOOP;
    UPDATE creators SET referral_code = candidate WHERE id = r.id;
  END LOOP;
END $$;
