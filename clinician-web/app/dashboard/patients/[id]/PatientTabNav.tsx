'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Overview', href: '' },
  { label: 'Schedules', href: 'schedules' },
  { label: 'Alert Rules', href: 'alert-rules' },
  { label: 'Adherence', href: 'adherence' },
  { label: 'Follow-ups', href: 'follow-ups' },
] as const;

export default function PatientTabNav({ patientId }: { patientId: string }) {
  const pathname = usePathname();
  const baseHref = `/dashboard/patients/${patientId}`;

  function isActive(tabHref: string) {
    const full = tabHref ? `${baseHref}/${tabHref}` : baseHref;
    return pathname === full;
  }

  return (
    <nav aria-label="Patient sections" className="flex items-center gap-1 border-b border-[#E6ECF2] mb-8 overflow-x-auto">
      {TABS.map((tab) => {
        const href = tab.href ? `${baseHref}/${tab.href}` : baseHref;
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.label}
            href={href}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              active
                ? 'text-[#14B8A6] border-[#14B8A6]'
                : 'text-[#5B6B7F] hover:text-[#0F1B2D] border-transparent hover:border-[#E6ECF2]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
