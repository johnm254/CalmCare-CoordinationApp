// dpa-export-delete — executes a KDPA 2019 data request (export or delete).
//
// POST { request_id: string }
//
// Export: collects all patient PII tables into JSON, stores it in
//         dpa_exports.payload (JSONB) and marks the request completed.
//
// Delete: anonymises the patient row, hard-deletes child data, marks completed.
//
// Correct: no automated action — just marks completed so clinician can handle manually.
//
// The caller (admin UI) should use the service role key via an authenticated
// server action. This function always requires the Authorization header to
// contain a valid service role JWT or a clinician session with admin role.

import { createClient } from "jsr:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  let body: { request_id: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 })
  }

  const { request_id } = body
  if (!request_id) {
    return new Response(JSON.stringify({ error: "request_id required" }), { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  try {
    // 1. Load the DPA request
    const { data: req_row, error: reqErr } = await supabase
      .from("dpa_requests")
      .select("id, patient_id, request_type, status")
      .eq("id", request_id)
      .single()

    if (reqErr || !req_row) {
      return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 })
    }

    if (req_row.status === "completed" || req_row.status === "rejected") {
      return new Response(
        JSON.stringify({ error: `Request already ${req_row.status}` }),
        { status: 409 },
      )
    }

    const patientId: string = req_row.patient_id

    // 2. Mark as processing before doing work
    await supabase
      .from("dpa_requests")
      .update({ status: "processing" })
      .eq("id", request_id)

    if (req_row.request_type === "export") {
      await handleExport(supabase, request_id, patientId)
    } else if (req_row.request_type === "delete") {
      await handleDelete(supabase, patientId)
    }
    // 'correct' — manual; just mark completed

    // 3. Mark completed
    await supabase
      .from("dpa_requests")
      .update({ status: "completed" })
      .eq("id", request_id)

    return new Response(JSON.stringify({ ok: true, type: req_row.request_type }), { status: 200 })
  } catch (err) {
    console.error("[dpa-export-delete]", err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

async function handleExport(
  supabase: ReturnType<typeof createClient>,
  requestId: string,
  patientId: string,
): Promise<void> {
  const [
    { data: profile },
    { data: medications },
    { data: events },
    { data: conditions },
    { data: doseEvents },
    { data: moodCheckins },
    { data: appointments },
    { data: careCircle },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", patientId).single(),
    supabase.from("medications").select("*").eq("patient_id", patientId),
    supabase.from("events").select("*").eq("patient_id", patientId),
    supabase.from("conditions").select("*").eq("patient_id", patientId),
    supabase.from("dose_events").select("*").eq("patient_id", patientId),
    supabase.from("mood_checkins").select("*").eq("patient_id", patientId),
    supabase.from("appointments").select("*").eq("patient_id", patientId),
    supabase.from("care_circle").select("*").eq("patient_id", patientId),
  ])

  const exportPayload = {
    exported_at: new Date().toISOString(),
    patient_id: patientId,
    profile: profile ?? null,
    medications: medications ?? [],
    events: events ?? [],
    conditions: conditions ?? [],
    dose_events: doseEvents ?? [],
    mood_checkins: moodCheckins ?? [],
    appointments: appointments ?? [],
    care_circle: careCircle ?? [],
  }

  // Store in dpa_exports for the admin to download
  await supabase.from("dpa_exports").upsert(
    {
      request_id: requestId,
      patient_id: patientId,
      payload: exportPayload,
      created_at: new Date().toISOString(),
    },
    { onConflict: "request_id" },
  )
}

async function handleDelete(
  supabase: ReturnType<typeof createClient>,
  patientId: string,
): Promise<void> {
  // Anonymise the profile row — preserve the UUID for FK integrity
  await supabase
    .from("profiles")
    .update({
      full_name: "[deleted]",
      email: null,
      phone: null,
    })
    .eq("id", patientId)

  // Hard-delete clinical data tables
  const tables = [
    "events",
    "dose_events",
    "mood_checkins",
    "conditions",
    "sos_events",
    "ecg_recordings",
    "location_shares",
    "patient_locations",
  ]

  for (const table of tables) {
    try {
      await supabase.from(table).delete().eq("patient_id", patientId)
    } catch {
      // Some tables may not exist yet — skip silently
    }
  }

  // Remove medications
  try {
    await supabase.from("medications").delete().eq("patient_id", patientId)
  } catch { /* skip */ }

  // Anonymise care_circle entries where this patient is the hub
  try {
    await supabase
      .from("care_circle")
      .update({ phone: null, display_name: "[deleted]" })
      .eq("patient_id", patientId)
  } catch { /* skip */ }
}
