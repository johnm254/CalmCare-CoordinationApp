'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../lib/supabase-browser';

type IncidentRow = {
  id: string;
  clinician_id: string;
  patient_id: string;
  reason: string | null;
  accessed_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
  clinician_name: string | null;
  patient_name: string | null;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IncidentLogPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('incident_log')
        .select(
          'id, clinician_id, patient_id, reason, accessed_at, resolved_by, resolved_at, profiles!incident_log_clinician_id_fkey(full_name), patients:profiles!incident_log_patient_id_fkey(full_name)',
        )
        .order('accessed_at', { ascending: false });

      if (error) {
        // Table may not exist yet — show migration banner instead of crashing
        if (
          error.code === '42P01' ||
          error.message?.toLowerCase().includes('does not exist')
        ) {
          setTableError(true);
          setLoading(false);
          return;
        }
        throw error;
      }

      const mapped: IncidentRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        clinician_id: r.clinician_id,
        patient_id: r.patient_id,
        reason: r.reason,
        accessed_at: r.accessed_at,
        resolved_by: r.resolved_by,
        resolved_at: r.resolved_at,
        clinician_name: r.profiles?.full_name ?? null,
        patient_name: r.patients?.full_name ?? null,
      }));

      setRows(mapped);
      setTableError(false);
    } catch {
      setTableError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Realtime subscription — auto-refresh on any change to incident_log
  useEffect(() => {
    const channel = supabase
      .channel('incident-log')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_log' },
        () => fetchRows(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRows]);

  async function markResolved(id: string) {
    setActionLoading(id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from('incident_log')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id ?? null,
        })
        .eq('id', id);
      await fetchRows();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F0FF]">
          Break-glass &amp; Incident Log
        </h1>
        <p className="text-[#9B96C0] text-sm mt-1 max-w-2xl">
          Every emergency access event is recorded and audited. Clinicians
          cannot delete or modify this log.
        </p>
      </div>

      {/* Migration banner */}
      {tableError && (
        <div className="mb-6 flex items-start gap-3 bg-[rgba(244,184,96,0.08)] border border-[#F4B860]/30 rounded-2xl px-5 py-4">
          <svg
            className="w-5 h-5 text-[#F4B860] flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <div>
            <p className="text-[#F4B860] text-sm font-semibold">
              Table not set up — run migration 011
            </p>
            <p className="text-[#9B96C0] text-xs mt-0.5">
              The <span className="font-mono text-[#F5F0FF]">incident_log</span>{' '}
              table does not exist yet. Run the 011 migration to enable this
              feature.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {!tableError && (
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_2fr_160px_110px_120px] px-6 py-3 bg-[#09090F] border-b border-[#2E2B50]">
            {['Clinician', 'Patient', 'Reason', 'Accessed At', 'Status', ''].map(
              (h) => (
                <span
                  key={h}
                  className="text-[#504C78] text-xs font-semibold uppercase tracking-wider"
                >
                  {h}
                </span>
              ),
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[#9B96C0] text-sm">Loading log…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center">
              <svg
                className="w-10 h-10 text-[#2E2B50] mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <p className="text-[#9B96C0] text-sm font-medium">
                No break-glass events recorded.
              </p>
              <p className="text-[#504C78] text-xs mt-1">
                All clear — no emergency access has been logged.
              </p>
            </div>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_1fr_2fr_160px_110px_120px] px-6 py-4 border-b border-[#2E2B50] last:border-0 items-center hover:bg-[#1C1A35] transition-colors"
              >
                {/* Clinician */}
                <div>
                  <p className="text-[#F5F0FF] text-sm font-semibold">
                    {row.clinician_name ?? '—'}
                  </p>
                  <p className="text-[#504C78] text-xs font-mono">
                    {row.clinician_id.slice(0, 8)}
                  </p>
                </div>

                {/* Patient */}
                <div>
                  <p className="text-[#F5F0FF] text-sm font-semibold">
                    {row.patient_name ?? '—'}
                  </p>
                  <p className="text-[#504C78] text-xs font-mono">
                    {row.patient_id.slice(0, 8)}
                  </p>
                </div>

                {/* Reason */}
                <p className="text-[#9B96C0] text-sm truncate">
                  {row.reason ?? <span className="text-[#504C78]">No reason provided</span>}
                </p>

                {/* Accessed At */}
                <p className="text-[#9B96C0] text-xs">{fmtDate(row.accessed_at)}</p>

                {/* Status badge */}
                {row.resolved_at ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-0.5 w-fit text-[#22C87A] bg-[rgba(34,200,122,0.10)] border-[#22C87A]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    Resolved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-0.5 w-fit text-[#F4B860] bg-[rgba(244,184,96,0.10)] border-[#F4B860]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    Open
                  </span>
                )}

                {/* Action */}
                <div>
                  {!row.resolved_at && (
                    <button
                      onClick={() => markResolved(row.id)}
                      disabled={actionLoading === row.id}
                      className="bg-[#22C87A] text-[#09090F] rounded-lg px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                    >
                      {actionLoading === row.id ? '…' : 'Mark resolved'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
