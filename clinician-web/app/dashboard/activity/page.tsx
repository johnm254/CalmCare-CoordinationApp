import { createClient } from '../../../lib/supabase-server';

const TYPE_DOT: Record<string, string> = {
  events:      'bg-[#4FC3B7]',
  medications: 'bg-[#F4B860]',
  brief:       'bg-[#A8BDCA]',
  followups:   'bg-purple-400',
};

const TYPE_RING: Record<string, string> = {
  events:      'bg-[#4FC3B7]/15',
  medications: 'bg-[#F4B860]/15',
  brief:       'bg-[#A8BDCA]/15',
  followups:   'bg-purple-400/15',
};

const TYPE_COLOR: Record<string, string> = {
  events:      'text-[#4FC3B7]',
  medications: 'text-[#F4B860]',
  brief:       'text-[#A8BDCA]',
  followups:   'text-purple-400',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function ActivityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: log } = await supabase
    .from('audit_log')
    .select('*, actor:actor_id(full_name), patient:patient_id(full_name)')
    .eq('actor_id', user!.id)
    .order('at', { ascending: false })
    .limit(50);

  const entries = log ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#EAF2F6]">Activity log</h1>
        <p className="text-[#A8BDCA] text-sm mt-1">
          Every view of patient data is recorded here. Patients can see this log.
        </p>
      </div>

      <div className="bg-[#112230] border border-[#1E3A52] rounded-2xl p-6">
        {entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[#A8BDCA] text-sm">No activity recorded yet.</p>
            <p className="text-[#4F6D84] text-xs mt-1">Entries appear here as you view patient data.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {entries.map((entry: any, i: number) => (
              <div key={entry.id} className="flex gap-4 pb-6 relative">
                {i < entries.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-[#1E3A52]" />
                )}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-8 h-8 rounded-full ${TYPE_RING[entry.resource_type] ?? 'bg-[#A8BDCA]/15'} flex items-center justify-center`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${TYPE_DOT[entry.resource_type] ?? 'bg-[#A8BDCA]'}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#EAF2F6] text-sm font-medium">{entry.action}</p>
                      <p className="text-[#A8BDCA] text-xs mt-0.5">
                        {(entry.actor as any)?.full_name ?? 'You'} ·{' '}
                        <span className={`font-semibold ${TYPE_COLOR[entry.resource_type] ?? 'text-[#A8BDCA]'}`}>
                          {(entry.patient as any)?.full_name ?? 'Patient'}
                        </span>
                      </p>
                    </div>
                    <span className="text-[#4F6D84] text-xs flex-shrink-0 ml-4">{timeAgo(entry.at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[#4F6D84] text-xs text-center mt-6">
        Patients can see this log. This ensures full transparency with your care team.
      </p>
    </div>
  );
}
