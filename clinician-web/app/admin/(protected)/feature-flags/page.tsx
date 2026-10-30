'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../../lib/supabase-browser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlagRow {
  key: string;
  enabled: boolean;
  description: string;
  updated_at: string | null;
}

// ---------------------------------------------------------------------------
// Hardcoded defaults shown when DB is empty
// ---------------------------------------------------------------------------

const DEFAULT_FLAGS: FlagRow[] = [
  {
    key: 'live_dispatch',
    enabled: false,
    description: 'Real ambulances called on SOS. Keep OFF until county MoU signed.',
    updated_at: null,
  },
  {
    key: 'ble_strap',
    enabled: false,
    description: 'Mojo Strap Bluetooth pairing enabled.',
    updated_at: null,
  },
  {
    key: 'swahili_ui',
    enabled: false,
    description: 'Swahili locale strings shown to users.',
    updated_at: null,
  },
  {
    key: 'research_mode',
    enabled: false,
    description: 'Anonymised data shared with research partners.',
    updated_at: null,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FeatureFlagsPage() {
  const supabase = createClient();
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDefaults, setUsingDefaults] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('feature_flags')
        .select('key, enabled, description, updated_at')
        .order('key');

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setFlags(DEFAULT_FLAGS);
        setUsingDefaults(true);
      } else {
        setFlags(data as FlagRow[]);
        setUsingDefaults(false);
      }
    } catch {
      setFlags(DEFAULT_FLAGS);
      setUsingDefaults(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  async function toggleFlag(flag: FlagRow) {
    setToggling(flag.key);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ enabled: !flag.enabled, updated_at: new Date().toISOString() })
        .eq('key', flag.key);
      if (updateError) throw updateError;
      // Optimistic update
      setFlags((prev) =>
        prev.map((f) => (f.key === flag.key ? { ...f, enabled: !f.enabled, updated_at: new Date().toISOString() } : f))
      );
      setUsingDefaults(false);
    } catch {
      setError(`Failed to toggle "${flag.key}". The feature_flags table may not exist yet.`);
    }
    setToggling(null);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F0FF]">Feature Flags</h1>
        <p className="text-[#9B96C0] text-sm mt-1 max-w-2xl">
          Toggle platform capabilities. Changes take effect immediately for all users.
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-[rgba(239,68,68,0.08)] border border-[#EF4444]/30 rounded-2xl px-5 py-4 mb-6">
        <svg className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-[#EF4444] text-sm font-semibold leading-snug">
          Changes here affect all users in production. Consult the team before enabling live dispatch.
        </p>
      </div>

      {/* Defaults note */}
      {usingDefaults && !loading && (
        <div className="flex items-start gap-3 bg-[rgba(244,184,96,0.08)] border border-[#F4B860]/25 rounded-2xl px-5 py-3 mb-5">
          <svg className="w-4 h-4 text-[#F4B860] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#F4B860] text-xs leading-snug">
            These are display defaults — save to DB to persist. Run the <code className="font-mono bg-[#1C1A35] px-1 rounded">feature_flags</code> migration first.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[rgba(239,68,68,0.08)] border border-[#EF4444]/30 rounded-xl px-4 py-3 mb-4">
          <p className="text-[#EF4444] text-sm">{error}</p>
        </div>
      )}

      {/* Flags table */}
      <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_2fr_100px_140px_120px] px-6 py-3 bg-[#09090F] border-b border-[#2E2B50]">
          {['Flag key', 'Description', 'Status', 'Last changed', ''].map((h) => (
            <span key={h} className="text-[#504C78] text-xs font-semibold uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#9B96C0] text-sm">Loading flags…</p>
          </div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.key}
              className="grid grid-cols-[1fr_2fr_100px_140px_120px] px-6 py-4 border-b border-[#2E2B50] last:border-0 items-center hover:bg-[#1C1A35] transition-colors"
            >
              {/* Key */}
              <code className="text-[#F5F0FF] text-sm font-mono bg-[#1C1A35] px-2 py-0.5 rounded w-fit">
                {flag.key}
              </code>

              {/* Description */}
              <p className="text-[#9B96C0] text-sm pr-4">{flag.description}</p>

              {/* Enabled badge */}
              {flag.enabled ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(34,200,122,0.10)] text-[#22C87A] border border-[#22C87A]/20 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(80,76,120,0.15)] text-[#504C78] border border-[#504C78]/20 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Disabled
                </span>
              )}

              {/* Updated at */}
              <p className="text-[#504C78] text-xs">{fmtDate(flag.updated_at)}</p>

              {/* Toggle button */}
              <button
                onClick={() => toggleFlag(flag)}
                disabled={toggling === flag.key}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 w-fit ${
                  flag.enabled
                    ? 'bg-[rgba(239,68,68,0.10)] text-[#EF4444] border border-[#EF4444]/20 hover:bg-[rgba(239,68,68,0.20)]'
                    : 'bg-[rgba(34,200,122,0.10)] text-[#22C87A] border border-[#22C87A]/20 hover:bg-[rgba(34,200,122,0.20)]'
                }`}
              >
                {toggling === flag.key ? '…' : flag.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
