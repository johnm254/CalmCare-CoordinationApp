"use client" /* Search */ /* Right side */ /* Notification bell */ /* Avatar + name dropdown */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../../lib/supabase-browser"

export default function AdminHeader({
  profile,
}: {
  profile: { full_name: string | null email: string | null }
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  const initials = (profile.full_name ?? "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-[#07060E] border-b border-[#2E2B50] flex-shrink-0">
      {}
      <div className="relative flex items-center">
        <svg
          className="absolute left-3.5 w-4 h-4 text-[#504C78]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search anything..."
          className="pl-10 pr-4 py-2 bg-[#14122A] border border-[#2E2B50] rounded-full text-sm text-[#F5F0FF] placeholder:text-[#504C78] focus:outline-none focus:border-[#8B5CF6]/50 w-72"
        />
      </div>

      {}
      <div className="flex items-center gap-3">
        {}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#14122A] border border-[#2E2B50] hover:border-[#8B5CF6]/40 transition-colors">
          <svg
            className="w-[18px] h-[18px] text-[#9B96C0]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none">
            3
          </span>
        </button>

        <div className="w-px h-6 bg-[#2E2B50]" />

        {}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 py-1 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-[#09090F] font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="text-left">
              <p className="text-[#F5F0FF] text-sm font-semibold leading-none">
                {profile.full_name ?? "Admin"}
              </p>
              <p className="text-[#9B96C0] text-xs mt-0.5 leading-none">
                Super Admin
              </p>
            </div>
            <svg
              className="w-4 h-4 text-[#9B96C0] ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-12 w-52 bg-[#14122A] border border-[#2E2B50] rounded-2xl shadow-2xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2E2B50]">
                  <p className="text-[#F5F0FF] text-sm font-semibold truncate">
                    {profile.full_name}
                  </p>
                  <p className="text-[#9B96C0] text-xs truncate mt-0.5">
                    {profile.email}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-3 text-sm text-[#FF7A6B] hover:bg-[#2E2B50] transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
