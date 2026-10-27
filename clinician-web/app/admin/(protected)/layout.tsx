import { redirect } from "next/navigation"
import { createClient } from "../../../lib/supabase-server"
import AdminSidebar from "../../../components/layout/AdminSidebar"
import AdminHeader from "../../../components/admin/AdminHeader"
import InactivityLogout from "../../../components/InactivityLogout"

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/admin/login")

  return (
    <div className="flex h-screen bg-[#070E1B] text-white overflow-hidden">
      <InactivityLogout redirectTo="/admin/login" />
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader profile={profile} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
