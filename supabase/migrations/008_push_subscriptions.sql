-- ──────────────────────────────────────────────────────────────────────────────
-- 008 — Web Push Subscriptions
-- Stores browser push subscriptions and fires the send-push edge function
-- whenever a notification is inserted (via pg_net, pre-installed on Supabase).
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_creator ON push_subscriptions(creator_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subs_own_all" ON push_subscriptions
  FOR ALL USING (
    creator_id = (SELECT id FROM creators WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "push_subs_service_read" ON push_subscriptions
  FOR SELECT USING (auth.role() = 'service_role');

-- Trigger: after every notification INSERT, call the edge function via pg_net.
--
-- URL and service-role bearer token are read from Postgres runtime settings
-- so rotating the key doesn't require a migration. Set them once via:
--
--   ALTER DATABASE postgres SET app.supabase_functions_url   = 'https://<ref>.supabase.co/functions/v1';
--   ALTER DATABASE postgres SET app.supabase_service_role_key = '<service_role_jwt>';
--
-- If either setting is missing the trigger is a no-op — the notification row
-- is still inserted, but no push is sent (the app will still show it in-UI).
CREATE OR REPLACE FUNCTION call_send_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_base_url TEXT;
  v_service_key TEXT;
BEGIN
  v_base_url    := current_setting('app.supabase_functions_url', true);
  v_service_key := current_setting('app.supabase_service_role_key', true);

  IF v_base_url IS NULL OR length(v_base_url) = 0
     OR v_service_key IS NULL OR length(v_service_key) = 0
  THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := v_base_url || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body    := to_jsonb(NEW)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_send_push_notification ON notifications;
CREATE TRIGGER trg_send_push_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION call_send_push_notification();
