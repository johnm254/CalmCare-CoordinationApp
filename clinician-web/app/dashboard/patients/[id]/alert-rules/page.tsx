import { notFound } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase-server';
import { logAccess } from '../../../../../lib/audit';
import RuleEditor from './RuleEditor';

export default async function AlertRulesPage({ params }: { params: { id: string } }) {
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

  await logAccess(supabase, params.id, 'viewed_alert_rules', 'alert_rules');

  const { data: rules } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('patient_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F5F0FF] mb-1">Alert rules</h1>
        <p className="text-[#9B96C0] text-sm">
          Define thresholds that trigger alerts when a patient's readings fall outside safe ranges.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-[rgba(244,184,96,0.05)] border border-[#F4B860]/20 rounded-xl px-5 py-4 mb-7 flex items-start gap-3">
        <svg className="w-4 h-4 text-[#F4B860] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-[#9B96C0] text-xs leading-relaxed">
          These limits are guidelines only. A triggered alert does not constitute automated treatment.
          Alerts notify the care team so a clinician can assess and respond appropriately.
        </p>
      </div>

      <RuleEditor patientId={params.id} initialRules={rules ?? []} />
    </div>
  );
}
