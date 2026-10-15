import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { MOCK_CONDITIONS, MOCK_MEDICATIONS, MOCK_DOCUMENTS } from '../../lib/mock-data';

export default function RecordsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Records</Text>

        {/* Conditions */}
        <Text style={styles.sectionTitle}>Conditions</Text>
        {MOCK_CONDITIONS.map((cond) => (
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
        ))}

        {/* Medications */}
        <Text style={styles.sectionTitle}>Medications</Text>
        {MOCK_MEDICATIONS.map((med) => (
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
        ))}

        {/* Documents */}
        <Text style={styles.sectionTitle}>Documents</Text>
        {MOCK_DOCUMENTS.map((doc) => (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docLeft}>
              <View style={styles.docIcon}>
                <Text style={styles.docIconText}>📄</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>{doc.title}</Text>
                <Text style={styles.cardBody}>{doc.date}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.reviewBtn}>
              <Text style={styles.reviewBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        ))}

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

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardBody: { fontSize: fonts.base, color: colors.textSecondary },
  tagRow: { flexDirection: 'row', marginTop: spacing.sm, flexWrap: 'wrap' },
  tagLabel: { fontSize: fonts.sm, color: colors.textMuted, fontWeight: '600' },
  tagValue: { fontSize: fonts.sm, color: colors.textSecondary },

  medRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  schedulePill: {
    backgroundColor: colors.tealDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  schedulePillText: { fontSize: fonts.sm, color: colors.teal, fontWeight: '600' },

  docCard: {
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
  docLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconText: { fontSize: 18 },
  reviewBtn: {
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  reviewBtnText: { color: colors.teal, fontWeight: '700', fontSize: fonts.sm },
});
