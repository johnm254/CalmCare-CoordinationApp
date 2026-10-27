import { createServerClient } from "@supabase/ssr"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
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

  const { email, full_name } = await req.json()
  if (!email)
    return NextResponse.json({ error: "Email is required" }, { status: 400 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { role: "clinician", full_name: full_name ?? "" },
      redirectTo: `${siteUrl}/auth/callback`,
    },
  )

  if (inviteError)
    return NextResponse.json({ error: inviteError.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
