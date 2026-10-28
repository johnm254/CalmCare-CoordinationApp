import { createServerClient } from "@supabase/ssr"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

function browserClient() {
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

async function requireAdmin() {
  const supabase = browserClient()
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

// GET — list all feature flags
export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const admin = adminClient()
  const { data, error } = await admin
    .from("feature_flags")
    .select("key, enabled, rollout, updated_at")
    .order("key")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ flags: data ?? [] })
}

// PATCH — toggle a flag: { key: string, enabled: boolean }
export async function PATCH(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await req.json()) as { key: string; enabled: boolean }
  if (!body?.key || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const admin = adminClient()
  const { error } = await admin
    .from("feature_flags")
    .update({ enabled: body.enabled, updated_at: new Date().toISOString() })
    .eq("key", body.key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort audit log entry for platform actions
  try {
    await admin.from("audit_log").insert({
      actor_id: user.id,
      patient_id: user.id,
      action: "toggle_feature_flag",
      resource_type: "feature_flags",
      metadata: { key: body.key, enabled: body.enabled },
    })
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({ ok: true })
}
