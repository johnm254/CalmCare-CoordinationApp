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
  if (profile?.role !== "admin") return null
  return user
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await req.json()) as { action: string }
  const admin = adminClient()

  if (body.action === "purge_audit_log") {
    // Delete audit log entries older than 30 days, keep last 500
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await admin.from("audit_log").delete().lt("at", cutoff)

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })

    // Audit the purge itself
    try {
      await admin.from("audit_log").insert({
        actor_id: user.id,
        actor_role: "admin",
        action: "purge_audit_log",
        resource_type: "audit_log",
        at: new Date().toISOString(),
      })
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({ ok: true, action: "purge_audit_log" })
  }

  if (body.action === "revoke_all_sessions") {
    // List all users and sign them out via admin API
    const { data: users, error: listErr } = await admin.auth.admin.listUsers({
      perPage: 1000,
    })
    if (listErr)
      return NextResponse.json({ error: listErr.message }, { status: 500 })

    const results = await Promise.allSettled(
      (users?.users ?? []).map((u) => admin.auth.admin.signOut(u.id, "global")),
    )

    const failed = results.filter((r) => r.status === "rejected").length

    try {
      await admin.from("audit_log").insert({
        actor_id: user.id,
        actor_role: "admin",
        action: "revoke_all_sessions",
        resource_type: "auth",
        metadata: { total: users?.users?.length ?? 0, failed },
        at: new Date().toISOString(),
      })
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({
      ok: true,
      action: "revoke_all_sessions",
      revoked: (users?.users?.length ?? 0) - failed,
    })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
