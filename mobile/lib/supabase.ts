import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'patient' | 'caregiver' | 'clinician' | 'admin';
};

export type Medication = {
  id: string;
  name: string;
  dose: string;
  schedule: { time: string; days: string[] };
  active: boolean;
};

export type Event = {
  id: string;
  event_type: string;
  severity: 'mild' | 'moderate' | 'severe' | null;
  occurred_at: string;
  details: Record<string, unknown>;
};

export type CareCircleMember = {
  id: string;
  member_id: string;
  full_name: string;
  relationship: string;
  is_emergency: boolean;
  phone: string | null;
};

export type GrantKey = 'emergency_alerts' | 'medication_schedule' | 'appointments' | 'event_summaries' | 'records';

export type Grant = {
  id: string;
  grantee_id: string;
  category: GrantKey;
  revoked_at: string | null;
};

export type Condition = {
  id: string;
  type: string;
  notes: string | null;
  triggered_by: string | null;
  active: boolean;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, fullName: string, role: 'patient' | 'caregiver') {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    });
  }
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', userId)
    .single();
  return data ?? null;
}

// ─── Medications ──────────────────────────────────────────────────────────────

export async function getMedications(patientId: string): Promise<Medication[]> {
  const { data } = await supabase
    .from('medications')
    .select('id, name, dose, schedule, active')
    .eq('patient_id', patientId)
    .eq('active', true)
    .order('created_at');
  return (data ?? []) as Medication[];
}

export async function logMedicationTaken(medicationId: string, patientId: string) {
  await supabase.from('medication_logs').insert({
    medication_id: medicationId,
    patient_id: patientId,
    taken_at: new Date().toISOString(),
  });
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(patientId: string, filter: 'week' | 'all'): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select('id, event_type, severity, occurred_at, details')
    .eq('patient_id', patientId)
    .order('occurred_at', { ascending: false });

  if (filter === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('occurred_at', weekAgo);
  }

  const { data } = await query.limit(50);
  return (data ?? []) as Event[];
}

export async function logEvent(
  patientId: string,
  eventType: string,
  severity: 'mild' | 'moderate' | 'severe',
  details: Record<string, unknown> = {}
) {
  await supabase.from('events').insert({
    patient_id: patientId,
    logged_by: patientId,
    event_type: eventType,
    severity,
    occurred_at: new Date().toISOString(),
    details,
  });
}

// ─── Care Circle ──────────────────────────────────────────────────────────────

export async function getCareCircle(patientId: string): Promise<CareCircleMember[]> {
  const { data } = await supabase
    .from('care_circle')
    .select('id, member_id, relationship, is_emergency, phone, profiles!care_circle_member_id_fkey(full_name)')
    .eq('patient_id', patientId)
    .order('created_at');

  return (data ?? []).map((row: any) => ({
    id: row.id,
    member_id: row.member_id,
    full_name: row.profiles?.full_name ?? 'Unknown',
    relationship: row.relationship,
    is_emergency: row.is_emergency,
    phone: row.phone,
  }));
}

export async function getGrantsForMember(patientId: string, granteeId: string): Promise<Record<GrantKey, boolean>> {
  const { data } = await supabase
    .from('grants')
    .select('category, revoked_at')
    .eq('patient_id', patientId)
    .eq('grantee_id', granteeId);

  const result: Record<GrantKey, boolean> = {
    emergency_alerts: false,
    medication_schedule: false,
    appointments: false,
    event_summaries: false,
    records: false,
  };

  for (const g of data ?? []) {
    if (g.category in result) {
      result[g.category as GrantKey] = g.revoked_at === null;
    }
  }
  return result;
}

export async function setGrant(patientId: string, granteeId: string, category: GrantKey, enabled: boolean) {
  if (enabled) {
    await supabase.from('grants').upsert(
      { patient_id: patientId, grantee_id: granteeId, category, revoked_at: null },
      { onConflict: 'patient_id,grantee_id,category' }
    );
  } else {
    await supabase
      .from('grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('patient_id', patientId)
      .eq('grantee_id', granteeId)
      .eq('category', category);
  }
}

// ─── Conditions ───────────────────────────────────────────────────────────────

export async function getConditions(patientId: string): Promise<Condition[]> {
  const { data } = await supabase
    .from('conditions')
    .select('id, type, notes, triggered_by, active')
    .eq('patient_id', patientId)
    .eq('active', true);
  return (data ?? []) as Condition[];
}

// ─── SOS ──────────────────────────────────────────────────────────────────────

export async function getEmergencyContacts(patientId: string): Promise<CareCircleMember[]> {
  const all = await getCareCircle(patientId);
  return all.filter((c) => c.is_emergency);
}

export async function addCareCircleMember(
  patientId: string,
  params: {
    displayName: string;
    phone: string;
    relationship: string;
    isEmergency: boolean;
    memberId?: string;
    smsOnly?: boolean;
  },
): Promise<void> {
  const { error } = await supabase.from('care_circle').insert({
    patient_id: patientId,
    member_id: params.memberId ?? null,
    phone: params.phone,
    display_name: params.displayName,
    relationship: params.relationship,
    is_emergency: params.isEmergency,
    sms_only: params.smsOnly ?? !params.memberId,
  });
  if (error) throw error;
}

export async function removeCareCircleMember(circleId: string): Promise<void> {
  const { error } = await supabase.from('care_circle').delete().eq('id', circleId);
  if (error) throw error;
}

export async function findProfileByEmail(email: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('email', email.toLowerCase().trim())
    .single();
  return data ?? null;
}

export async function sendSos(
  patientId: string,
  emergencyContactIds: string[],
  location?: { lat: number; lon: number } | null,
): Promise<string> {
  // Generate ID client-side so the API can reference the same row
  const { data: uuidRow } = await supabase.rpc('gen_random_uuid');
  const sosId: string = uuidRow ?? crypto.randomUUID?.() ?? `sos-${Date.now()}`;

  await supabase.from('sos_events').insert({
    id: sosId,
    patient_id: patientId,
    sent_at: new Date().toISOString(),
    channel: 'push',
    recipients: emergencyContactIds,
    status: 'sent',
    location: location ? JSON.stringify(location) : null,
  });

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      await fetch(`${apiUrl}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sos_id: sosId,
          patient_id: patientId,
          recipient_ids: emergencyContactIds,
          location,
        }),
      });
    } catch (err) {
      console.warn('SOS notification request failed:', err);
    }
  }
  return sosId;
}

export async function registerPushToken(userId: string, token: string): Promise<void> {
  await supabase.from('push_tokens').upsert(
    { user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,token' },
  );
}

export async function respondToSos(sosEventId: string, responderId: string, message?: string): Promise<void> {
  const { error } = await supabase.from('sos_responses').upsert(
    { sos_event_id: sosEventId, responder_id: responderId,
      message: message ?? null, responded_at: new Date().toISOString() },
    { onConflict: 'sos_event_id,responder_id' },
  );
  if (error) throw error;
}

export async function getSosDetails(sosEventId: string): Promise<{
  id: string; patient_id: string; patient_name: string;
  sent_at: string; location: string | null;
} | null> {
  const { data: sos } = await supabase
    .from('sos_events')
    .select('id, patient_id, sent_at, location')
    .eq('id', sosEventId)
    .single();
  if (!sos) return null;
  const { data: p } = await supabase
    .from('profiles').select('full_name').eq('id', sos.patient_id).single();
  return { id: sos.id, patient_id: sos.patient_id,
    patient_name: (p as any)?.full_name ?? 'Your contact',
    sent_at: sos.sent_at, location: sos.location };
}

export async function getSosResponders(sosEventId: string): Promise<Array<{
  responder_id: string; full_name: string; responded_at: string;
}>> {
  const { data } = await supabase
    .from('sos_responses')
    .select('responder_id, responded_at, profiles!sos_responses_responder_id_fkey(full_name)')
    .eq('sos_event_id', sosEventId)
    .order('responded_at', { ascending: true });
  return (data ?? []).map((r: any) => ({
    responder_id: r.responder_id,
    full_name: r.profiles?.full_name ?? 'Responding',
    responded_at: r.responded_at,
  }));
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export async function getInsightsSummary(patientId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: events }, { data: medLogs }] = await Promise.all([
    supabase.from('events').select('id, event_type, severity, occurred_at').eq('patient_id', patientId).gte('occurred_at', weekAgo),
    supabase.from('medication_logs').select('id').eq('patient_id', patientId).gte('taken_at', weekAgo),
  ]);

  const weekEvents = events ?? [];
  const missedDoses = weekEvents.filter((e) => e.event_type === 'missed_dose').length;

  return {
    this_week_events: weekEvents.length,
    missed_doses: missedDoses,
    med_checkins: (medLogs ?? []).length,
    pattern: weekEvents.length > 0
      ? missedDoses > 0
        ? `${weekEvents.length} event${weekEvents.length !== 1 ? 's' : ''} logged — ${missedDoses} after a missed dose.`
        : `${weekEvents.length} event${weekEvents.length !== 1 ? 's' : ''} logged this week.`
      : 'No events logged this week.',
    suggestion: missedDoses > 0 ? 'Set an earlier reminder' : 'Keep it up',
  };
}
