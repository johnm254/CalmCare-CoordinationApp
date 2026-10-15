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
  const initials = (profile?.full_name ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

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

        {/* Top bar */}
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

        {/* Circle protection card */}
        <View style={styles.circleCard}>
          {/* Concentric circles visual */}
          <View style={styles.concentricWrap}>
            <View style={styles.ringOuter} />
            <View style={styles.ringMid} />
            <View style={styles.ringInner} />
            <View style={styles.ringCore} />
          </View>
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

        {/* SOS button */}
        <TouchableOpacity
          style={styles.sosBtn}
          onLongPress={() => router.push('/sos')}
          onPress={() => router.push('/sos')}
          activeOpacity={0.9}
        >
          <View style={styles.sosBtnInner}>
            <View style={styles.sosBtnTextWrap}>
              <Text style={styles.sosBtnTitle}>Hold for SOS</Text>
              <Text style={styles.sosBtnSub}>Alerts your Circle with live location</Text>
            </View>
            <View style={styles.sosPowerBtn}>
              <Text style={styles.sosPowerIcon}>⏻</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Medication card */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.teal} />
          </View>
        ) : nextMed ? (
          <View style={styles.medCard}>
            <View style={styles.medLeft}>
              <View style={styles.medIcon}><Text style={styles.medIconText}>💊</Text></View>
              <View>
                <Text style={styles.medTime}>Next medication</Text>
                <Text style={styles.medName}>{nextMed.name}</Text>
                <Text style={styles.medDose}>{nextMed.dose}</Text>
              </View>
            </View>
            <View style={styles.medRight}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{nextMed.schedule.time}</Text>
              </View>
              <TouchableOpacity
                style={[styles.takenBtn, takenId === nextMed.id && styles.takenBtnDone]}
                onPress={() => handleTaken(nextMed)}
                disabled={takenId === nextMed.id}
              >
                <Text style={styles.takenBtnText}>{takenId === nextMed.id ? '✓ Done' : 'Taken'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* 2x2 Quick access grid */}
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
  container: { padding: spacing.xl, paddingBottom: spacing.xxl },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.tealMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.teal,
  },
  avatarText: { color: colors.teal, fontWeight: '700', fontSize: fonts.md },
  greeting: { fontSize: fonts.sm, color: colors.textSecondary },
  heroText: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  bellIcon: { fontSize: 18 },

  // Circle card
  circleCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  concentricWrap: {
    width: 64, height: 64, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: 'rgba(0,191,166,0.2)',
  },
  ringMid: {
    position: 'absolute',
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: 'rgba(0,191,166,0.4)',
  },
  ringInner: {
    position: 'absolute',
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: 'rgba(0,191,166,0.7)',
  },
  ringCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.teal },
  circleText: { flex: 1 },
  protectedLabel: {
    fontSize: fonts.xs, fontWeight: '700', color: colors.teal,
    letterSpacing: 1.5, marginBottom: 4,
  },
  circleTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  circleSubtitle: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  // SOS
  sosBtn: {
    backgroundColor: colors.emergency,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sosBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sosBtnTextWrap: { flex: 1 },
  sosBtnTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sosBtnSub: { fontSize: fonts.sm, color: 'rgba(255,255,255,0.8)' },
  sosPowerBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  sosPowerIcon: { fontSize: 22, color: '#fff' },

  // Loading
  loadingCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md,
  },

  // Med card
  medCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  medLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  medIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  medIconText: { fontSize: 18 },
  medTime: { fontSize: fonts.xs, color: colors.textSecondary, marginBottom: 2 },
  medName: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  medDose: { fontSize: fonts.sm, color: colors.textSecondary },
  medRight: { alignItems: 'flex-end', gap: spacing.xs },
  timeBadge: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginBottom: spacing.xs,
  },
  timeBadgeText: { fontSize: fonts.xs, color: colors.textSecondary, fontWeight: '600' },
  takenBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  takenBtnDone: { backgroundColor: colors.tealDim },
  takenBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  gridItem: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  gridIcon: { fontSize: 24, marginBottom: spacing.sm },
  gridTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  gridSubtitle: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },
});
