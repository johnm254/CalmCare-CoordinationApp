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

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>AI Insights</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>Live data</Text>
          </View>
        </View>

        {/* Loading */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.teal} size="large" />
          </View>
        ) : !insights ? (
          /* Empty state */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>🧠</Text>
            </View>
            <Text style={styles.emptyText}>No insights yet.</Text>
            <Text style={styles.emptySub}>Log a few events to see patterns here.</Text>
          </View>
        ) : (
          /* Insights card with thick teal left border */
          <View style={styles.insightCard}>
            <View style={styles.insightLeftBar} />
            <View style={styles.insightContent}>
              <View style={styles.weekBadge}>
                <Text style={styles.weekBadgeText}>THIS WEEK</Text>
              </View>
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
          </View>
        )}

        {/* Voice log card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Log by voice</Text>
            <View style={styles.amberBadge}>
              <Text style={styles.amberBadgeText}>Works offline</Text>
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
            Say what happened and Duara turns it into a log you can edit. It is saved on this device first and syncs later.
          </Text>
        </View>

        {/* Visit brief card */}
        <View style={styles.card}>
          <View style={styles.visitBriefRow}>
            <View style={styles.visitBriefInfo}>
              <Text style={styles.cardTitle}>Visit brief is ready</Text>
              <Text style={styles.cardBodySub}>Review it, then share with your clinician</Text>
            </View>
            <TouchableOpacity style={styles.reviewBtn}>
              <Text style={styles.reviewBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Duara never diagnoses or changes your medication. Summaries are drafts built from what you and your Circle logged.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { marginRight: spacing.md, padding: spacing.xs },
  backIcon: { fontSize: fonts.xl, color: colors.text },
  title: { fontSize: fonts.xl, fontWeight: '700', color: colors.text, flex: 1 },
  liveBadge: {
    backgroundColor: colors.tealBadge,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  liveBadgeText: { fontSize: fonts.xs, color: colors.teal, fontWeight: '700', letterSpacing: 0.5 },

  // Loading
  loadingWrap: { alignItems: 'center', paddingVertical: spacing.xxxl },

  // Empty state
  emptyCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.md,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { color: colors.text, fontSize: fonts.md, fontWeight: '600', marginBottom: 4 },
  emptySub: { color: colors.textSecondary, fontSize: fonts.sm, textAlign: 'center' },

  // Insights card with left border
  insightCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  insightLeftBar: { width: 4, backgroundColor: colors.teal },
  insightContent: { flex: 1, padding: spacing.lg },
  weekBadge: {
    backgroundColor: colors.tealBadge,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  weekBadgeText: { fontSize: fonts.xs, fontWeight: '700', color: colors.teal, letterSpacing: 1 },
  insightHeading: { fontSize: fonts.xl, fontWeight: '700', color: colors.text, lineHeight: 30, marginBottom: spacing.sm },
  insightBody: { fontSize: fonts.base, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg },
  actionRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },
  btnOutlined: {
    borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  btnOutlinedText: { color: colors.teal, fontWeight: '700', fontSize: fonts.sm },

  // Generic card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  cardBody: { fontSize: fonts.base, color: colors.textSecondary, lineHeight: 22 },
  cardBodySub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },
  amberBadge: {
    backgroundColor: colors.amberDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  amberBadgeText: { fontSize: fonts.xs, color: colors.amber, fontWeight: '600' },

  micRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  micBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  micIcon: { fontSize: 22 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 3, backgroundColor: colors.teal, borderRadius: 2, opacity: 0.7 },

  visitBriefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  visitBriefInfo: { flex: 1 },
  reviewBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  reviewBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },

  disclaimer: {
    fontSize: fonts.sm, color: colors.textMuted,
    textAlign: 'center', lineHeight: 20,
    marginTop: spacing.md, paddingHorizontal: spacing.md,
  },
});
