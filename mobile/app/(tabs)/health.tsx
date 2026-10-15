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
  severe: colors.coral,
};

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

        <View style={styles.header}>
          <Text style={styles.title}>Health</Text>
          <View style={styles.filterRow}>
            {(['week', 'all'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                  {f === 'week' ? 'This week' : 'All time'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {insights && (
          <TouchableOpacity style={styles.insightCard} onPress={() => router.push('/insights')} activeOpacity={0.85}>
            <Text style={styles.insightWeek}>THIS WEEK</Text>
            <Text style={styles.insightHeading}>{insights.pattern}</Text>
            <Text style={styles.insightSub}>
              Built from {insights.this_week_events} event log{insights.this_week_events !== 1 ? 's' : ''} and {insights.med_checkins} medication check-in{insights.med_checkins !== 1 ? 's' : ''}. This is a pattern, not a diagnosis.
            </Text>
            <View style={styles.insightActions}>
              <TouchableOpacity style={styles.insightBtnPrimary}>
                <Text style={styles.insightBtnPrimaryText}>{insights.suggestion}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.insightBtnOutlined}>
                <Text style={styles.insightBtnOutlinedText}>See the logs</Text>
              </TouchableOpacity>
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
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventTop}>
                <View style={[styles.typeBadge, { backgroundColor: event.event_type === 'seizure' ? 'rgba(255,107,87,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                  <Text style={[styles.typeBadgeText, { color: event.event_type === 'seizure' ? colors.coral : colors.amber }]}>
                    {event.event_type === 'seizure' ? 'Seizure' : event.event_type === 'missed_dose' ? 'Missed dose' : event.event_type}
                  </Text>
                </View>
                {event.severity && (
                  <>
                    <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[event.severity] ?? colors.teal }]} />
                    <Text style={styles.severityText}>{event.severity}</Text>
                  </>
                )}
              </View>
              <Text style={styles.eventTime}>{formatDate(event.occurred_at)}</Text>
              {event.details && Object.keys(event.details).length > 0 && (
                <View style={styles.detailsRow}>
                  {Object.entries(event.details).map(([k, v]) => (
                    <Text key={k} style={styles.detailText}>{k.replace(/_/g, ' ')}: {String(v)}</Text>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

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
  header: { marginBottom: spacing.lg },
  title: { fontSize: fonts.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  filterBtnActive: { borderColor: colors.teal, backgroundColor: colors.tealDim },
  filterBtnText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: '600' },
  filterBtnTextActive: { color: colors.teal },
  insightCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.teal, padding: spacing.lg, marginBottom: spacing.xl },
  insightWeek: { fontSize: fonts.xs, fontWeight: '700', color: colors.teal, letterSpacing: 1, marginBottom: spacing.sm },
  insightHeading: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, lineHeight: 26 },
  insightSub: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },
  insightActions: { flexDirection: 'row', gap: spacing.md },
  insightBtnPrimary: { backgroundColor: colors.teal, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  insightBtnPrimaryText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },
  insightBtnOutlined: { borderRadius: radius.full, borderWidth: 1, borderColor: colors.teal, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  insightBtnOutlinedText: { color: colors.teal, fontWeight: '700', fontSize: fonts.sm },
  sectionTitle: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: fonts.base },
  eventCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  eventTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  typeBadge: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
  typeBadgeText: { fontSize: fonts.sm, fontWeight: '600' },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  severityText: { fontSize: fonts.sm, color: colors.textSecondary },
  eventTime: { fontSize: fonts.sm, color: colors.textMuted, marginBottom: spacing.sm },
  detailsRow: { gap: 4 },
  detailText: { fontSize: fonts.sm, color: colors.textSecondary },
  addEventBtn: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.teal, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  addEventBtnText: { color: colors.teal, fontWeight: '700', fontSize: fonts.md },
});
