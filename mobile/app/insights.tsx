import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../lib/theme';
import { MOCK_INSIGHTS } from '../lib/mock-data';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Insights</Text>
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleBadgeText}>Sample content</Text>
          </View>
        </View>

        {/* Main insight card */}
        <View style={styles.insightCard}>
          <Text style={styles.weekLabel}>THIS WEEK</Text>
          <Text style={styles.insightHeading}>
            You logged {MOCK_INSIGHTS.this_week_events} events. {MOCK_INSIGHTS.pattern}
          </Text>
          <Text style={styles.insightBody}>
            Built from {MOCK_INSIGHTS.this_week_events} event logs and 12 medication check-ins. This is a pattern, not a diagnosis. Talk to your clinician before changing anything.
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>{MOCK_INSIGHTS.suggestion}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutlined}>
              <Text style={styles.btnOutlinedText}>See the logs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice log card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Log by voice</Text>
              <Text style={styles.cardSub}>Works offline</Text>
            </View>
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>Works offline</Text>
            </View>
          </View>
          <View style={styles.micRow}>
            <View style={styles.micBtn}>
              <Text style={styles.micIcon}>🎙</Text>
            </View>
            <View style={styles.waveform}>
              {[4, 8, 16, 12, 20, 8, 14, 10, 18, 6].map((h, i) => (
                <View key={i} style={[styles.waveBar, { height: h }]} />
              ))}
            </View>
          </View>
          <Text style={styles.cardBody}>
            Say what happened and Epi turns it into a log you can edit. It is saved on this device first and syncs later.
          </Text>
        </View>

        {/* Visit brief card */}
        <View style={styles.card}>
          <View style={styles.visitBriefRow}>
            <View>
              <Text style={styles.cardTitle}>Visit brief is ready</Text>
              <Text style={styles.cardBody}>Review it, then share with your clinician</Text>
            </View>
            <TouchableOpacity style={styles.reviewBtn}>
              <Text style={styles.reviewBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer disclaimer */}
        <Text style={styles.disclaimer}>
          Epi never diagnoses or changes your medication. Summaries are drafts built from what you and your Circle logged.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { marginRight: spacing.md },
  backIcon: { fontSize: fonts.xl, color: colors.text },
  title: { fontSize: fonts.xl, fontWeight: '700', color: colors.text, flex: 1 },
  sampleBadge: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sampleBadgeText: { fontSize: fonts.xs, color: colors.textSecondary },

  insightCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.teal,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  weekLabel: { fontSize: fonts.xs, fontWeight: '700', color: colors.teal, letterSpacing: 1, marginBottom: spacing.sm },
  insightHeading: { fontSize: fonts.xl, fontWeight: '700', color: colors.text, lineHeight: 30, marginBottom: spacing.sm },
  insightBody: { fontSize: fonts.base, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },
  btnOutlined: {
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  btnOutlinedText: { color: colors.teal, fontWeight: '700', fontSize: fonts.sm },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  cardTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },
  cardBody: { fontSize: fonts.base, color: colors.textSecondary, lineHeight: 22 },
  offlineBadge: {
    backgroundColor: colors.tealDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  offlineBadgeText: { fontSize: fonts.xs, color: colors.teal, fontWeight: '600' },

  micRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: { fontSize: 22 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 3, backgroundColor: colors.teal, borderRadius: 2, opacity: 0.7 },

  visitBriefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  reviewBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },

  disclaimer: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
