import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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

        <Text style={styles.sectionTitle}>Conditions</Text>
        {conditions.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No conditions recorded.</Text></View>
        ) : (
          conditions.map((cond) => (
            <View key={cond.id} style={styles.card}>
              <Text style={styles.cardTitle}>{cond.type}</Text>
              {cond.notes ? <Text style={styles.cardBody}>{cond.notes}</Text> : null}
              {cond.triggered_by ? (
                <View style={styles.tagRow}>
                  <Text style={styles.tagLabel}>Triggers: </Text>
                  <Text style={styles.tagValue}>{cond.triggered_by}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Medications</Text>
        {medications.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No active medications.</Text></View>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={styles.card}>
              <View style={styles.medRow}>
                <View>
                  <Text style={styles.cardTitle}>{med.name}</Text>
                  <Text style={styles.cardBody}>{med.dose}</Text>
                </View>
                <View style={styles.schedulePill}>
                  <Text style={styles.schedulePillText}>{med.schedule.time} daily</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Documents</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No documents yet.</Text>
          <Text style={styles.emptySub}>Visit briefs and lab results will appear here.</Text>
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
  sectionTitle: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: fonts.base },
  emptySub: { color: colors.textMuted, fontSize: fonts.sm, marginTop: 4 },
  cardTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardBody: { fontSize: fonts.base, color: colors.textSecondary },
  tagRow: { flexDirection: 'row', marginTop: spacing.sm, flexWrap: 'wrap' },
  tagLabel: { fontSize: fonts.sm, color: colors.textMuted, fontWeight: '600' },
  tagValue: { fontSize: fonts.sm, color: colors.textSecondary },
  medRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  schedulePill: { backgroundColor: colors.tealDim, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  schedulePillText: { fontSize: fonts.sm, color: colors.teal, fontWeight: '600' },
});
