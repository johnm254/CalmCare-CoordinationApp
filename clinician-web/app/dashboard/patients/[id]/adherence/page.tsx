import { notFound } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase-server';
import { logAccess } from '../../../../../lib/audit';
import ExportCsvButton from './ExportCsvButton';

interface DoseEvent {
  id: string;
  medication_id: string;
  status: string; // 'taken' | 'missed' | 'snoozed'
  scheduled_for: string;
  taken_at?: string;
}

interface MedSummary {
  id: string;
  name: string;
  scheduled: number;
  takenOnTime: number;
  missed: number;
  snoozed: number;
  adherencePct: number;
}

function buildMedSummaries(
  medications: { id: string; name: string }[],
  events: DoseEvent[]
): MedSummary[] {
  return medications.map((med) => {
    const medEvents = events.filter((e) => e.medication_id === med.id);
    const scheduled = medEvents.length;
    const takenOnTime = medEvents.filter((e) => e.status === 'taken').length;
    const missed = medEvents.filter((e) => e.status === 'missed').length;
    const snoozed = medEvents.filter((e) => e.status === 'snoozed').length;
    const adherencePct = scheduled > 0 ? Math.round((takenOnTime / scheduled) * 100) : 0;
    return { id: med.id, name: med.name, scheduled, takenOnTime, missed, snoozed, adherencePct };
  });
}

function buildHourlyMissed(events: DoseEvent[]): { hour: number; count: number }[] {
  const counts: Record<number, number> = {};
  events
    .filter((e) => e.status === 'missed')
    .forEach((e) => {
      const hour = new Date(e.scheduled_for).getHours();
      counts[hour] = (counts[hour] ?? 0) + 1;
    });
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: counts[h] ?? 0 }));
}

function AdherenceBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-[#0F2040] rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[#EAF4FF] font-bold text-sm w-10 text-right">{pct}%</span>
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const barWidth = 14;
  const chartHeight = 60;
  const totalWidth = data.length * (barWidth + 4);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalWidth} ${chartHeight + 20}`}
        style={{ width: totalWidth, height: chartHeight + 20 }}
        role="img"
        aria-label="Hourly missed dose chart"
      >
        {data.map((d, i) => {
          const barH = d.count > 0 ? Math.max(3, Math.round((d.count / max) * chartHeight)) : 0;
          const x = i * (barWidth + 4);
          const y = chartHeight - barH;
          return (
            <g key={d.hour}>
              {d.count > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="2"
                  fill={d.count >= 3 ? '#EF4444' : '#F4B860'}
                  opacity="0.8"
                />
              )}
              {d.count === 0 && (
                <rect x={x} y={chartHeight - 2} width={barWidth} height={2} rx="1" fill="#1A3265" />
              )}
              {/* Hour label every 4 hours */}
              {d.hour % 4 === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#3D5C80"
                >
                  {d.hour.toString().padStart(2, '0')}h
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default async function AdherencePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: link } = await supabase
    .from('clinician_links')
    .select('id')
    .eq('clinician_id', user!.id)
    .eq('patient_id', params.id)
    .not('verified_at', 'is', null)
    .single();

  if (!link) notFound();

  await logAccess(supabase, params.id, 'viewed_adherence', 'dose_events');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [medsRes, eventsRes] = await Promise.all([
    supabase
      .from('medications')
      .select('id, name')
      .eq('patient_id', params.id)
      .eq('active', true),
    supabase
      .from('dose_events')
      .select('id, medication_id, status, scheduled_for, taken_at')
      .eq('patient_id', params.id)
      .gte('scheduled_for', thirtyDaysAgo),
  ]);

  const medications = medsRes.data ?? [];
  const events: DoseEvent[] = eventsRes.data ?? [];

  const summaries = buildMedSummaries(medications, events);

  const totalScheduled = summaries.reduce((s, m) => s + m.scheduled, 0);
  const totalTaken = summaries.reduce((s, m) => s + m.takenOnTime, 0);
  const overallPct = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

  const hourlyData = buildHourlyMissed(events);
  const topMissedHour = hourlyData.reduce((best, d) => (d.count > best.count ? d : best), { hour: 0, count: 0 });

  const csvRows = [
    ['Medication', 'Scheduled', 'Taken on time', 'Missed', 'Snoozed', 'Adherence %'],
    ...summaries.map((m) => [
      m.name,
      m.scheduled.toString(),
      m.takenOnTime.toString(),
      m.missed.toString(),
      m.snoozed.toString(),
      m.adherencePct.toString(),
    ]),
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EAF4FF] mb-1">Adherence</h1>
          <p className="text-[#7AAAC8] text-sm">Last 30 days — dose-taking summary for all active medications.</p>
        </div>
        <ExportCsvButton rows={csvRows} filename={`adherence-${params.id}.csv`} />
      </div>

      {/* Overall summary card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-5 col-span-2 md:col-span-1">
          <p className="text-[#3D5C80] text-xs font-semibold uppercase tracking-wider mb-1">Overall adherence</p>
          <p
            className="text-4xl font-black mb-0.5"
            style={{ color: overallPct >= 80 ? '#22C87A' : overallPct >= 60 ? '#F4B860' : '#EF4444' }}
          >
            {overallPct}%
          </p>
          <p className="text-[#3D5C80] text-xs">last 30 days</p>
        </div>
        <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-5">
          <p className="text-[#3D5C80] text-xs font-semibold uppercase tracking-wider mb-1">Doses scheduled</p>
          <p className="text-3xl font-black text-[#EAF4FF]">{totalScheduled}</p>
        </div>
        <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-5">
          <p className="text-[#3D5C80] text-xs font-semibold uppercase tracking-wider mb-1">Taken on time</p>
          <p className="text-3xl font-black text-[#22C87A]">{totalTaken}</p>
        </div>
        <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-5">
          <p className="text-[#3D5C80] text-xs font-semibold uppercase tracking-wider mb-1">Missed</p>
          <p className="text-3xl font-black text-[#EF4444]">
            {summaries.reduce((s, m) => s + m.missed, 0)}
          </p>
        </div>
      </div>

      {/* Per-medication table */}
      <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#1A3265]">
          <h2 className="text-[#EAF4FF] font-bold text-sm">Per medication</h2>
        </div>
        {summaries.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[#7AAAC8] text-sm">No medication data for the last 30 days.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A3265]">
                  {['Medication', 'Scheduled', 'Taken on time', 'Missed', 'Snoozed', 'Adherence'].map((h) => (
                    <th key={h} className="text-left text-[#3D5C80] text-xs font-semibold uppercase tracking-wider px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaries.map((m) => {
                  const color =
                    m.adherencePct >= 80 ? 'bg-[#22C87A]' : m.adherencePct >= 60 ? 'bg-[#F4B860]' : 'bg-[#EF4444]';
                  return (
                    <tr key={m.id} className="border-b border-[#1A3265] last:border-0 hover:bg-[#0F2040] transition-colors">
                      <td className="px-5 py-4 text-[#EAF4FF] font-semibold">{m.name}</td>
                      <td className="px-5 py-4 text-[#7AAAC8]">{m.scheduled}</td>
                      <td className="px-5 py-4 text-[#22C87A]">{m.takenOnTime}</td>
                      <td className="px-5 py-4 text-[#EF4444]">{m.missed}</td>
                      <td className="px-5 py-4 text-[#F4B860]">{m.snoozed}</td>
                      <td className="px-5 py-4 min-w-[160px]">
                        <AdherenceBar pct={m.adherencePct} colorClass={color} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Missed dose patterns */}
      <div className="bg-[#0D1B35] border border-[#1A3265] rounded-2xl p-6">
        <h2 className="text-[#EAF4FF] font-bold text-sm mb-1">Missed dose patterns</h2>
        <p className="text-[#3D5C80] text-xs mb-5">
          Bars show how many doses were missed at each hour of the day.
          {topMissedHour.count > 0 && (
            <> Most misses at <strong className="text-[#F4B860]">{topMissedHour.hour.toString().padStart(2, '0')}:00</strong> ({topMissedHour.count} dose{topMissedHour.count > 1 ? 's' : ''}).</>
          )}
        </p>
        {events.filter((e) => e.status === 'missed').length === 0 ? (
          <p className="text-[#7AAAC8] text-sm">No missed doses in the last 30 days.</p>
        ) : (
          <HourlyChart data={hourlyData} />
        )}
      </div>
    </div>
  );
}
