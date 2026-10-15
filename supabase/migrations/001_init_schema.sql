-- Project Epi: Database Schema with RLS Policies
-- Phase 1: Foundation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles: Users and their roles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'caregiver', 'clinician')),
  full_name TEXT,
  email TEXT UNIQUE,
  guardian_of UUID REFERENCES profiles(id),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conditions: Patient conditions and triggers
CREATE TABLE conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  notes TEXT,
  triggered_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Medications: Patient medication plan (versioned)
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  schedule JSONB NOT NULL, -- { "time": "09:00", "days": ["MON", "TUE", ...] }
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Medication Logs: "Taken" check-ins (append-only)
CREATE TABLE medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  taken_at TIMESTAMP NOT NULL, -- Device time (true time)
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events: Logged by patient or caregiver (append-only)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  occurred_at TIMESTAMP NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Observations: Caregiver notes (append-only)
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  occurred_at TIMESTAMP NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Care Circle: Trusted contacts
CREATE TABLE care_circle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT,
  full_name TEXT,
  relationship TEXT,
  is_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Grants: Consent matrix (what each person may see)
CREATE TABLE grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grantee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('medications', 'events', 'observations', 'records', 'all')),
  granted_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clinician Links: Patient-clinician relationship
CREATE TABLE clinician_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verified_at TIMESTAMP,
  verification_method TEXT, -- 'license', 'institution', 'manual'
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Follow-ups: Clinical follow-up tasks
CREATE TABLE followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SOS Events: SOS history (append-only)
CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sent_at TIMESTAMP NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'sms', 'queued')),
  location JSONB, -- { "latitude": 0.0, "longitude": 0.0 }
  recipients TEXT[], -- Emergency contact IDs
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued', 'retrying')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log: Access audit (insert-only)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  at TIMESTAMP DEFAULT NOW()
);

-- Sync State: Track client sync progress
CREATE TABLE sync_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  last_sync TIMESTAMP,
  sync_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_conditions_patient_id ON conditions(patient_id);
CREATE INDEX idx_medications_patient_id ON medications(patient_id);
CREATE INDEX idx_medication_logs_patient_id ON medication_logs(patient_id);
CREATE INDEX idx_medication_logs_taken_at ON medication_logs(taken_at);
CREATE INDEX idx_events_patient_id ON events(patient_id);
CREATE INDEX idx_events_logged_by ON events(logged_by);
CREATE INDEX idx_observations_patient_id ON observations(patient_id);
CREATE INDEX idx_care_circle_patient_id ON care_circle(patient_id);
CREATE INDEX idx_grants_patient_id ON grants(patient_id);
CREATE INDEX idx_grants_grantee_id ON grants(grantee_id);
CREATE INDEX idx_grants_revoked_at ON grants(revoked_at);
CREATE INDEX idx_clinician_links_patient_id ON clinician_links(patient_id);
CREATE INDEX idx_clinician_links_clinician_id ON clinician_links(clinician_id);
CREATE INDEX idx_clinician_links_verified_at ON clinician_links(verified_at);
CREATE INDEX idx_followups_patient_id ON followups(patient_id);
CREATE INDEX idx_followups_clinician_id ON followups(clinician_id);
CREATE INDEX idx_followups_due_at ON followups(due_at);
CREATE INDEX idx_sos_events_patient_id ON sos_events(patient_id);
CREATE INDEX idx_audit_log_patient_id ON audit_log(patient_id);
CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_circle ENABLE ROW LEVEL SECURITY;
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinician_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read themselves and see caregivers/clinicians linked to them
CREATE POLICY "profiles_self_access" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_linked_access" ON profiles
  FOR SELECT USING (
    -- Patient can see their care circle and clinicians
    EXISTS (
      SELECT 1 FROM care_circle
      WHERE patient_id = auth.uid() AND member_id = profiles.id
    ) OR
    -- Caregiver can see the patient
    EXISTS (
      SELECT 1 FROM care_circle
      WHERE patient_id = profiles.id AND member_id = auth.uid()
    ) OR
    -- Clinician can see patient through link
    EXISTS (
      SELECT 1 FROM clinician_links
      WHERE clinician_id = auth.uid() AND patient_id = profiles.id
    )
  );

-- Conditions: Patients access their own; caregivers/clinicians via grants
CREATE POLICY "conditions_patient_access" ON conditions
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "conditions_grant_access" ON conditions
  FOR SELECT USING (
    -- Active grant for this category
    EXISTS (
      SELECT 1 FROM grants
      WHERE patient_id = conditions.patient_id
        AND grantee_id = auth.uid()
        AND (category = 'all' OR category = 'medications')
        AND revoked_at IS NULL
    ) OR
    -- Clinician with verified link and grant
    (EXISTS (
      SELECT 1 FROM clinician_links
      WHERE patient_id = conditions.patient_id
        AND clinician_id = auth.uid()
        AND verified_at IS NOT NULL
    ) AND EXISTS (
      SELECT 1 FROM grants
      WHERE patient_id = conditions.patient_id
        AND grantee_id = auth.uid()
        AND revoked_at IS NULL
    ))
  );

-- Medications: Same pattern
CREATE POLICY "medications_patient_access" ON medications
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "medications_grant_access" ON medications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM grants
      WHERE patient_id = medications.patient_id
        AND grantee_id = auth.uid()
        AND (category = 'all' OR category = 'medications')
        AND revoked_at IS NULL
    )
  );

-- Medication Logs: Same as medications
CREATE POLICY "medication_logs_patient_access" ON medication_logs
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "medication_logs_grant_access" ON medication_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM grants
      WHERE patient_id = medication_logs.patient_id
        AND grantee_id = auth.uid()
        AND (category = 'all' OR category = 'medications')
        AND revoked_at IS NULL
    )
  );

-- Events: Same pattern
CREATE POLICY "events_patient_access" ON events
  FOR ALL USING (patient_id = auth.uid() OR logged_by = auth.uid());

CREATE POLICY "events_grant_access" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM grants
      WHERE patient_id = events.patient_id
        AND grantee_id = auth.uid()
        AND (category = 'all' OR category = 'events')
        AND revoked_at IS NULL
    )
  );

-- Observations: Caregivers can write; patient/clinicians can read via grant
CREATE POLICY "observations_patient_access" ON observations
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "observations_caregiver_write" ON observations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM grants
      WHERE patient_id = observations.patient_id
        AND grantee_id = auth.uid()
        AND (category = 'all' OR category = 'observations')
        AND revoked_at IS NULL
    ) AND author_id = auth.uid()
  );

CREATE POLICY "observations_grant_access" ON observations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM grants
      WHERE patient_id = observations.patient_id
        AND grantee_id = auth.uid()
        AND (category = 'all' OR category = 'observations')
        AND revoked_at IS NULL
    )
  );

-- Care Circle: Patient manages; members can read their own entry
CREATE POLICY "care_circle_patient_access" ON care_circle
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "care_circle_member_read" ON care_circle
  FOR SELECT USING (member_id = auth.uid());

-- Grants: Only patient creates/revokes
CREATE POLICY "grants_patient_create" ON grants
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "grants_patient_revoke" ON grants
  FOR UPDATE USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "grants_patient_read" ON grants
  FOR SELECT USING (patient_id = auth.uid() OR grantee_id = auth.uid());

-- Clinician Links: Verified clinicians can read their links
CREATE POLICY "clinician_links_patient_access" ON clinician_links
  FOR ALL USING (patient_id = auth.uid());

CREATE POLICY "clinician_links_clinician_read" ON clinician_links
  FOR SELECT USING (clinician_id = auth.uid() AND verified_at IS NOT NULL);

-- Follow-ups: Clinician creates; patient can read
CREATE POLICY "followups_patient_access" ON followups
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "followups_clinician_manage" ON followups
  FOR ALL USING (clinician_id = auth.uid());

-- SOS Events: Patient creates; emergency contacts can see (via realtime)
CREATE POLICY "sos_patient_access" ON sos_events
  FOR ALL USING (patient_id = auth.uid());

-- Audit Log: Append-only; patient can read their own
CREATE POLICY "audit_log_append" ON audit_log
  FOR INSERT WITH CHECK (actor_id = auth.uid());

CREATE POLICY "audit_log_patient_read" ON audit_log
  FOR SELECT USING (patient_id = auth.uid());

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-insert profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'role', 'patient'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conditions_updated_at
  BEFORE UPDATE ON conditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_circle_updated_at
  BEFORE UPDATE ON care_circle
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log access for clinicians and caregivers
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS trigger AS $$
BEGIN
  -- Only log if user is not the patient
  IF NEW.patient_id != auth.uid() THEN
    INSERT INTO audit_log (actor_id, patient_id, action, resource_type, resource_id)
    VALUES (auth.uid(), NEW.patient_id, 'viewed', TG_TABLE_NAME, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging (optional - can be more selective)
-- CREATE TRIGGER audit_log_events AFTER SELECT ON events FOR EACH ROW EXECUTE FUNCTION log_data_access();

-- ============================================================================
-- INITIAL TEST DATA (for development only - remove before production)
-- ============================================================================

-- Helper function to get or create test users
-- These should be created via Auth; this is just reference
-- In production, use Supabase Auth UI or API
