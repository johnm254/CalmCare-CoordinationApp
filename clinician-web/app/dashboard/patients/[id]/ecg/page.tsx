'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../../../../../lib/supabase-browser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EcgRecording {
  id: string;
  recorded_at: string;
  duration_s: number | null;
  avg_hr: number | null;
  quality_result: string | null;
  reviewed_at: string | null;
  reviewer_note: string | null;
  raw_data: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function QualityBadge({ quality }: { quality: string | null }) {
  if (quality === 'saved' || quality === 'good')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(34,200,122,0.10)] text-[#22C87A] border border-[#22C87A]/20">
        Good quality
      </span>
    );
  if (quality === 'signal_weak')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(244,184,96,0.10)] text-[#F4B860] border border-[#F4B860]/20">
        Signal weak
      </span>
    );
  if (quality === 'contact_lost')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(239,68,68,0.10)] text-[#EF4444] border border-[#EF4444]/20">
        Contact lost
      </span>
    );
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1C1A35] text-[#9B96C0] border border-[#2E2B50]">
      {quality ?? 'Unknown'}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-4 bg-[#2E2B50] rounded w-40" />
            <div className="h-6 bg-[#2E2B50] rounded w-20" />
          </div>
          <div className="h-24 bg-[#1C1A35] rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ECG Waveform placeholder
// ---------------------------------------------------------------------------

function EcgWaveform({ zoom, rawData }: { zoom: number; rawData: unknown }) {
  // If rawData is an array of numbers, use it; otherwise draw a placeholder sine-like wave
  const width = Math.round(600 * zoom);
  const height = 120;

  // Grid: vertical line every 20px (0.2s at 25mm/s), horizontal at 1mV intervals (30px)
  const gridVLines: number[] = [];
  for (let x = 0; x <= width; x += Math.round(20 * zoom)) gridVLines.push(x);
  const gridHLines: number[] = [];
  for (let y = 0; y <= height; y += 30) gridHLines.push(y);

  // Generate a plausible ECG-like path
  function generatePath(): string {
    const points: string[] = [];
    const baseline = height / 2;
    const pts = Math.round(width / (2 * zoom));

    for (let i = 0; i < pts; i++) {
      const x = (i / pts) * width;
      const phase = (i / pts) * Math.PI * 2 * 8; // ~8 beats across strip

      // Simple QRS-like approximation: mostly flat, spike at regular intervals
      const beatPhase = phase % (Math.PI * 2);
      let y = baseline;

      if (beatPhase < 0.2) {
        // P wave
        y = baseline - 8 * Math.sin(beatPhase * Math.PI / 0.2);
      } else if (beatPhase > 0.4 && beatPhase < 0.45) {
        // Q dip
        y = baseline + 10;
      } else if (beatPhase > 0.45 && beatPhase < 0.55) {
        // R spike
        y = baseline - 45 * Math.sin(((beatPhase - 0.45) / 0.1) * Math.PI);
      } else if (beatPhase > 0.55 && beatPhase < 0.6) {
        // S dip
        y = baseline + 8;
      } else if (beatPhase > 0.7 && beatPhase < 1.1) {
        // T wave
        y = baseline - 14 * Math.sin(((beatPhase - 0.7) / 0.4) * Math.PI);
      }

      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  }

  const hasRealData = Array.isArray(rawData) && rawData.length > 0;

  function buildRealPath(): string {
    if (!hasRealData) return '';
    const arr = rawData as number[];
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    return arr
      .map((v, i) => {
        const x = (i / arr.length) * width;
        const y = height - ((v - min) / range) * (height - 10) - 5;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const pathD = hasRealData ? buildRealPath() : generatePath();

  return (
    <div className="overflow-x-auto rounded-xl bg-[#09090F] border border-[#2E2B50]">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        aria-label="ECG waveform strip"
      >
        {/* Grid lines */}
        {gridVLines.map((x) => (
          <line
            key={`v${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke="#1C1A35"
            strokeWidth={x % (Math.round(100 * zoom)) === 0 ? 1 : 0.5}
          />
        ))}
        {gridHLines.map((y) => (
          <line
            key={`h${y}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="#1C1A35"
            strokeWidth={y === 60 ? 1 : 0.5}
          />
        ))}
        {/* Waveform */}
        <path d={pathD} fill="none" stroke="#22C87A" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {!hasRealData && (
          <text x={8} y={12} fill="#504C78" fontSize={9} fontFamily="monospace">
            25mm/s · placeholder waveform
          </text>
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ECG Recording card
// ---------------------------------------------------------------------------

function EcgCard({
  recording,
  patientId,
  onRefresh,
}: {
  recording: EcgRecording;
  patientId: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [zoom, setZoom] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [noteText, setNoteText] = useState(recording.reviewer_note ?? '');
  const [saving, setSaving] = useState(false);

  async function markReviewed() {
    setSaving(true);
    await supabase
      .from('ecg_recordings')
      .update({
        reviewed_at: new Date().toISOString(),
        reviewer_note: noteText,
      })
      .eq('id', recording.id);
    setSaving(false);
    setReviewOpen(false);
    onRefresh();
  }

  return (
    <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[#F5F0FF] font-semibold text-sm">{fmtTime(recording.recorded_at)}</p>
            <QualityBadge quality={recording.quality_result} />
            {recording.reviewed_at && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] border border-[#8B5CF6]/20">
                Reviewed
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            {recording.avg_hr !== null && (
              <span className="text-[#9B96C0] text-xs">
                Avg HR:{' '}
                <span className="text-[#F5F0FF] font-bold">{recording.avg_hr} bpm</span>
              </span>
            )}
            {recording.duration_s !== null && (
              <span className="text-[#9B96C0] text-xs">
                Duration:{' '}
                <span className="text-[#F5F0FF] font-bold">{recording.duration_s}s</span>
              </span>
            )}
          </div>
          {recording.reviewer_note && !reviewOpen && (
            <p className="text-[#9B96C0] text-xs mt-1.5 italic">
              Note: {recording.reviewer_note}
            </p>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1C1A35] border border-[#2E2B50] text-[#9B96C0] hover:text-[#F5F0FF] hover:border-[#504C78] transition-colors text-lg leading-none"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="text-[#504C78] text-xs w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1C1A35] border border-[#2E2B50] text-[#9B96C0] hover:text-[#F5F0FF] hover:border-[#504C78] transition-colors text-lg leading-none"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {/* Waveform */}
      <EcgWaveform zoom={zoom} rawData={recording.raw_data} />

      {/* Mark reviewed */}
      {!recording.reviewed_at && (
        <div className="mt-4">
          {!reviewOpen ? (
            <button
              onClick={() => setReviewOpen(true)}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-[rgba(139,92,246,0.10)] text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[rgba(139,92,246,0.20)] transition-colors"
            >
              Mark reviewed
            </button>
          ) : (
            <div>
              <textarea
                className="w-full bg-[#09090F] border border-[#2E2B50] rounded-xl px-3 py-2 text-[#F5F0FF] text-sm placeholder:text-[#504C78] focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 resize-none"
                rows={3}
                placeholder="Optional reviewer note (e.g. 'Normal sinus rhythm, no concerning features')…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={markReviewed}
                  disabled={saving}
                  className="bg-[#8B5CF6] text-[#09090F] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Confirm review'}
                </button>
                <button
                  onClick={() => setReviewOpen(false)}
                  className="text-[#9B96C0] text-xs hover:text-[#F5F0FF] transition-colors px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function EcgPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [recordings, setRecordings] = useState<EcgRecording[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ecg_recordings')
      .select('id, recorded_at, duration_s, avg_hr, quality_result, reviewed_at, reviewer_note, raw_data')
      .eq('patient_id', params.id)
      .order('recorded_at', { ascending: false })
      .limit(20);
    setRecordings((data ?? []) as EcgRecording[]);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  return (
    <div className="p-8">
      {/* Disclaimer */}
      <div className="bg-[rgba(244,184,96,0.08)] border border-[#F4B860]/25 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-[#F4B860] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-[#F4B860] text-sm font-medium leading-snug">
          A wrist ECG is a rhythm check, not a replacement for a hospital ECG.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F0FF]">ECG Recordings</h1>
          <p className="text-[#9B96C0] text-sm mt-1">
            Review wrist ECG strips captured by this patient.
          </p>
        </div>
        <button
          onClick={fetchRecordings}
          className="flex items-center gap-2 text-sm text-[#9B96C0] hover:text-[#F5F0FF] transition-colors bg-[#14122A] border border-[#2E2B50] rounded-xl px-4 py-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <Skeleton />
      ) : recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-[rgba(139,92,246,0.10)] flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <p className="text-[#F5F0FF] font-semibold text-base">No ECG recordings</p>
          <p className="text-[#9B96C0] text-sm mt-1">
            This patient has not recorded any ECG strips yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {recordings.map((rec) => (
            <EcgCard
              key={rec.id}
              recording={rec}
              patientId={params.id}
              onRefresh={fetchRecordings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
