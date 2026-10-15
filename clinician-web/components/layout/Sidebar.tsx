'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase-browser';

const NAV_ITEMS = [
  {
    label: 'Dashboard', href: '/dashboard',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: 'Patients', href: '/dashboard/patients',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    label: 'Follow-ups', href: '/dashboard/follow-ups',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    label: 'Activity', href: '/dashboard/activity',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

interface Props {
  profile: { id: string; full_name: string | null; role: string };
}

export default function Sidebar({ profile }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'DR';

  return (
    <aside className="w-60 min-h-screen bg-[#0A121E] border-r border-[#1E3A52] flex flex-col fixed top-0 left-0 z-20">
      <div className="px-5 py-5 border-b border-[#1E3A52]">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-9 h-9" aria-hidden="true">
            <circle cx="48" cy="48" r="10" fill="#4FC3B7"/>
            <circle cx="48" cy="48" r="26" fill="none" stroke="#4FC3B7" strokeWidth="6" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)"/>
            <circle cx="48" cy="48" r="42" fill="none" stroke="#4FC3B7" strokeOpacity=".4" strokeWidth="6" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)"/>
          </svg>
          <div>
            <p className="text-[#EAF2F6] font-bold text-base leading-none">Duara</p>
            <p className="text-[#4F6D84] text-xs mt-0.5">Clinician</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              isActive(item.href)
                ? 'bg-[#4FC3B7]/15 text-[#4FC3B7]'
                : 'text-[#A8BDCA] hover:bg-[#1A3144] hover:text-[#EAF2F6]'
            }`}>
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1E3A52]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#1A3A3A] flex items-center justify-center text-[#4FC3B7] font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[#EAF2F6] font-semibold text-sm truncate">{profile.full_name ?? 'Clinician'}</p>
            <p className="text-[#4F6D84] text-xs">Verified clinician</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="text-[#4F6D84] text-xs hover:text-[#A8BDCA] transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );
}
