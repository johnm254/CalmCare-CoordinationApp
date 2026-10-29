import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rtlhckntjrhdhbaqzxoy.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY env var first (never commit this key)');
  process.exit(1);
}
const CLINICIAN_ID = '3cb5fe51-d813-461d-a394-acd1a782d26f';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const now = Date.now();
const days = (n) => new Date(now - n * 86400000).toISOString();
const hrs = (n) => new Date(now - n * 3600000).toISOString();

// ─── Patient definitions ────────────────────────────────────────────────────
const PATIENTS = [
  {
    email: 'amina@patient.epi',
    password: 'Patient123!',
    full_name: 'Amina Wanjiku',
    events: [
      { event_type: 'seizure', severity: 'moderate', occurred_at: hrs(10), details: { duration_sec: 45, postictal: 'yes', location: 'home' } },
      { event_type: 'seizure', severity: 'mild',     occurred_at: days(3),  details: { duration_sec: 20, postictal: 'no',  location: 'work' } },
      { event_type: 'missed_dose', severity: null,   occurred_at: days(1),  details: { medication: 'Levetiracetam', scheduled_time: '08:00' } },
    ],
    medications: [
      { name: 'Levetiracetam', dose: '500mg', schedule: { time: '08:00', frequency: 'twice daily' }, active: true },
      { name: 'Sodium Valproate', dose: '200mg', schedule: { time: '20:00', frequency: 'once daily' }, active: true },
    ],
    followups: [
      { title: 'Review seizure frequency — two events this week', due_at: new Date(now + 3 * 86400000).toISOString() },
      { title: 'Check Levetiracetam adherence and side effects', due_at: new Date(now + 7 * 86400000).toISOString() },
    ],
  },
  {
    email: 'david@patient.epi',
    password: 'Patient123!',
    full_name: 'David Ochieng',
    events: [
      { event_type: 'missed_dose', severity: null, occurred_at: days(2), details: { medication: 'Carbamazepine', scheduled_time: '07:00' } },
      { event_type: 'missed_dose', severity: null, occurred_at: days(4), details: { medication: 'Carbamazepine', scheduled_time: '07:00' } },
      { event_type: 'observation', severity: 'mild', occurred_at: days(5), details: { note: 'Reported headache and dizziness' } },
    ],
    medications: [
      { name: 'Carbamazepine', dose: '200mg', schedule: { time: '07:00', frequency: 'twice daily' }, active: true },
    ],
    followups: [
      { title: 'Medication adherence check — 2 missed doses this week', due_at: new Date(now + 5 * 86400000).toISOString() },
    ],
  },
  {
    email: 'sarah@patient.epi',
    password: 'Patient123!',
    full_name: 'Sarah Muthoni',
    events: [
      { event_type: 'seizure', severity: 'severe', occurred_at: hrs(36), details: { duration_sec: 90, postictal: 'yes', triggered_by: 'sleep deprivation' } },
      { event_type: 'observation', severity: null, occurred_at: hrs(30), details: { note: 'Patient resting, vitals stable after episode' } },
    ],
    medications: [
      { name: 'Phenytoin',     dose: '100mg', schedule: { time: '08:00', frequency: 'once daily' }, active: true },
      { name: 'Valproic Acid', dose: '250mg', schedule: { time: '08:00', frequency: 'twice daily' }, active: true },
    ],
    followups: [
      { title: 'Urgent: severe seizure 36h ago — schedule consult', due_at: new Date(now + 1 * 86400000).toISOString() },
      { title: 'Review Phenytoin levels — blood test required', due_at: new Date(now + 14 * 86400000).toISOString() },
    ],
  },
];

async function seed() {
  console.log('Seeding mock data…\n');

  for (const patient of PATIENTS) {
    process.stdout.write(`Creating patient: ${patient.full_name}… `);

    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: patient.email,
      password: patient.password,
      email_confirm: true,
      user_metadata: { role: 'patient', full_name: patient.full_name },
    });

    if (authErr) {
      if (authErr.message.includes('already been registered') || authErr.message.includes('already exists')) {
        // Find existing user id
        const { data: existingList } = await supabase.auth.admin.listUsers();
        const existing = existingList?.users?.find((u) => u.email === patient.email);
        if (!existing) { console.log('SKIP (could not find existing)'); continue; }
        authData.user = existing;
        console.log('(already exists, updating)');
      } else {
        console.log('ERROR:', authErr.message);
        continue;
      }
    } else {
      console.log('created');
    }

    const pid = authData.user.id;

    // Update profile full_name + role
    await supabase.from('profiles').upsert({ id: pid, full_name: patient.full_name, role: 'patient', email: patient.email });

    // Link to clinician (verified)
    await supabase.from('clinician_links').upsert({
      clinician_id: CLINICIAN_ID,
      patient_id: pid,
      verified_at: days(30),
    }, { onConflict: 'clinician_id,patient_id' });

    // Insert events
    if (patient.events.length > 0) {
      await supabase.from('events').insert(
        patient.events.map((e) => ({ ...e, patient_id: pid, logged_by: pid }))
      );
    }

    // Insert medications
    if (patient.medications.length > 0) {
      await supabase.from('medications').insert(
        patient.medications.map((m) => ({ ...m, patient_id: pid }))
      );
    }

    // Insert follow-ups
    if (patient.followups.length > 0) {
      await supabase.from('followups').insert(
        patient.followups.map((f) => ({ ...f, patient_id: pid, clinician_id: CLINICIAN_ID, status: 'open' }))
      );
    }

    console.log(`  ✓ ${patient.events.length} events, ${patient.medications.length} meds, ${patient.followups.length} follow-ups`);
  }

  // Verify counts
  const [{ count: pts }, { count: evts }, { count: meds }, { count: fups }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('medications').select('*', { count: 'exact', head: true }),
    supabase.from('followups').select('*', { count: 'exact', head: true }),
  ]);

  console.log('\n── Summary ────────────────────────────');
  console.log(`Patients:    ${pts}`);
  console.log(`Events:      ${evts}`);
  console.log(`Medications: ${meds}`);
  console.log(`Follow-ups:  ${fups}`);
  console.log('───────────────────────────────────────');
  console.log('\nDone. Log in as doctor@epi.app to see the data.');
}

seed().catch(console.error);
