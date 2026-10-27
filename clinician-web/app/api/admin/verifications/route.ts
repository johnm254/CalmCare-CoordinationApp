import { createServerClient } from "@supabase/ssr"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

function adminGuard() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
  )
}

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function requireAdmin(supabase: ReturnType<typeof adminGuard>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin" && profile?.role !== "org_admin") return null
  return user
}

// GET — list pending (and recent) clinician_verifications
export async function GET() {
  const supabase = adminGuard()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const admin = adminClient()

  const { data, error } = await admin
    .from("clinician_verifications")
    .select(`
      id, clinician_id, licence_number, cadre, registering_body,
      status, method, evidence_path, notes,
      created_at, verified_at,
      profiles!clinician_verifications_clinician_id_fkey(full_name, email)
    `)
    .in("status", ["pending", "verified", "rejected"])
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ verifications: data ?? [] })
}

// PATCH — approve or reject a verification
// Body: { id: string; action: 'approve' | 'reject'; notes?: string }
export async function PATCH(req: NextRequest) {
  const supabase = adminGuard()
  const adminUser = await requireAdmin(supabase)
  if (!adminUser)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await req.json()) as {
    id: string
    action: "approve" | "reject"
    notes?: string
  }
  if (!body?.id || !["approve", "reject"].includes(body.action)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const admin = adminClient()
  const newStatus = body.action === "approve" ? "verified" : "rejected"

  const { error } = await admin
    .from("clinician_verifications")
    .update({
      status: newStatus,
      verified_by: adminUser.id,
      verified_at: body.action === "approve" ? new Date().toISOString() : null,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ status: newStatus })
}
