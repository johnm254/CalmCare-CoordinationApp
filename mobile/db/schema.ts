/**
 * Local SQLite Database Schema
 * Offline-first storage for Project Epi
 */

export interface Profile {
  id: string;
  role: 'patient' | 'caregiver' | 'clinician';
  full_name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Condition {
  id: string;
  patient_id: string;
  type: string;
  notes?: string;
  triggered_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dose: string;
  schedule: {
    time: string; // "09:00"
    days: string[]; // ["MON", "TUE", ...]
  };
  version: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  patient_id: string;
  taken_at: string; // ISO timestamp (device time - true time)
  synced_at?: string;
  created_at: string;
}

export interface Event {
  id: string;
  patient_id: string;
  logged_by: string;
  occurred_at: string;
  event_type: string;
  details?: Record<string, any>;
  severity?: 'mild' | 'moderate' | 'severe';
  created_at: string;
}

export interface Observation {
  id: string;
  patient_id: string;
  author_id: string;
  occurred_at: string;
  note: string;
  created_at: string;
}

export interface CareCircleMember {
  id: string;
  patient_id: string;
  member_id?: string;
  phone: string;
  full_name: string;
  relationship: string;
  is_emergency: boolean;
  created_at: string;
  updated_at: string;
}

export interface Grant {
  id: string;
  patient_id: string;
  grantee_id: string;
  category: 'medications' | 'events' | 'observations' | 'records' | 'all';
  granted_at: string;
  revoked_at?: string;
  created_at: string;
}

export interface ClinicianLink {
  id: string;
  patient_id: string;
  clinician_id: string;
  verified_at?: string;
  verification_method?: string;
  verified_by?: string;
  created_at: string;
}

export interface FollowUp {
  id: string;
  patient_id: string;
  clinician_id: string;
  title: string;
  description?: string;
  due_at: string;
  completed_at?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

export interface SOSEvent {
  id: string;
  patient_id: string;
  sent_at: string;
  channel: 'push' | 'sms' | 'queued';
  location?: {
    latitude: number;
    longitude: number;
  };
  recipients: string[];
  status: 'sent' | 'failed' | 'queued' | 'retrying';
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  patient_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  at: string;
}

// Outbox table for offline-first sync
export interface OutboxEntry {
  id: string;
  table_name: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  synced: boolean;
  error?: string;
  created_at: string;
  synced_at?: string;
}

// Sync state tracking
export interface SyncState {
  id: string;
  device_id: string;
  last_sync?: string;
  sync_token?: string;
  created_at: string;
}

// SQL Schema
export const CREATE_TABLES_SQL = `
-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Conditions
CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  triggered_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

-- Medications
CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  schedule TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

-- Medication Logs
CREATE TABLE IF NOT EXISTS medication_logs (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  taken_at TEXT NOT NULL,
  synced_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (medication_id) REFERENCES medications(id),
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  logged_by TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  event_type TEXT NOT NULL,
  details TEXT,
  severity TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id),
  FOREIGN KEY (logged_by) REFERENCES profiles(id)
);

-- Observations
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id),
  FOREIGN KEY (author_id) REFERENCES profiles(id)
);

-- Care Circle
CREATE TABLE IF NOT EXISTS care_circle (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  member_id TEXT,
  phone TEXT,
  full_name TEXT,
  relationship TEXT,
  is_emergency BOOLEAN DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

-- Grants
CREATE TABLE IF NOT EXISTS grants (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  grantee_id TEXT NOT NULL,
  category TEXT NOT NULL,
  granted_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id),
  FOREIGN KEY (grantee_id) REFERENCES profiles(id)
);

-- Clinician Links
CREATE TABLE IF NOT EXISTS clinician_links (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  clinician_id TEXT NOT NULL,
  verified_at TEXT,
  verification_method TEXT,
  verified_by TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id),
  FOREIGN KEY (clinician_id) REFERENCES profiles(id)
);

-- Follow-ups
CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  clinician_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id),
  FOREIGN KEY (clinician_id) REFERENCES profiles(id)
);

-- SOS Events
CREATE TABLE IF NOT EXISTS sos_events (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  channel TEXT NOT NULL,
  location TEXT,
  recipients TEXT,
  status TEXT DEFAULT 'sent',
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata TEXT,
  at TEXT NOT NULL,
  FOREIGN KEY (actor_id) REFERENCES profiles(id),
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

-- Outbox for offline sync
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  data TEXT NOT NULL,
  synced BOOLEAN DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT
);

-- Sync state
CREATE TABLE IF NOT EXISTS sync_state (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  last_sync TEXT,
  sync_token TEXT,
  created_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conditions_patient_id ON conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient_id ON medication_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_at ON medication_logs(taken_at);
CREATE INDEX IF NOT EXISTS idx_events_patient_id ON events(patient_id);
CREATE INDEX IF NOT EXISTS idx_events_logged_by ON events(logged_by);
CREATE INDEX IF NOT EXISTS idx_observations_patient_id ON observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_circle_patient_id ON care_circle(patient_id);
CREATE INDEX IF NOT EXISTS idx_grants_patient_id ON grants(patient_id);
CREATE INDEX IF NOT EXISTS idx_grants_grantee_id ON grants(grantee_id);
CREATE INDEX IF NOT EXISTS idx_clinician_links_patient_id ON clinician_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_followups_patient_id ON followups(patient_id);
CREATE INDEX IF NOT EXISTS idx_followups_due_at ON followups(due_at);
CREATE INDEX IF NOT EXISTS idx_sos_events_patient_id ON sos_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_patient_id ON audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_outbox_synced ON outbox(synced);
`;
