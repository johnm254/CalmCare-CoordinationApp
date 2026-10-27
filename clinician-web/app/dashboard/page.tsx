import Link from "next/link"
import { createClient } from "../../lib/supabase-server"
import SeizureChart from "./SeizureChart"

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string text: string label: string }> = {
    review: {
      bg: "bg-[rgba(239,68,68,0.10)]",
      text: "text-[#EF4444]",
      label: "Review",
    },
    stable: {
      bg: "bg-[rgba(139,92,246,0.10)]",
      text: "text-[#8B5CF6]",
      label: "Stable",
    },
    followup: {
      bg: "bg-[rgba(244,184,96,0.10)]",
      text: "text-[#F4B860]",
      label: "Follow-up",
    },
    none: { bg: "bg-[#1C1A35]", text: "text-[#504C78]", label: "No events" },
  }
  const s = map[status] ?? map.stable
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  )
}

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get patients linked to this clinician
  const { data: links } = await supabase
    .from("clinician_links")
    .select(
      "patient_id, profiles!clinician_links_patient_id_fkey(id, full_name, email)",
    )
    .eq("clinician_id", user!.id)
    .not("verified_at", "is", null)

  const patientIds = (links ?? []).map((l: any) => l.patient_id)

  // Events this week per patient (with date for chart)
  const { data: recentEvents } = patientIds.length
    ? await supabase
        .from("events")
        .select("patient_id, occurred_at")
        .in("patient_id", patientIds)
        .gte("occurred_at", weekAgo)
    : { data: [] }

  // Open follow-ups
  const { data: openFollowups } = await supabase
    .from("followups")
    .select(
      "id, patient_id, title, due_at, profiles!followups_patient_id_fkey(full_name)",
    )
    .eq("clinician_id", user!.id)
    .eq("status", "open")
    .order("due_at", { ascending: true })

  const eventsByPatient: Record<string, number> = {}
  ;(recentEvents ?? []).forEach((e: any) => {
    eventsByPatient[e.patient_id] = (eventsByPatient[e.patient_id] ?? 0) + 1
  })

  // Build chart data: events per day for the last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
    const dayStr = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("en-GB", { weekday: "short" })
    const count = (recentEvents ?? []).filter((e: any) =>
      (e.occurred_at ?? "").startsWith(dayStr),
    ).length
    return { day: label, count }
  })

  const patients = (links ?? []).map((l: any) => ({
    id: l.patient_id,
    full_name: l.profiles?.full_name ?? "Unknown",
    initials: (l.profiles?.full_name ?? "U")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    events_this_week: eventsByPatient[l.patient_id] ?? 0,
    open_followups: (openFollowups ?? []).filter(
      (f: any) => f.patient_id === l.patient_id,
    ).length,
  }))

  const needReview = patients.filter((p) => p.events_this_week > 0).length
  const totalEvents = Object.values(eventsByPatient).reduce((s, n) => s + n, 0)

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const firstName =
    profile?.full_name?.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? "Doctor"

  const stats = [
    {
      label: "Total Patients",
      value: patients.length,
      valueColor: "text-[#F5F0FF]",
      iconBg: "bg-[rgba(139,92,246,0.10)]",
      iconColor: "text-[#8B5CF6]",
      trend: "—",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      label: "Need Review",
      value: needReview,
      valueColor: needReview > 0 ? "text-[#EF4444]" : "text-[#F5F0FF]",
      iconBg: needReview > 0 ? "bg-[rgba(239,68,68,0.10)]" : "bg-[#1C1A35]",
      iconColor: needReview > 0 ? "text-[#EF4444]" : "text-[#504C78]",
      trend: needReview > 0 ? "▲" : "—",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    {
      label: "Follow-ups Due",
      value: (openFollowups ?? []).length,
      valueColor:
        (openFollowups ?? []).length > 0 ? "text-[#F4B860]" : "text-[#F5F0FF]",
      iconBg:
        (openFollowups ?? []).length > 0
          ? "bg-[rgba(244,184,96,0.10)]"
          : "bg-[#1C1A35]",
      iconColor:
        (openFollowups ?? []).length > 0 ? "text-[#F4B860]" : "text-[#504C78]",
      trend: (openFollowups ?? []).length > 0 ? "▲" : "—",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      label: "Events This Week",
      value: totalEvents,
      valueColor: "text-[#8B5CF6]",
      iconBg: "bg-[rgba(139,92,246,0.10)]",
      iconColor: "text-[#8B5CF6]",
      trend: totalEvents > 0 ? "▲" : "—",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#14122A] to-[#22203D] border border-[#2E2B50] rounded-2xl p-6 mb-8">
        <p className="text-[#504C78] text-xs font-medium uppercase tracking-widest mb-1">
          {today}
        </p>
        <h1 className="text-[#F5F0FF] font-bold" style={{ fontSize: "26px" }}>
          {greeting}, Dr. {firstName}
        </h1>
        <p className="text-[#9B96C0] text-sm mt-1">
          Here is what is happening with your patients today.
        </p>
        {/* Pulse line */}
        <svg
          viewBox="0 0 400 32"
          className="w-full mt-4 opacity-30"
          aria-hidden="true"
        >
          <polyline
            points="0,16 60,16 80,4 100,28 120,16 160,16 180,8 200,24 220,16 280,16 300,6 320,26 340,16 400,16"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg} ${s.iconColor}`}
              >
                {s.icon}
              </div>
              <span className="text-[#504C78] text-xs">{s.trend}</span>
            </div>
            <p className={`text-3xl font-black ${s.valueColor} mb-1`}>
              {s.value}
            </p>
            <p className="text-[#9B96C0] text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Seizure frequency chart — full width below KPI row */}
      <div className="col-span-3 bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-[#F5F0FF] mb-4">
          Events this week
        </h2>
        <SeizureChart data={chartData} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Patient roster */}
        <div className="col-span-3 xl:col-span-2 bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#F5F0FF]">Patients</h2>
            <Link
              href="/dashboard/patients"
              className="text-[#8B5CF6] text-sm hover:underline font-medium"
            >
              View all →
            </Link>
          </div>

          {patients.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1C1A35] flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-[#504C78]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <p className="text-[#9B96C0] text-sm">No patients linked yet.</p>
              <p className="text-[#504C78] text-xs mt-1">
                Patients can link you from their app, or you can add a link from
                the Patients page.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {patients.map((patient) => {
                const status =
                  patient.events_this_week > 0
                    ? "review"
                    : patient.open_followups > 0
                      ? "followup"
                      : "stable"
                return (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#1C1A35] transition-colors border-b border-[#2E2B50] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] font-bold text-sm flex-shrink-0">
                        {patient.initials}
                      </div>
                      <div>
                        <p className="text-[#F5F0FF] font-semibold text-sm">
                          {patient.full_name}
                        </p>
                        <p className="text-[#504C78] text-xs">
                          {patient.events_this_week} events this week
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={status} />
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="text-[#8B5CF6] border border-[#2E2B50] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#8B5CF6]/10 transition-colors min-h-[36px] flex items-center"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Follow-ups */}
        <div className="col-span-3 xl:col-span-1 bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#F5F0FF]">Follow-ups</h2>
            <Link
              href="/dashboard/follow-ups"
              className="text-[#8B5CF6] text-sm hover:underline font-medium"
            >
              View all →
            </Link>
          </div>

          {(openFollowups ?? []).length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-[#9B96C0] text-sm">No open follow-ups.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(openFollowups ?? []).slice(0, 4).map((fu: any) => {
                const daysUntil = Math.ceil(
                  (new Date(fu.due_at).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                )
                const dateColor =
                  daysUntil < 0
                    ? "text-[#EF4444]"
                    : daysUntil === 0
                      ? "text-[#F4B860]"
                      : "text-[#504C78]"
                return (
                  <div
                    key={fu.id}
                    className="border-b border-[#2E2B50] pb-4 last:border-0 last:pb-0"
                  >
                    <p className="text-[#9B96C0] text-xs mb-1">
                      {(fu.profiles as any)?.full_name}
                    </p>
                    <p className="text-[#F5F0FF] text-sm font-semibold leading-snug mb-1.5">
                      {fu.title}
                    </p>
                    <p className={`text-xs font-medium ${dateColor}`}>
                      {daysUntil < 0
                        ? `Overdue by ${Math.abs(daysUntil)}d`
                        : daysUntil === 0
                          ? "Due today"
                          : `Due ${new Date(fu.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
