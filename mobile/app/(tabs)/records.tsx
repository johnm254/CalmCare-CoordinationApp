import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { useAuth } from '../_layout';
import { getConditions, getMedications, getEvents, supabase, type Condition, type Medication, type Event } from '../../lib/supabase';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── View-based icons ─────────────────────────────────────────────────────────

function PillIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 28, height: 14, borderRadius: 7,
        borderWidth: 2, borderColor: color,
        flexDirection: 'row', overflow: 'hidden',
      }}>
        <View style={{ flex: 1, backgroundColor: color, opacity: 0.5 }} />
        <View style={{ flex: 1, backgroundColor: 'transparent' }} />
      </View>
    </View>
  );
}

function LightningSmall({ color }: { color: string }) {
  return (
    <View style={{ width: 16, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 12, height: 11, backgroundColor: color, borderRadius: 2, transform: [{ skewX: '-10deg' }], position: 'absolute', top: 0 }} />
      <View style={{ width: 12, height: 11, backgroundColor: color, borderRadius: 2, transform: [{ skewX: '-10deg' }], position: 'absolute', bottom: 0 }} />
      <View style={{ width: 14, height: 4, backgroundColor: colors.bgCard, transform: [{ rotate: '-35deg' }], position: 'absolute' }} />
    </View>
  );
}

function EventDot({ type }: { type: string }) {
  const c = type === 'seizure' ? colors.emergency : type === 'missed_dose' ? colors.amber : colors.teal;
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />;
}

function DocumentPlaceholderIcon() {
  return (
    <View style={{ width: 40, height: 48, borderRadius: 4, borderWidth: 2, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 22, height: 2, backgroundColor: colors.textMuted, borderRadius: 1, marginBottom: 4 }} />
      <View style={{ width: 28, height: 2, backgroundColor: colors.textMuted, borderRadius: 1, marginBottom: 4 }} />
      <View style={{ width: 22, height: 2, backgroundColor: colors.textMuted, borderRadius: 1 }} />
    </View>
  );
}

// ─── Section header with teal left accent ─────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={sec.row}>
      <View style={sec.accent} />
      <Text style={sec.title}>{title}</Text>
    </View>
  );
}

const sec = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.md },
  accent: { width: 4, height: 18, backgroundColor: colors.teal, borderRadius: 2, marginRight: spacing.md },
  title: { fontSize: fonts.lg, fontWeight: '700', color: colors.text },
});

// ─── Add Medication Modal ─────────────────────────────────────────────────────

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function AddMedModal({ visible, userId, onClose, onSaved }: { visible: boolean; userId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('08:00');
  const [days, setDays] = useState<Set<string>>(new Set(WEEK_KEYS));
  const [saving, setSaving] = useState(false);

  function toggleDay(key: string) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim() || !dose.trim()) {
      Alert.alert('Missing fields', 'Please enter a medication name and dose.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('medications').insert({
        patient_id: userId,
        name: name.trim(),
        dose: dose.trim(),
        schedule: { time, days: Array.from(days) },
        active: true,
      });
      if (error) throw error;
      onSaved();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not save medication.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={addmed.overlay}>
        <View style={addmed.sheet}>
          <Text style={addmed.title}>Add medication</Text>

          <TextInput
            style={addmed.input}
            placeholder="Medication name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={addmed.input}
            placeholder="Dose (e.g. 200mg)"
            placeholderTextColor={colors.textMuted}
            value={dose}
            onChangeText={setDose}
          />
          <TextInput
            style={addmed.input}
            placeholder="Time (HH:MM)"
            placeholderTextColor={colors.textMuted}
            value={time}
            onChangeText={setTime}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={addmed.sectionLabel}>Days</Text>
          <View style={addmed.daysRow}>
            {WEEK_DAYS.map((day, i) => {
              const key = WEEK_KEYS[i];
              const active = days.has(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[addmed.dayBtn, active && addmed.dayBtnActive]}
                  onPress={() => toggleDay(key)}
                >
                  <Text style={[addmed.dayBtnText, active && addmed.dayBtnTextActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[addmed.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color="#000" /> : <Text style={addmed.saveBtnText}>Save</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={addmed.cancelBtn} onPress={onClose}>
            <Text style={addmed.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const addmed = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderColor: colors.border,
    padding: 24, paddingBottom: 48,
  },
  title: { fontSize: fonts.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    color: colors.text, fontSize: fonts.base,
    marginBottom: spacing.md,
  },
  sectionLabel: { fontSize: fonts.sm, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  daysRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xl, flexWrap: 'wrap' },
  dayBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCardAlt,
  },
  dayBtnActive: { borderColor: colors.teal, backgroundColor: colors.teal },
  dayBtnText: { fontSize: fonts.xs, color: colors.textSecondary, fontWeight: '600' },
  dayBtnTextActive: { color: '#000', fontWeight: '700' },
  saveBtn: {
    backgroundColor: colors.teal, borderRadius: radius.lg,
    paddingVertical: spacing.md + 2, alignItems: 'center', marginBottom: spacing.md,
  },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.md },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelBtnText: { color: colors.textSecondary, fontSize: fonts.base },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RecordsScreen() {
  const { session } = useAuth();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMedVisible, setAddMedVisible] = useState(false);

  function loadData() {
    if (!session?.user) return;
    const uid = session.user.id;
    Promise.all([getConditions(uid), getMedications(uid), getEvents(uid, 'all')]).then(([conds, meds, evts]) => {
      setConditions(conds);
      setMedications(meds);
      setEvents(evts.slice(0, 5));
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, [session]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.teal} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Records</Text>
        <Text style={styles.subtitle}>Your health data, all in one place.</Text>

        {/* MEDICATIONS */}
        <SectionHeader title="Medications" />
        {medications.length === 0 ? (
          <View style={styles.emptyCard}>
            <PillIcon color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No active medications</Text>
            <Text style={styles.emptyBody}>Tap below to add your first medication.</Text>
          </View>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medIconWrap}>
                <PillIcon color={colors.teal} />
              </View>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDose}>{med.dose}</Text>
              </View>
              <View style={styles.schedulePill}>
                <Text style={styles.schedulePillText}>{med.schedule.time} daily</Text>
              </View>
            </View>
          ))
        )}
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddMedVisible(true)}>
          <Text style={styles.addBtnText}>+ Add medication</Text>
        </TouchableOpacity>

        {/* CONDITIONS */}
        <SectionHeader title="Conditions" />
        {conditions.length === 0 ? (
          <View style={styles.emptyCard}>
            <LightningSmall color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No conditions recorded</Text>
            <Text style={styles.emptyBody}>Your clinician can add conditions to your record.</Text>
          </View>
        ) : (
          conditions.map((cond) => (
            <View key={cond.id} style={styles.conditionCard}>
              <View style={styles.conditionAccent} />
              <View style={styles.conditionBody}>
                <Text style={styles.conditionType}>{cond.type}</Text>
                {cond.notes ? <Text style={styles.conditionNotes}>{cond.notes}</Text> : null}
                {cond.triggered_by ? (
                  <View style={styles.triggerRow}>
                    {cond.triggered_by.split(',').map((t, i) => (
                      <View key={i} style={styles.triggerTag}>
                        <Text style={styles.triggerTagText}>{t.trim()}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}

        {/* EVENTS */}
        <SectionHeader title="Recent Events" />
        {events.length === 0 ? (
          <View style={styles.emptyCard}>
            <DocumentPlaceholderIcon />
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyBody}>Log events from the Health tab.</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <EventDot type={event.event_type} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventType}>
                  {event.event_type === 'seizure' ? 'Seizure' : event.event_type === 'missed_dose' ? 'Missed dose' : event.event_type}
                  {event.severity ? ` · ${event.severity}` : ''}
                </Text>
                <Text style={styles.eventDate}>{formatDate(event.occurred_at)}</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {session?.user && (
        <AddMedModal
          visible={addMedVisible}
          userId={session.user.id}
          onClose={() => setAddMedVisible(false)}
          onSaved={() => {
            setAddMedVisible(false);
            loadData();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },

  title: { fontSize: fonts.xxl, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: spacing.md },

  emptyCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm,
  },
  emptyTitle: { color: colors.textSecondary, fontSize: fonts.base, fontWeight: '600' },
  emptyBody: { color: colors.textMuted, fontSize: fonts.sm, textAlign: 'center' },

  medCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, flexDirection: 'row',
    alignItems: 'center', gap: spacing.md, marginBottom: spacing.md,
  },
  medIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.tealDim, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  medInfo: { flex: 1 },
  medName: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 2 },
  medDose: { fontSize: fonts.sm, color: colors.textSecondary },
  schedulePill: {
    backgroundColor: colors.tealDim, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 5,
  },
  schedulePillText: { fontSize: fonts.xs, color: colors.teal, fontWeight: '600' },

  addBtn: {
    borderWidth: 1.5, borderColor: colors.teal, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm,
  },
  addBtnText: { color: colors.teal, fontWeight: '700', fontSize: fonts.base },

  conditionCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', marginBottom: spacing.md, overflow: 'hidden',
  },
  conditionAccent: { width: 4, backgroundColor: colors.teal },
  conditionBody: { flex: 1, padding: spacing.lg },
  conditionType: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  conditionNotes: { fontSize: fonts.base, color: colors.textSecondary, marginBottom: spacing.sm },
  triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  triggerTag: { backgroundColor: colors.tealBadge, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
  triggerTagText: { fontSize: fonts.xs, color: colors.teal, fontWeight: '600' },

  eventCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, flexDirection: 'row',
    alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm,
  },
  eventInfo: { flex: 1 },
  eventType: { fontSize: fonts.base, fontWeight: '600', color: colors.text },
  eventDate: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 2 },
});
