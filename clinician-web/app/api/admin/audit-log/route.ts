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
  if (profile?.role !== "admin" && profile?.role !== "org_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await admin
    .from("audit_log")
    .select(
      "id, action, actor_role, resource_type, metadata, at, actor_id, patient_id",
    )
    .order("at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Resolve actor names in a single batch query
  const actorIds = [
    ...new Set((data ?? []).map((e: any) => e.actor_id).filter(Boolean)),
  ]
  let nameMap: Record<string, string> = {}
  if (actorIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds)
    ;(profiles ?? []).forEach((p: any) => {
      nameMap[p.id] = p.full_name
    })
  }

  const entries = (data ?? []).map((e: any) => ({
    ...e,
    actor_name: nameMap[e.actor_id] ?? null,
  }))

  return NextResponse.json({ entries })
}
