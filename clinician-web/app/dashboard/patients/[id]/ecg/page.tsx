'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../../../../lib/supabase-browser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecordingStatus = 'unreviewed' | 'reviewed';

interface EcgRecording {
  id: string;
  date: string;   // formatted
  time: string;   // formatted
  duration: string;
  status: RecordingStatus;
  isMock?: boolean;
}

// ---------------------------------------------------------------------------
// Mock fallback — used when no real recordings are in the DB yet
// ---------------------------------------------------------------------------

const MOCK_RECORDINGS: EcgRecording[] = [
  { id: 'ecg-1', date: '12 Oct 2026', time: '09:14', duration: '30s', status: 'unreviewed', isMock: true },
  { id: 'ecg-2', date: '11 Oct 2026', time: '22:03', duration: '45s', status: 'reviewed',   isMock: true },
  { id: 'ecg-3', date: '9 Oct 2026',  time: '14:55', duration: '20s', status: 'unreviewed', isMock: true },
];

// ---------------------------------------------------------------------------
// ECG SVG waveform — static strip (real amplitude data not yet transmitted)
// ---------------------------------------------------------------------------

function EcgSvg() {
  const width = 600;
  const height = 120;
  const baseline = 65;

  const minorStep = 20;
  const majorStep = 100;

  const vLines: number[] = [];
  for (let x = 0; x <= width; x += minorStep) vLines.push(x);
  const hLines: number[] = [];
  for (let y = 0; y <= height; y += minorStep) hLines.push(y);

  function beat(startX: number): string {
    const s = startX;
    return (
      `L ${s} ${baseline} ` +
      `L ${s + 8} ${baseline - 8} L ${s + 16} ${baseline} ` +
      `L ${s + 24} ${baseline} ` +
      `L ${s + 26} ${baseline + 10} ` +
      `L ${s + 32} ${baseline - 45} ` +
      `L ${s + 38} ${baseline + 8} ` +
      `L ${s + 48} ${baseline} ` +
      `L ${s + 58} ${baseline - 14} L ${s + 72} ${baseline} ` +
      `L ${s + 100} ${baseline}`
    );
  }

  const path =
    `M 0 ${baseline} L 20 ${baseline}` +
    beat(20) + beat(120) + beat(220) + beat(320) + beat(420) +
    `L ${width} ${baseline}`;

  return (
    <div className="overflow-x-auto rounded-xl bg-[#09090F] border border-[#2E2B50]">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        aria-label="ECG waveform strip"
      >
        {vLines.map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height}
            stroke="#1C1A35" strokeWidth={x % majorStep === 0 ? 1 : 0.4} />
        ))}
        {hLines.map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y}
            stroke="#1C1A35" strokeWidth={y % majorStep === 0 ? 1 : 0.4} />
        ))}
        <path d={path} fill="none" stroke="#22C87A" strokeWidth={1.8}
          strokeLinecap="round" strokeLinejoin="round" />
        <text x={8} y={12} fill="#504C78" fontSize={9} fontFamily="monospace">
          25mm/s · waveform strip
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: RecordingStatus }) {
  if (status === 'reviewed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(34,200,122,0.10)] text-[#22C87A] border border-[#22C87A]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        reviewed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(244,184,96,0.10)] text-[#F4B860] border border-[#F4B860]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      unreviewed
    </span>
  );
}

// ---------------------------------------------------------------------------
// Recording card
// ---------------------------------------------------------------------------

function EcgCard({
  recording,
  onMarkReviewed,
}: {
  recording: EcgRecording;
  onMarkReviewed: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[#F5F0FF] font-semibold text-sm">
            {recording.date} · {recording.time}
          </p>
          <span className="text-[#504C78] text-xs">Duration: {recording.duration}</span>
          <StatusBadge status={recording.status} />
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-[#1C1A35] border border-[#2E2B50] text-[#9B96C0] hover:text-[#F5F0FF] hover:border-[#504C78] transition-colors flex-shrink-0"
        >
          {expanded ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Hide strip
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              View strip
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="px-6 pb-6 border-t border-[#2E2B50] pt-4">
          <EcgSvg />
          {recording.status === 'unreviewed' && (
            <div className="mt-4">
              <button
                onClick={() => onMarkReviewed(recording.id)}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-[rgba(34,200,122,0.12)] text-[#22C87A] border border-[#22C87A]/25 hover:bg-[rgba(34,200,122,0.22)] transition-colors"
              >
                Mark as reviewed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EcgPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [recordings, setRecordings] = useState<EcgRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ecg_recordings')
        .select('id, recorded_at, duration_s, status')
        .eq('patient_id', params.id)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        setRecordings(
          data.map((r: any) => {
            const dt = new Date(r.recorded_at);
            return {
              id: r.id,
              date: dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              time: dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              duration: r.duration_s != null ? `${r.duration_s}s` : '—',
              status: r.status ?? 'unreviewed',
            };
          })
        );
        setUsingMock(false);
      } else {
        setRecordings(MOCK_RECORDINGS);
        setUsingMock(true);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function markReviewed(id: string) {
    // Optimistic update
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'reviewed' } : r))
    );
    // Persist only for real rows
    if (!usingMock) {
      await supabase
        .from('ecg_recordings')
        .update({ status: 'reviewed' })
        .eq('id', id);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-5">
        <Link
          href={`/dashboard/patients/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#9B96C0] hover:text-[#F5F0FF] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to patient
        </Link>
      </div>

      {/* Banner — mock only when no real data from DB */}
      {usingMock && !loading && (
        <div className="flex items-start gap-3 bg-[rgba(244,184,96,0.08)] border border-[#F4B860]/30 rounded-2xl px-5 py-4 mb-6">
          <svg className="w-5 h-5 text-[#F4B860] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[#F4B860] text-sm font-semibold">
            No recordings yet — showing example data. Real strips will appear here once the Mojo Strap is paired.
          </p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F0FF]">ECG Recordings</h1>
        <p className="text-[#9B96C0] text-sm mt-1">
          Review wrist ECG strips captured by the Mojo Strap.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[#9B96C0] text-sm">Loading recordings…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recordings.map((rec) => (
            <EcgCard key={rec.id} recording={rec} onMarkReviewed={markReviewed} />
          ))}
        </div>
      )}
    </div>
  );
}
