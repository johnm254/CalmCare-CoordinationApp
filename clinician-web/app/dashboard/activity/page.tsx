import { createClient } from '../../../lib/supabase-server';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

type FeedItem = {
  id: string;
  type: 'sos' | 'event' | 'other';
  patientName: string;
  patientId: string;
  label: string;
  detail?: string;
  at: string;
};

export default async function ActivityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get linked patient IDs
  const { data: links } = await supabase
    .from('clinician_links')
    .select('patient_id, profiles!clinician_links_patient_id_fkey(full_name)')
    .eq('clinician_id', user!.id)
    .not('verified_at', 'is', null);

  const patientIds = (links ?? []).map((l: any) => l.patient_id);
  const patientNameMap: Record<string, string> = {};
  (links ?? []).forEach((l: any) => {
    patientNameMap[l.patient_id] = l.profiles?.full_name ?? 'Unknown';
  });

  let feed: FeedItem[] = [];

  if (patientIds.length) {
    // Fetch SOS events
    const { data: sosEvents } = await supabase
      .from('sos_events')
      .select('id, patient_id, created_at, resolved_at')
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false })
      .limit(30);

    // Fetch regular events
    const { data: events } = await supabase
      .from('events')
      .select('id, patient_id, occurred_at, event_type, severity, notes')
      .in('patient_id', patientIds)
      .order('occurred_at', { ascending: false })
      .limit(50);

    const sosItems: FeedItem[] = (sosEvents ?? []).map((s: any) => ({
      id: `sos-${s.id}`,
      type: 'sos',
      patientName: patientNameMap[s.patient_id] ?? 'Unknown',
      patientId: s.patient_id,
      label: 'SOS Alert triggered',
      detail: s.resolved_at ? 'Resolved' : 'Active',
      at: s.created_at,
    }));

    const eventItems: FeedItem[] = (events ?? []).map((e: any) => {
      const isSeizure = (e.event_type ?? '').toLowerCase().includes('seizure') || (e.severity ?? '') === 'high';
      return {
        id: `evt-${e.id}`,
        type: isSeizure ? 'event' : 'other',
        patientName: patientNameMap[e.patient_id] ?? 'Unknown',
        patientId: e.patient_id,
        label: e.event_type ? `${e.event_type} logged` : 'Event logged',
        detail: e.severity ? `Severity: ${e.severity}` : e.notes ?? '',
        at: e.occurred_at,
      };
    });

    feed = [...sosItems, ...eventItems].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F5F0FF]">Activity feed</h1>
        <p className="text-[#9B96C0] text-sm mt-1">
          SOS alerts and events from your linked patients, sorted by newest first.
        </p>
      </div>

      {feed.length === 0 ? (
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-[#1C1A35] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#504C78]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#9B96C0] font-medium">No activity yet.</p>
          <p className="text-[#504C78] text-xs mt-1">Events will appear here as your patients use the app.</p>
        </div>
      ) : (
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-6">
          <div className="space-y-0">
            {feed.map((item, i) => {
              const isSOS = item.type === 'sos';
              const isSeizure = item.type === 'event';

              const dotColor = isSOS ? 'bg-[#EF4444]' : isSeizure ? 'bg-[#F4B860]' : 'bg-[#8B5CF6]';
              const ringColor = isSOS ? 'bg-[rgba(239,68,68,0.15)]' : isSeizure ? 'bg-[rgba(244,184,96,0.15)]' : 'bg-[rgba(139,92,246,0.12)]';

              return (
                <div key={item.id} className="flex gap-4 pb-5 relative">
                  {/* Vertical timeline line */}
                  {i < feed.length - 1 && (
                    <div className="absolute left-4 top-9 bottom-0 w-px bg-[#2E2B50]" />
                  )}

                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-8 h-8 rounded-full ${ringColor} flex items-center justify-center`}>
                      <div className={`w-3 h-3 rounded-full ${dotColor}`} />
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`flex-1 rounded-xl p-4 border ${isSOS ? 'border-[#EF4444]/25 bg-[rgba(239,68,68,0.05)]' : 'border-[#2E2B50] bg-[#1C1A35]'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* SOS badge */}
                        {isSOS && (
                          <span className="inline-flex items-center gap-1 bg-[#EF4444] text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-2">
                            SOS
                          </span>
                        )}
                        {/* Event type badge */}
                        {!isSOS && (
                          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${
                            isSeizure
                              ? 'bg-[rgba(244,184,96,0.15)] text-[#F4B860]'
                              : 'bg-[rgba(139,92,246,0.12)] text-[#8B5CF6]'
                          }`}>
                            {isSeizure ? 'Seizure' : 'Event'}
                          </span>
                        )}
                        <p className="text-[#F5F0FF] text-sm font-semibold">{item.label}</p>
                        <p className="text-[#9B96C0] text-xs mt-0.5">
                          Patient:{' '}
                          <span className="font-semibold text-[#F5F0FF]">{item.patientName}</span>
                        </p>
                        {item.detail && (
                          <p className={`text-xs mt-1 ${isSOS && item.detail === 'Active' ? 'text-[#EF4444] font-semibold' : 'text-[#504C78]'}`}>
                            {item.detail}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[#504C78] text-xs">{timeAgo(item.at)}</p>
                        <p className="text-[#504C78] text-xs mt-0.5">{formatTime(item.at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
