import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { useAuth } from '../_layout';
import { getEvents, getInsightsSummary, type Event } from '../../lib/supabase';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const SEVERITY_COLORS: Record<string, string> = {
  mild: colors.teal,
  moderate: colors.amber,
  severe: colors.emergency,
};

function eventBorderColor(type: string): string {
  if (type === 'seizure') return colors.emergency;
  if (type === 'missed_dose') return colors.amber;
  return colors.teal;
}

function eventBadgeBg(type: string): string {
  if (type === 'seizure') return colors.badgeReviewBg;
  if (type === 'missed_dose') return colors.amberDim;
  return colors.tealBadge;
}

function eventBadgeColor(type: string): string {
  if (type === 'seizure') return colors.emergency;
  if (type === 'missed_dose') return colors.amber;
  return colors.teal;
}

function eventLabel(type: string): string {
  if (type === 'seizure') return 'Seizure';
  if (type === 'missed_dose') return 'Missed dose';
  return type;
}

export default function HealthScreen() {
  const { session } = useAuth();
  const [filter, setFilter] = useState<'week' | 'all'>('week');
  const [events, setEvents] = useState<Event[]>([]);
  const [insights, setInsights] = useState<{ this_week_events: number; pattern: string; suggestion: string; med_checkins: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    setLoading(true);
    const uid = session.user.id;
    Promise.all([getEvents(uid, filter), getInsightsSummary(uid)]).then(([evts, ins]) => {
      setEvents(evts);
      setInsights(ins);
      setLoading(false);
    });
  }, [session, filter]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header row */}
        <View style={styles.header}>
          <Text style={styles.title}>Health</Text>
          <View style={styles.filterRow}>
            {(['week', 'all'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                  {f === 'week' ? 'This week' : 'All time'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Insights card */}
        {insights && (
          <TouchableOpacity style={styles.insightCard} onPress={() => router.push('/insights')} activeOpacity={0.85}>
            <View style={styles.insightLeftBar} />
            <View style={styles.insightContent}>
              <View style={styles.insightBadge}>
                <Text style={styles.insightBadgeText}>THIS WEEK</Text>
              </View>
              <Text style={styles.insightHeading}>{insights.pattern}</Text>
              <Text style={styles.insightSub}>
                Built from {insights.this_week_events} event log{insights.this_week_events !== 1 ? 's' : ''} and {insights.med_checkins} medication check-in{insights.med_checkins !== 1 ? 's' : ''}. This is a pattern, not a diagnosis.
              </Text>
              <View style={styles.insightActions}>
                <TouchableOpacity style={styles.insightBtnPrimary}>
                  <Text style={styles.insightBtnPrimaryText}>{insights.suggestion}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.insightBtnOutlined}>
                  <Text style={styles.insightBtnOutlinedText}>See logs</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Events</Text>

        {loading ? (
          <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xl }} />
        ) : events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No events logged{filter === 'week' ? ' this week' : ''}.</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={[styles.eventCard, { borderLeftColor: eventBorderColor(event.event_type) }]}>
              <View style={styles.eventTop}>
                <View style={[styles.typeBadge, { backgroundColor: eventBadgeBg(event.event_type) }]}>
                  <Text style={[styles.typeBadgeText, { color: eventBadgeColor(event.event_type) }]}>
                    {eventLabel(event.event_type)}
                  </Text>
                </View>
                {event.severity && (
                  <>
                    <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[event.severity] ?? colors.teal }]} />
                    <Text style={styles.severityText}>{event.severity}</Text>
                  </>
                )}
              </View>
              {event.details && Object.keys(event.details).length > 0 && (
                <View style={styles.detailsRow}>
                  {Object.entries(event.details).map(([k, v]) => (
                    <Text key={k} style={styles.detailText}>{k.replace(/_/g, ' ')}: {String(v)}</Text>
                  ))}
                </View>
              )}
              <Text style={styles.eventTime}>{formatDate(event.occurred_at)}</Text>
            </View>
          ))
        )}

        {/* Log event button */}
        <TouchableOpacity style={styles.addEventBtn}>
          <Text style={styles.addEventBtnText}>+ Log an event</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontSize: fonts.xxl, fontWeight: '800', color: colors.text },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  filterBtnActive: { borderColor: colors.teal, backgroundColor: colors.tealDim },
  filterBtnText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: '600' },
  filterBtnTextActive: { color: colors.teal },

  // Insights card with left thick border
  insightCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  insightLeftBar: { width: 4, backgroundColor: colors.teal },
  insightContent: { flex: 1, padding: spacing.lg },
  insightBadge: {
    backgroundColor: colors.tealBadge,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  insightBadgeText: { fontSize: fonts.xs, fontWeight: '700', color: colors.teal, letterSpacing: 1 },
  insightHeading: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, lineHeight: 26 },
  insightSub: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },
  insightActions: { flexDirection: 'row', gap: spacing.md },
  insightBtnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  insightBtnPrimaryText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },
  insightBtnOutlined: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.teal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  insightBtnOutlinedText: { color: colors.teal, fontWeight: '700', fontSize: fonts.sm },

  // Section
  sectionTitle: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  emptyCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center',
  },
  emptyText: { color: colors.textSecondary, fontSize: fonts.base },

  // Event cards with left colored border
  eventCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  eventTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  typeBadge: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
  typeBadgeText: { fontSize: fonts.sm, fontWeight: '600' },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  severityText: { fontSize: fonts.sm, color: colors.textSecondary },
  detailsRow: { gap: 4, marginBottom: spacing.sm },
  detailText: { fontSize: fonts.sm, color: colors.textSecondary },
  eventTime: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 4 },

  // Add event
  addEventBtn: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.teal,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addEventBtnText: { color: colors.teal, fontWeight: '700', fontSize: fonts.md },
});
