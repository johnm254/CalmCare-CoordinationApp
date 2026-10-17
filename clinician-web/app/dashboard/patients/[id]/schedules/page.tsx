import { notFound } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase-server';
import { logAccess } from '../../../../../lib/audit';
import ScheduleEditor from './ScheduleEditor';

export default async function SchedulesPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify clinician link
  const { data: link } = await supabase
    .from('clinician_links')
    .select('id')
    .eq('clinician_id', user!.id)
    .eq('patient_id', params.id)
    .not('verified_at', 'is', null)
    .single();

  if (!link) notFound();

  // Audit log
  await logAccess(supabase, params.id, 'viewed_schedules', 'medication_schedules');

  // Fetch medications with their schedules
  const { data: medications } = await supabase
    .from('medications')
    .select('id, name, dose, form, strength, active')
    .eq('patient_id', params.id)
    .eq('active', true)
    .order('name');

  const meds = medications ?? [];

  // Fetch schedules for these medications
  const medIds = meds.map((m: any) => m.id);
  const { data: schedules } = medIds.length > 0
    ? await supabase
        .from('medication_schedules')
        .select('*')
        .in('medication_id', medIds)
    : { data: [] };

  const schedulesMap: Record<string, any> = {};
  (schedules ?? []).forEach((s: any) => {
    schedulesMap[s.medication_id] = s;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F5F0FF] mb-1">Medication schedules</h1>
        <p className="text-[#9B96C0] text-sm">
          Set when and how each medication should be taken. Patients cannot change their dose.
        </p>
      </div>

      {/* Clinician responsibility note */}
      <div className="bg-[rgba(139,92,246,0.05)] border border-[#8B5CF6]/20 rounded-xl px-5 py-4 mb-7 flex items-start gap-3">
        <svg className="w-4 h-4 text-[#8B5CF6] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-[#8B5CF6] text-xs font-semibold mb-0.5">Clinician responsibility</p>
          <p className="text-[#9B96C0] text-xs leading-relaxed">
            Duara never changes a patient's dose. All schedules are set exclusively by the prescribing clinician.
            Patients receive reminders but cannot modify dose amounts.
          </p>
        </div>
      </div>

      {meds.length === 0 ? (
        <div className="bg-[#14122A] border border-[#2E2B50] rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#1C1A35] border border-[#2E2B50] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#504C78]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-[#F5F0FF] font-semibold text-sm mb-1">No active medications</p>
          <p className="text-[#9B96C0] text-xs">Add medications to this patient before configuring schedules.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {meds.map((med: any) => (
            <ScheduleEditor
              key={med.id}
              medication={med}
              initialSchedule={schedulesMap[med.id] ?? null}
              patientId={params.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
