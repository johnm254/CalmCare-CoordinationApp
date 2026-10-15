import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../lib/theme';
import { useAuth } from './_layout';
import { getInsightsSummary } from '../lib/supabase';

type Insights = {
  this_week_events: number;
  pattern: string;
  suggestion: string;
  med_checkins: number;
};

export default function InsightsScreen() {
  const { session } = useAuth();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    getInsightsSummary(session.user.id).then((data) => {
      setInsights(data);
      setLoading(false);
    });
  }, [session]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Insights</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xl }} />
        ) : !insights ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No insights yet.</Text>
            <Text style={styles.emptySub}>Log a few events to see patterns here.</Text>
          </View>
        ) : (
          <View style={styles.insightCard}>
            <Text style={styles.weekLabel}>THIS WEEK</Text>
            <Text style={styles.insightHeading}>
              You logged {insights.this_week_events} event{insights.this_week_events !== 1 ? 's' : ''}. {insights.pattern}
            </Text>
            <Text style={styles.insightBody}>
              Built from {insights.this_week_events} event log{insights.this_week_events !== 1 ? 's' : ''} and {insights.med_checkins} medication check-in{insights.med_checkins !== 1 ? 's' : ''}. This is a pattern, not a diagnosis. Talk to your clinician before changing anything.
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>{insights.suggestion}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutlined} onPress={() => router.back()}>
                <Text style={styles.btnOutlinedText}>See the logs</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { color: colors.text, fontSize: fonts.md, fontWeight: '600', marginBottom: 4 },
  emptySub: { color: colors.textSecondary, fontSize: fonts.sm },
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
  btnPrimary: { backgroundColor: colors.teal, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },
  btnOutlined: { borderWidth: 1, borderColor: colors.teal, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
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
  offlineBadge: { backgroundColor: colors.tealDim, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  offlineBadgeText: { fontSize: fonts.xs, color: colors.teal, fontWeight: '600' },
  micRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  micBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tealDim, alignItems: 'center', justifyContent: 'center' },
  micIcon: { fontSize: 22 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 3, backgroundColor: colors.teal, borderRadius: 2, opacity: 0.7 },
  visitBriefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewBtn: { backgroundColor: colors.teal, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  reviewBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },
  disclaimer: { fontSize: fonts.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginTop: spacing.md, paddingHorizontal: spacing.md },
});
