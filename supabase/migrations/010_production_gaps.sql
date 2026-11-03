-- 010_production_gaps.sql
-- Production-readiness fixes: stock decrement, grant notifications,
-- nearest ER lookup, audit-log hardening, and clinician lockout.

-- ─── CR-MED-03: Medication stock decrement on dose_events INSERT ─────────────

CREATE OR REPLACE FUNCTION fn_decrement_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE medication_schedules
  SET    stock_count = GREATEST(0, stock_count - 1),
         updated_at  = NOW()
  WHERE  id = NEW.schedule_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON dose_events;
CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON dose_events
  FOR EACH ROW EXECUTE FUNCTION fn_decrement_stock();


-- ─── CR-SEC-02: Notify on grant revoke so downstream can clear cache ─────────

CREATE OR REPLACE FUNCTION fn_grant_revoke_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only act when a grant transitions from active to revoked
  IF OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, payload, created_at)
    VALUES (
      NEW.patient_id,
      'cache_clear',
      jsonb_build_object('grant_id', NEW.id, 'grantee_id', NEW.grantee_id),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_revoke_notify ON grants;
CREATE TRIGGER trg_grant_revoke_notify
  AFTER UPDATE ON grants
  FOR EACH ROW EXECUTE FUNCTION fn_grant_revoke_notify();


-- nearest_er_facility() moved to 011 — health_facilities is created there.

-- ─── CR-SEC-04: Append-only enforcement on audit_log ────────────────────────

CREATE OR REPLACE FUNCTION fn_audit_log_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log rows are immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON audit_log;
CREATE TRIGGER trg_audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log_immutable();

DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON audit_log;
CREATE TRIGGER trg_audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log_immutable();


-- ─── CR-SEC-05: is_verified_clinician() respects locked_until ───────────────

CREATE OR REPLACE FUNCTION is_verified_clinician(uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   clinician_verifications
    WHERE  clinician_id = uid
      AND  verified_at IS NOT NULL
      AND  (locked_until IS NULL OR locked_until < NOW())
  );
$$;


-- ─── Seed tables referenced by new UI panels ─────────────────────────────────

CREATE TABLE IF NOT EXISTS crisis_resources (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country    CHAR(2)  NOT NULL,
  name       TEXT     NOT NULL,
  phone      TEXT     NOT NULL,
  language   TEXT     NOT NULL DEFAULT 'en',
  active     BOOLEAN  NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crisis_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage crisis_resources" ON crisis_resources;
CREATE POLICY "admins manage crisis_resources"
  ON crisis_resources FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "authenticated read crisis_resources" ON crisis_resources;
CREATE POLICY "authenticated read crisis_resources"
  ON crisis_resources FOR SELECT
  USING (auth.role() = 'authenticated' AND active = TRUE);


CREATE TABLE IF NOT EXISTS dpa_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type   TEXT NOT NULL CHECK (request_type IN ('export','delete','rectify','restrict')),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reject_reason  TEXT,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dpa_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage dpa_requests" ON dpa_requests;
CREATE POLICY "admins manage dpa_requests"
  ON dpa_requests FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "patients read own dpa_requests" ON dpa_requests;
CREATE POLICY "patients read own dpa_requests"
  ON dpa_requests FOR SELECT
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "patients insert dpa_requests" ON dpa_requests;
CREATE POLICY "patients insert dpa_requests"
  ON dpa_requests FOR INSERT
  WITH CHECK (patient_id = auth.uid());
