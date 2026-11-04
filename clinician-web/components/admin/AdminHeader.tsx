'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase-browser';

export default function AdminHeader({ profile }: { profile: { full_name: string | null; email: string | null } }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  const initials = (profile.full_name ?? 'A')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-[#FFFFFF] border-b border-[#E6ECF2] flex-shrink-0">
      {/* Search */}
      <div className="relative flex items-center">
        <svg className="absolute left-3.5 w-4 h-4 text-[#8C9AAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search anything..."
          className="pl-10 pr-4 py-2 bg-[#F1F5FA] border border-[#E6ECF2] rounded-full text-sm text-[#0F1B2D] placeholder:text-[#8C9AAB] focus:outline-none focus:border-[#14B8A6]/50 w-72"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#F1F5FA] border border-[#E6ECF2] hover:border-[#14B8A6]/40 transition-colors">
          <svg className="w-[18px] h-[18px] text-[#5B6B7F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <div className="w-px h-6 bg-[#E6ECF2]" />

        {/* Avatar + name dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 py-1 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-[#14B8A6]/15 flex items-center justify-center text-[#14B8A6] font-bold text-sm flex-shrink-0 border border-[#14B8A6]/30">
              {initials}
            </div>
            <div className="text-left">
              <p className="text-[#0F1B2D] text-sm font-semibold leading-none">{profile.full_name ?? 'Admin'}</p>
              <p className="text-[#5B6B7F] text-xs mt-0.5 leading-none">Super Admin</p>
            </div>
            <svg className="w-4 h-4 text-[#5B6B7F] ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-12 w-52 bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl shadow-2xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E6ECF2]">
                  <p className="text-[#0F1B2D] text-sm font-semibold truncate">{profile.full_name}</p>
                  <p className="text-[#5B6B7F] text-xs truncate mt-0.5">{profile.email}</p>
                </div>
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-3 text-sm text-[#F43F5E] hover:bg-[#F1F5FA] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
