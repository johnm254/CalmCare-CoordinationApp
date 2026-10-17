'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    href: '/admin/clinicians',
    label: 'Clinicians',
    color: 'from-[#8B5CF6] to-[#6D28D9]',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/activity',
    label: 'Activity',
    color: 'from-[#3B82F6] to-[#1D4ED8]',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    color: 'from-[#8B5CF6] to-[#6D28D9]',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-[#07060E] border-r border-[#2E2B50] flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-[#2E2B50]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="w-5 h-5" aria-hidden="true">
              <circle cx="48" cy="48" r="10" fill="white"/>
              <circle cx="48" cy="48" r="26" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" strokeDasharray="130 34" transform="rotate(-60 48 48)"/>
              <circle cx="48" cy="48" r="42" fill="none" stroke="white" strokeOpacity=".6" strokeWidth="7" strokeLinecap="round" strokeDasharray="200 64" transform="rotate(100 48 48)"/>
            </svg>
          </div>
          <div>
            <p className="text-[#F5F0FF] font-bold text-base leading-none">Duara</p>
            <p className="text-[#504C78] text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-[#504C78] text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Main Menu</p>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20'
                  : 'text-[#9B96C0] hover:bg-[#2E2B50] hover:text-[#F5F0FF]'
              }`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-gradient-to-br ' + item.color + ' text-white' : 'bg-[#2E2B50] text-[#9B96C0]'}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* System status */}
      <div className="mx-3 mb-4 p-4 rounded-2xl bg-[#14122A] border border-[#2E2B50]">
        <p className="text-[#9B96C0] text-[10px] font-semibold uppercase tracking-widest mb-2">System Status</p>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
          <p className="text-[#F5F0FF] text-xs font-medium">All Systems Operational</p>
        </div>
      </div>
    </aside>
  );
}
