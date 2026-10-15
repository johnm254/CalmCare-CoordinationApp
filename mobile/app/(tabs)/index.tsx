import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { MOCK_USER, MOCK_MEDICATIONS } from '../../lib/mock-data';

const NEXT_MED = MOCK_MEDICATIONS[0];

const GRID_ITEMS = [
  { icon: '⚡', title: 'Conditions', subtitle: 'Types and triggers', route: '/records' },
  { icon: '◎', title: 'Care Circle', subtitle: 'You decide who sees what', route: '/circle' },
  { icon: '🏥', title: 'My Doctor', subtitle: 'Verified clinician link', route: '/records' },
  { icon: '📄', title: 'Records', subtitle: 'Events, notes, reports', route: '/records' },
];

export default function HomeScreen() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{MOCK_USER.initials}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.heroText}>Your care, your control</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Circle Status Card */}
        <View style={styles.circleCard}>
          <View style={styles.circleRing}>
            <View style={styles.circleInner} />
          </View>
          <View style={styles.circleText}>
            <Text style={styles.protectedLabel}>PROTECTED</Text>
            <Text style={styles.circleTitle}>Your Circle is active</Text>
            <Text style={styles.circleSubtitle}>
              Trusted contacts are ready to be alerted the moment you need them.
            </Text>
          </View>
        </View>

        {/* SOS Button */}
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

        {/* Next Medication */}
        <View style={styles.medCard}>
          <View style={styles.medLeft}>
            <View style={styles.medIcon}>
              <Text style={styles.medIconText}>💊</Text>
            </View>
            <View>
              <Text style={styles.medTime}>Next medication · {NEXT_MED.schedule.time}</Text>
              <Text style={styles.medName}>{NEXT_MED.name}</Text>
              <Text style={styles.medDose}>{NEXT_MED.dose}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.takenBtn}>
            <Text style={styles.takenBtnText}>Taken</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access Grid */}
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.teal, fontWeight: '700', fontSize: fonts.md },
  greeting: { fontSize: fonts.sm, color: colors.textSecondary },
  heroText: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  bellBtn: { padding: spacing.sm },
  bellIcon: { fontSize: 20 },

  circleCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  circleRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circleInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.teal,
    opacity: 0.4,
  },
  circleText: { flex: 1 },
  protectedLabel: { fontSize: fonts.xs, fontWeight: '700', color: colors.teal, letterSpacing: 1, marginBottom: 2 },
  circleTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  circleSubtitle: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  sosBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sosBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sosBtnTitle: { fontSize: fonts.lg, fontWeight: '800', color: '#fff', marginBottom: 2 },
  sosBtnSub: { fontSize: fonts.sm, color: 'rgba(255,255,255,0.8)' },
  sosPowerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosPowerIcon: { fontSize: 20, color: '#fff' },

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
  medLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medIconText: { fontSize: 18 },
  medTime: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: 2 },
  medName: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  medDose: { fontSize: fonts.sm, color: colors.textSecondary },
  takenBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  takenBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.base },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  gridItem: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  gridIcon: { fontSize: 22, marginBottom: spacing.sm },
  gridTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  gridSubtitle: { fontSize: fonts.sm, color: colors.textSecondary },
});
