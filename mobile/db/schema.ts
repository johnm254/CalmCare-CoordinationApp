// Local SQLite schema for Duara offline-first storage.
// Mirrors the Supabase schema; dose_events replaces medication_logs (view alias kept).

export interface Profile {
  id: string
  role: "patient" | "caregiver" | "clinician" | "admin" | "org_admin"
  full_name: string
  email: string
  phone?: string
  language: string
  country: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Condition {
  id: string
  patient_id: string
  condition_template_id?: string
  type: string
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Medication {
  id: string
  patient_id: string
  name: string
  dose: string // legacy field
  strength?: string
  form?: string
  instructions?: string
  prescribed_by?: string
  stock_count?: number
  refill_threshold?: number
  schedule: {
    // legacy inline schedule kept for compat
    time: string
    days: string[]
  }
  version: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface MedicationSchedule {
  id: string
  medication_id: string
  times: string[] // ["08:00", "20:00"]
  days_of_week: number[] // 0=Sun … 6=Sat
  dose_amount?: string
  snooze_interval_min: number
  max_repeats: number
  missed_after_min: number
  escalate_to: "caregiver" | "clinician" | "both"
  version: number
  active: boolean
  created_at: string
  updated_at: string
}

// CR-MED-04: canonical "taken" log; unique on (schedule_id, scheduled_for)
export interface DoseEvent {
  id: string
  medication_id: string
  schedule_id?: string
  patient_id: string
  scheduled_for?: string
  status: "pending" | "taken" | "snoozed" | "missed" | "skipped"
  confirmed_at?: string
  confirmed_via?: "strap" | "app" | "caregiver"
  confirmed_by?: string
  synced_at?: string
  created_at: string
}

export interface Event {
  id: string
  patient_id: string
  logged_by: string
  occurred_at: string
  event_type: string
  details?: Record<string, unknown>
  severity?: "mild" | "moderate" | "severe"
  created_at: string
}

export interface Observation {
  id: string
  patient_id: string
  author_id: string
  occurred_at: string
  note: string
  created_at: string
}

export interface CareCircleMember {
  id: string
  patient_id: string
  member_id?: string
  phone?: string
  full_name: string
  display_name?: string
  relationship?: string
  is_emergency: boolean
  sms_only: boolean
  created_at: string
  updated_at: string
}

export interface Grant {
  id: string
  patient_id: string
  grantee_id: string
  category: string
  granted_at: string
  revoked_at?: string
  created_at: string
}

export interface ClinicianLink {
  id: string
  patient_id: string
  clinician_id: string
  invited_by?: string
  verified_at?: string
  ended_at?: string
  created_at: string
}

export interface FollowUp {
  id: string
  patient_id: string
  clinician_id: string
  title: string
  description?: string
  due_at: string
  completed_at?: string
  status: "open" | "in_progress" | "completed" | "cancelled"
  created_at: string
}

export interface SOSEvent {
  id: string
  patient_id: string
  sent_at: string
  channel: "push" | "sms" | "queued"
  location?: { latitude: number longitude: number }
  recipients: string[]
  status: "sent" | "failed" | "queued" | "retrying"
  created_at: string
}

export interface OutboxEntry {
  id: string
  table_name: string
  operation: "insert" | "update" | "delete"
  data: Record<string, unknown>
  synced: boolean
  error?: string
  created_at: string
  synced_at?: string
}

export interface SyncState {
  id: string
  device_id: string
  last_sync?: string
  sync_token?: string
  created_at: string
}

// SQLite DDL — runs at app startup; CREATE IF NOT EXISTS is idempotent.
export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'patient',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  country TEXT NOT NULL DEFAULT 'KE',
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  condition_template_id TEXT,
  type TEXT NOT NULL,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  strength TEXT,
  form TEXT,
  instructions TEXT,
  prescribed_by TEXT,
  stock_count INTEGER,
  refill_threshold INTEGER,
  schedule TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS medication_schedules (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL,
  times TEXT NOT NULL,
  days_of_week TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  dose_amount TEXT,
  snooze_interval_min INTEGER NOT NULL DEFAULT 15,
  max_repeats INTEGER NOT NULL DEFAULT 3,
  missed_after_min INTEGER NOT NULL DEFAULT 60,
  escalate_to TEXT NOT NULL DEFAULT 'caregiver',
  version INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);

CREATE TABLE IF NOT EXISTS dose_events (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL,
  schedule_id TEXT,
  patient_id TEXT NOT NULL,
  scheduled_for TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_at TEXT,
  confirmed_via TEXT,
  confirmed_by TEXT,
  synced_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (medication_id) REFERENCES medications(id),
  FOREIGN KEY (patient_id) REFERENCES profiles(id),
  UNIQUE (schedule_id, scheduled_for)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  logged_by TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  event_type TEXT NOT NULL,
  details TEXT,
  severity TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS care_circle (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  member_id TEXT,
  phone TEXT,
  full_name TEXT,
  display_name TEXT,
  relationship TEXT,
  is_emergency INTEGER NOT NULL DEFAULT 0,
  sms_only INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS grants (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  grantee_id TEXT NOT NULL,
  category TEXT NOT NULL,
  granted_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS clinician_links (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  clinician_id TEXT NOT NULL,
  invited_by TEXT,
  verified_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

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
  FOREIGN KEY (patient_id) REFERENCES profiles(id)
);

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

CREATE TABLE IF NOT EXISTS sos_queue (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  contacts TEXT NOT NULL,
  location_lat REAL,
  location_lon REAL,
  channel TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  data TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_state (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  last_sync TEXT,
  sync_token TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conditions_patient_id ON conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_med_schedules_medication_id ON medication_schedules(medication_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_patient_id ON dose_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_dose_events_medication_scheduled ON dose_events(medication_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_events_patient_id ON events(patient_id);
CREATE INDEX IF NOT EXISTS idx_observations_patient_id ON observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_circle_patient_id ON care_circle(patient_id);
CREATE INDEX IF NOT EXISTS idx_grants_patient_id ON grants(patient_id);
CREATE INDEX IF NOT EXISTS idx_grants_grantee_id ON grants(grantee_id);
CREATE INDEX IF NOT EXISTS idx_clinician_links_patient_id ON clinician_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_followups_patient_id ON followups(patient_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_patient_id ON sos_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_outbox_synced ON outbox(synced);
`
