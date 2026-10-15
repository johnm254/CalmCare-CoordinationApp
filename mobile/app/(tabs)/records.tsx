import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { useAuth } from '../_layout';
import { getConditions, getMedications, type Condition, type Medication } from '../../lib/supabase';

export default function RecordsScreen() {
  const { session } = useAuth();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;
    Promise.all([getConditions(uid), getMedications(uid)]).then(([conds, meds]) => {
      setConditions(conds);
      setMedications(meds);
      setLoading(false);
    });
  }, [session]);

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

        {/* CONDITIONS */}
        <Text style={styles.sectionLabel}>CONDITIONS</Text>
        {conditions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No conditions recorded.</Text>
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

        {/* MEDICATIONS */}
        <Text style={styles.sectionLabel}>MEDICATIONS</Text>
        {medications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active medications.</Text>
          </View>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medIconWrap}>
                <Text style={styles.medIconEmoji}>💊</Text>
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

        {/* DOCUMENTS */}
        <Text style={styles.sectionLabel}>DOCUMENTS</Text>
        <View style={styles.docsEmptyCard}>
          <View style={styles.docsIconWrap}>
            <Text style={styles.docsIcon}>📅</Text>
          </View>
          <Text style={styles.docsEmptyTitle}>No documents yet</Text>
          <Text style={styles.docsEmptySub}>Visit briefs and lab results will appear here.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },

  title: { fontSize: fonts.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.xl },

  sectionLabel: {
    fontSize: fonts.xs, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: spacing.sm, marginTop: spacing.sm,
  },

  emptyCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md,
  },
  emptyText: { color: colors.textSecondary, fontSize: fonts.base },

  // Condition cards with teal left accent
  conditionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  conditionAccent: { width: 4, backgroundColor: colors.teal },
  conditionBody: { flex: 1, padding: spacing.lg },
  conditionType: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  conditionNotes: { fontSize: fonts.base, color: colors.textSecondary, marginBottom: spacing.sm },
  triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  triggerTag: {
    backgroundColor: colors.tealBadge,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  triggerTagText: { fontSize: fonts.xs, color: colors.teal, fontWeight: '600' },

  // Medication cards
  medCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  medIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  medIconEmoji: { fontSize: 18 },
  medInfo: { flex: 1 },
  medName: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 2 },
  medDose: { fontSize: fonts.sm, color: colors.textSecondary },
  schedulePill: {
    backgroundColor: colors.tealDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  schedulePillText: { fontSize: fonts.xs, color: colors.teal, fontWeight: '600' },

  // Documents empty state
  docsEmptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  docsIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  docsIcon: { fontSize: 32 },
  docsEmptyTitle: { fontSize: fonts.md, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  docsEmptySub: { fontSize: fonts.sm, color: colors.textMuted, textAlign: 'center' },
});
