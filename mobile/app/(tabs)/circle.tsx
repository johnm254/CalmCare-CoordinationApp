import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { useAuth } from '../_layout';
import {
  getCareCircle, getGrantsForMember, setGrant,
  type CareCircleMember, type GrantKey,
} from '../../lib/supabase';

const GRANT_LABELS: { key: GrantKey; label: string; sub: string }[] = [
  { key: 'emergency_alerts', label: 'Emergency alerts', sub: 'Receive your SOS with location' },
  { key: 'medication_schedule', label: 'Medication schedule', sub: 'Doses and reminders' },
  { key: 'appointments', label: 'Appointments', sub: 'Dates and clinic details' },
  { key: 'event_summaries', label: 'Event summaries', sub: 'What happened, without notes' },
  { key: 'records', label: 'Records', sub: 'Reports and documents' },
];

type ContactWithGrants = CareCircleMember & { grants: Record<GrantKey, boolean> };

export default function CircleScreen() {
  const { session } = useAuth();
  const [contacts, setContacts] = useState<ContactWithGrants[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;
    getCareCircle(uid).then(async (circle) => {
      const withGrants = await Promise.all(
        circle.map(async (c) => ({
          ...c,
          grants: await getGrantsForMember(uid, c.member_id),
        }))
      );
      setContacts(withGrants);
      if (withGrants.length > 0) setExpanded(withGrants[0].id);
      setLoading(false);
    });
  }, [session]);

  async function toggleGrant(contact: ContactWithGrants, key: GrantKey) {
    if (!session?.user || saving) return;
    const newVal = !contact.grants[key];
    setSaving(`${contact.id}-${key}`);
    setContacts((prev) =>
      prev.map((c) => c.id === contact.id ? { ...c, grants: { ...c.grants, [key]: newVal } } : c)
    );
    await setGrant(session.user.id, contact.member_id, key, newVal);
    setSaving(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Care Circle</Text>
        <Text style={styles.description}>
          You decide who sees what. Changes take effect immediately, and you can remove access at any time.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xl }} />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No one in your Circle yet.</Text>
            <Text style={styles.emptySub}>Invite a trusted contact to get started.</Text>
          </View>
        ) : (
          contacts.map((contact) => {
            const isOpen = expanded === contact.id;
            const grantCount = Object.values(contact.grants).filter(Boolean).length;
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
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.full_name}</Text>
                      <Text style={styles.contactRole}>
                        {contact.relationship}{contact.is_emergency ? ' · emergency contact' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={styles.grantBadge}>
                      <Text style={styles.grantBadgeText}>{grantCount} of 5</Text>
                    </View>
                    <Text style={styles.expandArrow}>{isOpen ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.grantList}>
                    {GRANT_LABELS.map(({ key, label, sub }) => {
                      const savingThis = saving === `${contact.id}-${key}`;
                      return (
                        <View key={key} style={styles.grantRow}>
                          <View style={styles.grantInfo}>
                            <Text style={styles.grantLabel}>{label}</Text>
                            <Text style={styles.grantSub}>{sub}</Text>
                          </View>
                          {savingThis
                            ? <ActivityIndicator size="small" color={colors.teal} />
                            : (
                              <Switch
                                value={contact.grants[key]}
                                onValueChange={() => toggleGrant(contact, key)}
                                trackColor={{ false: colors.toggleInactive, true: colors.toggleActive }}
                                thumbColor="#fff"
                                ios_backgroundColor={colors.toggleInactive}
                              />
                            )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Invite button */}
        <TouchableOpacity style={styles.inviteBtn} activeOpacity={0.85}>
          <Text style={styles.inviteBtnText}>Invite someone to your Circle</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },

  title: { fontSize: fonts.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  description: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },

  emptyCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md,
  },
  emptyText: { color: colors.text, fontSize: fonts.md, fontWeight: '600', marginBottom: 4 },
  emptySub: { color: colors.textSecondary, fontSize: fonts.sm },

  contactCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  contactHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg,
  },
  contactLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.tealMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.teal,
  },
  avatarText: { color: colors.teal, fontWeight: '700', fontSize: fonts.lg },
  contactInfo: { flex: 1 },
  contactName: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  contactRole: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grantBadge: {
    backgroundColor: colors.tealBadge,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  grantBadgeText: { fontSize: fonts.sm, color: colors.teal, fontWeight: '600' },
  expandArrow: { fontSize: fonts.xs, color: colors.textMuted },

  grantList: {
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  grantRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  grantInfo: { flex: 1, marginRight: spacing.md },
  grantLabel: { fontSize: fonts.base, fontWeight: '600', color: colors.text },
  grantSub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },

  inviteBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  inviteBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.md },
});
