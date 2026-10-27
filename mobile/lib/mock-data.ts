export const MOCK_USER = {
  id: "user-001",
  full_name: "Elina Mwangi",
  role: "patient" as const,
  email: "elina@example.com",
  initials: "E",
}

export const MOCK_MEDICATIONS = [
  {
    id: "med-001",
    name: "Levetiracetam",
    dose: "500 mg",
    schedule: {
      time: "20:00",
      days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    },
    active: true,
  },
  {
    id: "med-002",
    name: "Sodium Valproate",
    dose: "200 mg",
    schedule: {
      time: "08:00",
      days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    },
    active: true,
  },
]

export const MOCK_EVENTS = [
  {
    id: "evt-001",
    event_type: "seizure",
    severity: "mild" as const,
    occurred_at: "2026-10-13T14:30:00Z",
    details: { duration: "45 seconds", posture: "standing" },
  },
  {
    id: "evt-002",
    event_type: "missed_dose",
    severity: "moderate" as const,
    occurred_at: "2026-10-12T20:00:00Z",
    details: {},
  },
  {
    id: "evt-003",
    event_type: "seizure",
    severity: "moderate" as const,
    occurred_at: "2026-10-10T09:15:00Z",
    details: { duration: "2 minutes", triggered_by: "lack of sleep" },
  },
]

export const MOCK_CARE_CIRCLE = [
  {
    id: "cc-001",
    full_name: "Anne Wanjiku",
    relationship: "Caregiver",
    is_emergency: true,
    phone: "+254700000001",
    grants: {
      emergency_alerts: true,
      medication_schedule: true,
      appointments: true,
      event_summaries: true,
      records: false,
    },
  },
  {
    id: "cc-002",
    full_name: "Brian Otieno",
    relationship: "Family",
    is_emergency: true,
    phone: "+254700000002",
    grants: {
      emergency_alerts: true,
      medication_schedule: false,
      appointments: false,
      event_summaries: false,
      records: false,
    },
  },
  {
    id: "cc-003",
    full_name: "Dr. Kamau",
    relationship: "Clinician",
    is_emergency: false,
    phone: "+254700000003",
    grants: {
      emergency_alerts: false,
      medication_schedule: true,
      appointments: true,
      event_summaries: true,
      records: true,
    },
  },
]

export const MOCK_CONDITIONS = [
  {
    id: "cond-001",
    type: "Focal onset seizures",
    notes: "Temporal lobe epilepsy",
    triggered_by: "Sleep deprivation, stress, flashing lights",
  },
]

export const MOCK_INSIGHTS = {
  this_week_events: 2,
  missed_doses: 1,
  pattern: "Both events came after a late or missed evening dose.",
  suggestion: "Set an earlier reminder",
}

export const MOCK_DOCUMENTS = [
  { id: "doc-001", title: "Visit brief", date: "Oct 12, 2026", type: "brief" },
  { id: "doc-002", title: "Lab results", date: "Sep 2026", type: "lab" },
]
