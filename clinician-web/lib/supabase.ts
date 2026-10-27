import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Get current user
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Get user profile with verification
export async function getClinicianProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  // Verify clinician status
  if (data.role !== "clinician") {
    throw new Error("User is not a verified clinician")
  }

  return data
}

// Get clinician's patients
export async function getClinicianPatients(clinicianId: string) {
  const { data, error } = await supabase
    .from("clinician_links")
    .select(
      `
      id,
      patient_id,
      verified_at,
      profiles:patient_id (
        id,
        full_name,
        email
      )
    `,
    )
    .eq("clinician_id", clinicianId)
    .not("verified_at", "is", null)

  if (error) {
    console.error("Error fetching patients:", error)
    return []
  }

  return data || []
}

// Get patient summary for pre-visit brief
export async function getPatientBrief(patientId: string, clinicianId: string) {
  // Verify clinician has access
  const { data: link, error: linkError } = await supabase
    .from("clinician_links")
    .select("*")
    .eq("patient_id", patientId)
    .eq("clinician_id", clinicianId)
    .not("verified_at", "is", null)
    .single()

  if (linkError || !link) {
    throw new Error("Unauthorized")
  }

  // Get patient profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", patientId)
    .single()

  // Get recent events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("patient_id", patientId)
    .order("occurred_at", { ascending: false })
    .limit(10)

  // Get medication compliance
  const { data: medLogs } = await supabase
    .from("medication_logs")
    .select("taken_at")
    .eq("patient_id", patientId)
    .gte(
      "taken_at",
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    )

  // Get open follow-ups
  const { data: followups } = await supabase
    .from("followups")
    .select("*")
    .eq("patient_id", patientId)
    .eq("status", "open")

  return {
    profile,
    recentEvents: events || [],
    medicationLogs: medLogs || [],
    openFollowups: followups || [],
  }
}

// Get health trends (last 90 days)
export async function getHealthTrends(patientId: string, clinicianId: string) {
  // Verify access
  const { data: link } = await supabase
    .from("clinician_links")
    .select("*")
    .eq("patient_id", patientId)
    .eq("clinician_id", clinicianId)
    .not("verified_at", "is", null)
    .single()

  if (!link) {
    throw new Error("Unauthorized")
  }

  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString()

  // Get events grouped by day
  const { data: events } = await supabase
    .from("events")
    .select("occurred_at, severity")
    .eq("patient_id", patientId)
    .gte("occurred_at", ninetyDaysAgo)
    .order("occurred_at", { ascending: true })

  // Aggregate by date
  const trends: Record<string, number> = {}
  events?.forEach((event) => {
    const date = event.occurred_at.split("T")[0]
    trends[date] = (trends[date] || 0) + 1
  })

  return trends
}

// Log clinician access
export async function logAccess(
  clinicianId: string,
  patientId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
) {
  const { error } = await supabase.from("audit_log").insert([
    {
      actor_id: clinicianId,
      patient_id: patientId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      at: new Date().toISOString(),
    },
  ])

  if (error) {
    console.error("Error logging access:", error)
  }
}

// Get audit log for patient
export async function getAuditLog(patientId: string) {
  const { data, error } = await supabase
    .from("audit_log")
    .select(
      `
      *,
      profiles:actor_id (
        id,
        full_name,
        role
      )
    `,
    )
    .eq("patient_id", patientId)
    .order("at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching audit log:", error)
    return []
  }

  return data || []
}

// Get follow-ups for clinician
export async function getClinicianFollowups(clinicianId: string) {
  const { data, error } = await supabase
    .from("followups")
    .select(
      `
      *,
      profiles:patient_id (
        id,
        full_name
      )
    `,
    )
    .eq("clinician_id", clinicianId)
    .neq("status", "completed")
    .order("due_at", { ascending: true })

  if (error) {
    console.error("Error fetching follow-ups:", error)
    return []
  }

  return data || []
}

// Update follow-up
export async function updateFollowup(
  followupId: string,
  updates: Record<string, any>,
) {
  const { data, error } = await supabase
    .from("followups")
    .update(updates)
    .eq("id", followupId)
    .select()

  if (error) {
    console.error("Error updating follow-up:", error)
    throw error
  }

  return data?.[0]
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error("Error signing out:", error)
    throw error
  }
}
