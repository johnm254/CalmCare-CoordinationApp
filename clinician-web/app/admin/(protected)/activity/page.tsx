"use client" /* Stats */ /* Filter pills */ /* Timeline */

import { useState, useEffect } from "react"

type ActivityEntry = {
  id: string
  kind: "sos" | "event" | "login" | "audit"
  actorName: string
  patientName?: string
  description: string
  at: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const FILTER_OPTS = ["All", "SOS", "Events", "Login"] as const
type Filter = typeof FILTER_OPTS[number]

export default function AdminActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("All")

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch("/api/admin/activity")
        if (!res.ok) throw new Error("Failed")
        const json = await res.json()
        setEntries(json.entries ?? [])
      } catch {
        setEntries([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = entries.filter((e) => {
    if (filter === "All") return true
    if (filter === "SOS") return e.kind === "sos"
    if (filter === "Events") return e.kind === "event"
    if (filter === "Login") return e.kind === "login" || e.kind === "audit"
    return true
  })

  const sosCount = entries.filter((e) => e.kind === "sos").length
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayCount = entries.filter((e) => e.at?.startsWith(todayStr)).length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F0FF]">System activity</h1>
        <p className="text-[#9B96C0] text-sm mt-1">
          Platform-wide audit trail — SOS alerts, events, and authentication
          logs.
        </p>
      </div>

      {}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5">
          <p className="text-3xl font-black text-[#F5F0FF] mb-0.5">
            {loading ? "—" : entries.length}
          </p>
          <p className="text-[#9B96C0] text-sm">Total entries</p>
          <p className="text-[#504C78] text-xs mt-1">Last 100 records</p>
        </div>
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5">
          <p
            className={`text-3xl font-black mb-0.5 ${
              sosCount > 0 ? "text-[#EF4444]" : "text-[#F5F0FF]"
            }`}
          >
            {loading ? "—" : sosCount}
          </p>
          <p className="text-[#9B96C0] text-sm">SOS alerts</p>
          <p className="text-[#504C78] text-xs mt-1">In this window</p>
        </div>
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-5">
          <p className="text-3xl font-black text-[#8B5CF6] mb-0.5">
            {loading ? "—" : todayCount}
          </p>
          <p className="text-[#9B96C0] text-sm">Events today</p>
          <p className="text-[#504C78] text-xs mt-1">
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>

      {}
      <div className="flex items-center gap-2 mb-5">
        {FILTER_OPTS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all border ${
              filter === f
                ? "bg-[#8B5CF6] text-[#09090F] border-[#8B5CF6]"
                : "bg-transparent text-[#9B96C0] border-[#2E2B50] hover:border-[#8B5CF6]/50 hover:text-[#F5F0FF]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {}
      <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#9B96C0] text-sm">Loading activity…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#9B96C0] text-sm">
              No activity in this category.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filtered.map((entry, i) => {
              const isSOS = entry.kind === "sos"
              const isEvent = entry.kind === "event"
              const isLogin = entry.kind === "login" || entry.kind === "audit"

              const dotColor = isSOS
                ? "bg-[#EF4444]"
                : isEvent
                  ? "bg-[#F4B860]"
                  : "bg-[#8B5CF6]"
              const ringColor = isSOS
                ? "bg-[rgba(239,68,68,0.15)]"
                : isEvent
                  ? "bg-[rgba(244,184,96,0.15)]"
                  : "bg-[rgba(139,92,246,0.12)]"

              return (
                <div
                  key={entry.id}
                  className={`flex gap-4 pb-5 relative ${
                    isSOS
                      ? "bg-[rgba(239,68,68,0.03)] -mx-6 px-6 rounded-xl"
                      : ""
                  }`}
                >
                  {i < filtered.length - 1 && (
                    <div className="absolute left-4 top-9 bottom-0 w-px bg-[#2E2B50]" />
                  )}
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className={`w-8 h-8 rounded-full ${ringColor} flex items-center justify-center`}
                    >
                      <div className={`w-3 h-3 rounded-full ${dotColor}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {isSOS && (
                          <span className="inline-flex items-center gap-1 bg-[#EF4444] text-white text-xs font-bold px-2 py-0.5 rounded-full mb-1.5">
                            SOS
                          </span>
                        )}
                        {!isSOS && (
                          <span
                            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 ${
                              isEvent
                                ? "bg-[rgba(244,184,96,0.12)] text-[#F4B860]"
                                : "bg-[rgba(139,92,246,0.10)] text-[#8B5CF6]"
                            }`}
                          >
                            {isLogin ? "Auth" : "Event"}
                          </span>
                        )}
                        <p className="text-[#F5F0FF] text-sm font-semibold">
                          {entry.description}
                        </p>
                        <p className="text-[#9B96C0] text-xs mt-0.5">
                          {entry.actorName}
                          {entry.patientName && (
                            <>
                              {" "}
                              ·{" "}
                              <span className="text-[#F5F0FF] font-semibold">
                                {entry.patientName}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[#504C78] text-xs whitespace-nowrap">
                          {timeAgo(entry.at)}
                        </p>
                        <p className="text-[#504C78] text-xs mt-0.5 whitespace-nowrap">
                          {formatTime(entry.at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
