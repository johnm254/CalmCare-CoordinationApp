import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { MOCK_CARE_CIRCLE } from '../../lib/mock-data';

type GrantKey = 'emergency_alerts' | 'medication_schedule' | 'appointments' | 'event_summaries' | 'records';

const GRANT_LABELS: { key: GrantKey; label: string; sub: string }[] = [
  { key: 'emergency_alerts', label: 'Emergency alerts', sub: 'Receive your SOS with location' },
  { key: 'medication_schedule', label: 'Medication schedule', sub: 'Doses and reminders' },
  { key: 'appointments', label: 'Appointments', sub: 'Dates and clinic details' },
  { key: 'event_summaries', label: 'Event summaries', sub: 'What happened, without notes' },
  { key: 'records', label: 'Records', sub: 'Reports and documents' },
];

function countGrants(grants: Record<GrantKey, boolean>) {
  return Object.values(grants).filter(Boolean).length;
}

export default function CircleScreen() {
  const [expanded, setExpanded] = useState<string | null>('cc-001');
  const [contacts, setContacts] = useState(
    MOCK_CARE_CIRCLE.map((c) => ({ ...c, grants: { ...c.grants } }))
  );

  function toggleGrant(contactId: string, key: GrantKey) {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, grants: { ...c.grants, [key]: !c.grants[key] } }
          : c
      )
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Care Circle</Text>
        <Text style={styles.description}>
          You decide who sees what. Changes apply the next time their phone syncs, and you can remove access at any time.
        </Text>

        {contacts.map((contact) => {
          const isOpen = expanded === contact.id;
          const grantCount = countGrants(contact.grants as Record<GrantKey, boolean>);

          return (
            <View key={contact.id} style={styles.contactCard}>
              <TouchableOpacity
                style={styles.contactHeader}
                onPress={() => setExpanded(isOpen ? null : contact.id)}
                activeOpacity={0.8}
              >
                <View style={styles.contactLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{contact.full_name[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.contactName}>{contact.full_name}</Text>
                    <Text style={styles.contactRole}>
                      {contact.relationship}
                      {contact.is_emergency ? " · emergency contact" : ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.grantBadge}>
                  <Text style={styles.grantBadgeText}>{grantCount} of 5</Text>
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.grantList}>
                  {GRANT_LABELS.map(({ key, label, sub }) => (
                    <View key={key} style={styles.grantRow}>
                      <View style={styles.grantInfo}>
                        <Text style={styles.grantLabel}>{label}</Text>
                        <Text style={styles.grantSub}>{sub}</Text>
                      </View>
                      <Switch
                        value={contact.grants[key]}
                        onValueChange={() => toggleGrant(contact.id, key)}
                        trackColor={{ false: colors.toggleInactive, true: colors.toggleActive }}
                        thumbColor="#fff"
                        ios_backgroundColor={colors.toggleInactive}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.activityBtn}>
          <Text style={styles.activityBtnText}>⏱ See who viewed what</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inviteBtn}>
          <Text style={styles.inviteBtnText}>Invite someone</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },

  title: { fontSize: fonts.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  description: { fontSize: fonts.base, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.xl },

  contactCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  contactLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.teal, fontWeight: '700', fontSize: fonts.lg },
  contactName: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  contactRole: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },
  grantBadge: {
    backgroundColor: colors.tealDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  grantBadgeText: { fontSize: fonts.sm, color: colors.teal, fontWeight: '600' },

  grantList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  grantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  grantInfo: { flex: 1, marginRight: spacing.md },
  grantLabel: { fontSize: fonts.base, fontWeight: '600', color: colors.text },
  grantSub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },

  activityBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  activityBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: fonts.base },

  inviteBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  inviteBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.md },
});
