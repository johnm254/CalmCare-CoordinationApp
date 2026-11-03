'use client';

import { useState } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecordingStatus = 'unreviewed' | 'reviewed';

interface EcgRecording {
  id: string;
  date: string;
  time: string;
  duration: string;
  status: RecordingStatus;
}

// ---------------------------------------------------------------------------
// Mock fallback — used when no real recordings are in the DB yet
// ---------------------------------------------------------------------------

const MOCK_RECORDINGS: EcgRecording[] = [
  { id: 'ecg-1', date: '2 Nov 2026',  time: '08:47', duration: '30s', status: 'unreviewed' },
  { id: 'ecg-2', date: '1 Nov 2026',  time: '21:14', duration: '45s', status: 'reviewed'   },
  { id: 'ecg-3', date: '30 Oct 2026', time: '14:55', duration: '30s', status: 'reviewed'   },
  { id: 'ecg-4', date: '28 Oct 2026', time: '09:02', duration: '20s', status: 'unreviewed' },
  { id: 'ecg-5', date: '25 Oct 2026', time: '16:33', duration: '45s', status: 'reviewed'   },
];

// ---------------------------------------------------------------------------
// ECG SVG waveform — variant seeds produce distinct-looking strips
// ---------------------------------------------------------------------------

function EcgSvg({ variant = 0 }: { variant?: number }) {
  const width = 600;
  const height = 120;
  const baseline = 65;

  const minorStep = 20;
  const majorStep = 100;

  const vLines: number[] = [];
  for (let x = 0; x <= width; x += minorStep) vLines.push(x);
  const hLines: number[] = [];
  for (let y = 0; y <= height; y += minorStep) hLines.push(y);

  // Each variant tweaks the QRS spike height, P-wave, and T-wave
  const variants = [
    { qrs: -45, pWave: -8, tWave: -14, noise: 0 },
    { qrs: -38, pWave: -5, tWave: -18, noise: 2 },
    { qrs: -52, pWave: -10, tWave: -10, noise: -1 },
    { qrs: -42, pWave: -6, tWave: -16, noise: 1 },
  ];
  const v = variants[variant % variants.length];

  function beat(startX: number): string {
    const s = startX;
    const n = v.noise;
    return (
      `L ${s} ${baseline + n} ` +
      `L ${s + 8} ${baseline + v.pWave} L ${s + 16} ${baseline + n} ` +
      `L ${s + 24} ${baseline + n} ` +
      `L ${s + 26} ${baseline + 10} ` +
      `L ${s + 32} ${baseline + v.qrs} ` +
      `L ${s + 38} ${baseline + 8} ` +
      `L ${s + 48} ${baseline + n} ` +
      `L ${s + 58} ${baseline + v.tWave} L ${s + 72} ${baseline + n} ` +
      `L ${s + 100} ${baseline}`
    );
  }

  const path =
    `M 0 ${baseline} L 20 ${baseline}` +
    beat(20) + beat(120) + beat(220) + beat(320) + beat(420) +
    `L ${width} ${baseline}`;

  // HR derived from variant for label realism
  const hr = [72, 68, 81, 75][variant % 4];

  return (
    <div className="overflow-x-auto rounded-xl bg-[#F6F9FC] border border-[#E6ECF2]">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        aria-label="ECG waveform strip"
      >
        {vLines.map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height}
            stroke="#F1F5FA" strokeWidth={x % majorStep === 0 ? 1 : 0.4} />
        ))}
        {hLines.map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y}
            stroke="#F1F5FA" strokeWidth={y % majorStep === 0 ? 1 : 0.4} />
        ))}
        <path d={path} fill="none" stroke="#22C87A" strokeWidth={1.8}
          strokeLinecap="round" strokeLinejoin="round" />
        <text x={8} y={12} fill="#8C9AAB" fontSize={9} fontFamily="monospace">
          25mm/s · {hr} bpm · Lead II
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
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(0,217,126,0.10)] text-[#22C87A] border border-[#22C87A]/20">
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
    <div className="bg-[#FFFFFF] border border-[#E6ECF2] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[#0F1B2D] font-semibold text-sm">
            {recording.date} · {recording.time}
          </p>
          <span className="text-[#8C9AAB] text-xs">Duration: {recording.duration}</span>
          <StatusBadge status={recording.status} />
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-[#F1F5FA] border border-[#E6ECF2] text-[#5B6B7F] hover:text-[#0F1B2D] hover:border-[#8C9AAB] transition-colors flex-shrink-0"
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
        <div className="px-6 pb-6 border-t border-[#E6ECF2] pt-4">
          <EcgSvg variant={MOCK_RECORDINGS.findIndex(r => r.id === recording.id)} />
          {recording.status === 'unreviewed' && (
            <div className="mt-4">
              <button
                onClick={() => onMarkReviewed(recording.id)}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-[rgba(0,217,126,0.12)] text-[#22C87A] border border-[#22C87A]/25 hover:bg-[rgba(0,217,126,0.22)] transition-colors"
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
  const [recordings, setRecordings] = useState<EcgRecording[]>(MOCK_RECORDINGS);

  function markReviewed(id: string) {
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'reviewed' } : r))
    );
  }

  return (
    <div className="p-8">
      <div className="mb-5">
        <Link
          href={`/dashboard/patients/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#5B6B7F] hover:text-[#0F1B2D] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to patient
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F1B2D]">ECG Recordings</h1>
        <p className="text-[#5B6B7F] text-sm mt-1">
          Review wrist ECG strips captured by the Mojo Strap.
        </p>
      </div>

      <div className="space-y-4">
        {recordings.map((rec) => (
          <EcgCard key={rec.id} recording={rec} onMarkReviewed={markReviewed} />
        ))}
      </div>
    </div>
  );
}
