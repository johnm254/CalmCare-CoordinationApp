import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { useAuth } from '../_layout';
import { getMedications, logMedicationTaken, getCareCircle, type Medication } from '../../lib/supabase';

const GRID_ITEMS = [
  { icon: '⚡', title: 'Conditions', subtitle: 'Types and triggers', route: '/records' },
  { icon: '◎', title: 'Care Circle', subtitle: 'You decide who sees what', route: '/circle' },
  { icon: '🏥', title: 'My Doctor', subtitle: 'Verified clinician link', route: '/records' },
  { icon: '📄', title: 'Records', subtitle: 'Events, notes, reports', route: '/records' },
];

export default function HomeScreen() {
  const { profile, session } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [circleCount, setCircleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [takenId, setTakenId] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const initials = (profile?.full_name ?? 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;
    Promise.all([getMedications(uid), getCareCircle(uid)]).then(([meds, circle]) => {
      setMedications(meds);
      setCircleCount(circle.length);
      setLoading(false);
    });
  }, [session]);

  async function handleTaken(med: Medication) {
    if (!session?.user || takenId) return;
    setTakenId(med.id);
    await logMedicationTaken(med.id, session.user.id);
  }

  const nextMed = medications[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.heroText}>{profile?.full_name ?? 'Your care, your control'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.circleCard}>
          <View style={styles.circleRing}><View style={styles.circleInner} /></View>
          <View style={styles.circleText}>
            <Text style={styles.protectedLabel}>PROTECTED</Text>
            <Text style={styles.circleTitle}>Your Circle is active</Text>
            <Text style={styles.circleSubtitle}>
              {circleCount > 0
                ? `${circleCount} trusted contact${circleCount !== 1 ? 's' : ''} ready to be alerted.`
                : 'Trusted contacts are ready when you need them.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.sosBtn}
          onLongPress={() => router.push('/sos')}
          onPress={() => router.push('/sos')}
          activeOpacity={0.9}
        >
          <View style={styles.sosBtnInner}>
            <View>
              <Text style={styles.sosBtnTitle}>Hold to send SOS</Text>
              <Text style={styles.sosBtnSub}>Alerts your Circle with live location</Text>
            </View>
            <View style={styles.sosPowerBtn}>
              <Text style={styles.sosPowerIcon}>⏻</Text>
            </View>
          </View>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.teal} />
          </View>
        ) : nextMed ? (
          <View style={styles.medCard}>
            <View style={styles.medLeft}>
              <View style={styles.medIcon}><Text style={styles.medIconText}>💊</Text></View>
              <View>
                <Text style={styles.medTime}>Next medication · {nextMed.schedule.time}</Text>
                <Text style={styles.medName}>{nextMed.name}</Text>
                <Text style={styles.medDose}>{nextMed.dose}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.takenBtn, takenId === nextMed.id && styles.takenBtnDone]}
              onPress={() => handleTaken(nextMed)}
              disabled={takenId === nextMed.id}
            >
              <Text style={styles.takenBtnText}>{takenId === nextMed.id ? '✓ Done' : 'Taken'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.grid}>
          {GRID_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.gridItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.gridIcon}>{item.icon}</Text>
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tealMuted, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.teal, fontWeight: '700', fontSize: fonts.md },
  greeting: { fontSize: fonts.sm, color: colors.textSecondary },
  heroText: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  bellBtn: { padding: spacing.sm },
  bellIcon: { fontSize: 20 },
  circleCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md,
  },
  circleRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: colors.teal, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  circleInner: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.teal, opacity: 0.4 },
  circleText: { flex: 1 },
  protectedLabel: { fontSize: fonts.xs, fontWeight: '700', color: colors.teal, letterSpacing: 1, marginBottom: 2 },
  circleTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  circleSubtitle: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },
  sosBtn: { backgroundColor: colors.coral, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  sosBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sosBtnTitle: { fontSize: fonts.lg, fontWeight: '800', color: '#fff', marginBottom: 2 },
  sosBtnSub: { fontSize: fonts.sm, color: 'rgba(255,255,255,0.8)' },
  sosPowerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  sosPowerIcon: { fontSize: 20, color: '#fff' },
  loadingCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md },
  medCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md,
  },
  medLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  medIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tealDim, alignItems: 'center', justifyContent: 'center' },
  medIconText: { fontSize: 18 },
  medTime: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: 2 },
  medName: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  medDose: { fontSize: fonts.sm, color: colors.textSecondary },
  takenBtn: { backgroundColor: colors.teal, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  takenBtnDone: { backgroundColor: colors.tealDim },
  takenBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.base },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  gridItem: { width: '47%', backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  gridIcon: { fontSize: 22, marginBottom: spacing.sm },
  gridTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  gridSubtitle: { fontSize: fonts.sm, color: colors.textSecondary },
});
