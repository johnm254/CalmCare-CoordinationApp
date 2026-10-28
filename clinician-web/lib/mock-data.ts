export const MOCK_CLINICIAN = {
  id: "clin-001",
  full_name: "Dr. James Kamau",
  email: "j.kamau@knh.or.ke",
  specialization: "Neurology",
  verified: true,
  initials: "JK",
}

export type PatientStatus = "review" | "stable" | "followup"

export const MOCK_PATIENTS = [
  {
    id: "pat-001",
    full_name: "Elina Mwangi",
    initials: "EM",
    age: 28,
    status: "review" as PatientStatus,
    last_event: "2026-10-13T14:30:00Z",
    last_visit: "2026-09-15",
    open_followups: 2,
    conditions: ["Focal onset seizures"],
    events_this_week: 2,
    missed_doses_this_week: 1,
  },
  {
    id: "pat-002",
    full_name: "Samuel Odhiambo",
    initials: "SO",
    age: 34,
    status: "stable" as PatientStatus,
    last_event: "2026-09-28T10:00:00Z",
    last_visit: "2026-10-01",
    open_followups: 0,
    conditions: ["Generalized tonic-clonic seizures"],
    events_this_week: 0,
    missed_doses_this_week: 0,
  },
  {
    id: "pat-003",
    full_name: "Grace Njoroge",
    initials: "GN",
    age: 19,
    status: "followup" as PatientStatus,
    last_event: "2026-10-11T08:45:00Z",
    last_visit: "2026-09-20",
    open_followups: 1,
    conditions: ["Absence seizures"],
    events_this_week: 1,
    missed_doses_this_week: 3,
  },
  {
    id: "pat-004",
    full_name: "Peter Kimani",
    initials: "PK",
    age: 45,
    status: "stable" as PatientStatus,
    last_event: "2026-08-30T16:20:00Z",
    last_visit: "2026-10-05",
    open_followups: 0,
    conditions: ["Post-traumatic epilepsy"],
    events_this_week: 0,
    missed_doses_this_week: 0,
  },
]

export const MOCK_EVENTS: Record<string, Array<{
  id: string
  occurred_at: string
  event_type: string
  severity: "mild" | "moderate" | "severe"
  details: Record<string, string>
}>> = {
  "pat-001": [
    {
      id: "e1",
      occurred_at: "2026-10-13T14:30:00Z",
      event_type: "seizure",
      severity: "mild",
      details: { duration: "45 seconds", posture: "standing" },
    },
    {
      id: "e2",
      occurred_at: "2026-10-12T20:00:00Z",
      event_type: "missed_dose",
      severity: "moderate",
      details: {},
    },
    {
      id: "e3",
      occurred_at: "2026-10-10T09:15:00Z",
      event_type: "seizure",
      severity: "moderate",
      details: { duration: "2 minutes", triggered_by: "lack of sleep" },
    },
    {
      id: "e4",
      occurred_at: "2026-09-28T11:00:00Z",
      event_type: "seizure",
      severity: "mild",
      details: { duration: "30 seconds" },
    },
  ],
  "pat-003": [
    {
      id: "e5",
      occurred_at: "2026-10-11T08:45:00Z",
      event_type: "seizure",
      severity: "mild",
      details: { duration: "10 seconds" },
    },
  ],
}

export const MOCK_MEDICATIONS: Record<string, Array<{
  id: string
  name: string
  dose: string
  schedule: { time: string; days: string[] }
  adherence_rate: number
}>> = {
  "pat-001": [
    {
      id: "m1",
      name: "Levetiracetam",
      dose: "500 mg",
      schedule: {
        time: "20:00",
        days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      },
      adherence_rate: 86,
    },
    {
      id: "m2",
      name: "Sodium Valproate",
      dose: "200 mg",
      schedule: {
        time: "08:00",
        days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      },
      adherence_rate: 92,
    },
  ],
  "pat-003": [
    {
      id: "m3",
      name: "Ethosuximide",
      dose: "250 mg",
      schedule: {
        time: "07:00",
        days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      },
      adherence_rate: 58,
    },
  ],
}

export type FollowUpStatus = "open" | "in_progress" | "completed" | "cancelled"

export const MOCK_FOLLOWUPS = [
  {
    id: "fu-001",
    patient_id: "pat-001",
    patient_name: "Elina Mwangi",
    title: "Review seizure frequency — 2 in 1 week",
    due_at: "2026-10-16",
    status: "open" as FollowUpStatus,
  },
  {
    id: "fu-002",
    patient_id: "pat-001",
    patient_name: "Elina Mwangi",
    title: "Adjust Levetiracetam evening dose timing",
    due_at: "2026-10-18",
    status: "open" as FollowUpStatus,
  },
  {
    id: "fu-003",
    patient_id: "pat-003",
    patient_name: "Grace Njoroge",
    title: "Discuss missed doses (3 this week)",
    due_at: "2026-10-15",
    status: "open" as FollowUpStatus,
  },
  {
    id: "fu-004",
    patient_id: "pat-002",
    patient_name: "Samuel Odhiambo",
    title: "Routine 3-month check-in",
    due_at: "2026-10-30",
    status: "open" as FollowUpStatus,
  },
]

export const MOCK_AUDIT_LOG = [
  {
    id: "a1",
    actor_name: "Dr. James Kamau",
    patient_name: "Elina Mwangi",
    action: "Viewed event history",
    at: "2026-10-14T09:15:00Z",
    resource_type: "events",
  },
  {
    id: "a2",
    actor_name: "Dr. James Kamau",
    patient_name: "Elina Mwangi",
    action: "Viewed medication schedule",
    at: "2026-10-14T09:12:00Z",
    resource_type: "medications",
  },
  {
    id: "a3",
    actor_name: "Dr. James Kamau",
    patient_name: "Grace Njoroge",
    action: "Viewed patient brief",
    at: "2026-10-13T16:30:00Z",
    resource_type: "brief",
  },
  {
    id: "a4",
    actor_name: "Dr. James Kamau",
    patient_name: "Samuel Odhiambo",
    action: "Marked follow-up complete",
    at: "2026-10-13T11:00:00Z",
    resource_type: "followups",
  },
  {
    id: "a5",
    actor_name: "Dr. James Kamau",
    patient_name: "Elina Mwangi",
    action: "Created follow-up task",
    at: "2026-10-12T14:20:00Z",
    resource_type: "followups",
  },
]
