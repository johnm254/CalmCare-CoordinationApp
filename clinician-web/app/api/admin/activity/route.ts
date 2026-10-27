import { createServerClient } from "@supabase/ssr"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  type Entry = {
    id: string
    kind: "sos" | "event" | "login" | "audit"
    actorName: string
    patientName?: string
    description: string
    at: string
  }

  const entries: Entry[] = []

  // SOS events (all patients, system-wide)
  const { data: sosEvents } = await admin
    .from("sos_events")
    .select(
      "id, patient_id, created_at, resolved_at, profiles!sos_events_patient_id_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(50)

  for (const s of sosEvents ?? []) {
    const patient = (s as any).profiles
    entries.push({
      id: `sos-${s.id}`,
      kind: "sos",
      actorName: "System",
      patientName: patient?.full_name ?? "Unknown patient",
      description: (s as any).resolved_at
        ? "SOS alert triggered (resolved)"
        : "SOS alert triggered",
      at: s.created_at,
    })
  }

  // Audit log entries
  const { data: auditLog } = await admin
    .from("audit_log")
    .select(
      "id, action, at, resource_type, actor:actor_id(full_name), patient:patient_id(full_name)",
    )
    .order("at", { ascending: false })
    .limit(60)

  for (const e of auditLog ?? []) {
    const actor = (e as any).actor
    const patient = (e as any).patient
    const kind = (e as any).resource_type === "events" ? "event" : "audit"
    entries.push({
      id: `audit-${e.id}`,
      kind,
      actorName: actor?.full_name ?? "Unknown clinician",
      patientName: patient?.full_name,
      description: e.action ?? "Audit event",
      at: e.at,
    })
  }

  // Sort combined feed by time, newest first
  entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  return NextResponse.json({ entries: entries.slice(0, 100) })
}
