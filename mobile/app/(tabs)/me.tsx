// Me tab — profile, device status, activity log, crisis resources, settings.
// CR-APP-09: data export/delete requests surfaced here.
// Safety statement always visible (CR-SEC-01).

import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { useAuth } from '../_layout';
import { supabase } from '../../lib/supabase';

// ─── Row component ────────────────────────────────────────────────────────────

function MenuRow({
  label, sublabel, onPress, danger,
}: {
  label: string; sublabel?: string; onPress: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowLabel, danger && { color: colors.emergency }]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {/* Chevron */}
      <View style={{ width: 8, height: 8, borderRightWidth: 2, borderTopWidth: 2, borderColor: colors.textMuted, transform: [{ rotate: '45deg' }] }} />
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MeScreen() {
  const { profile, session } = useAuth();
  const [crisisLines] = useState([
    { name: 'Befrienders Kenya', phone: '+254722178177' },
  ]);

  const initials = (profile?.full_name ?? 'U')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name ?? '—'}</Text>
            <Text style={styles.profileEmail}>{session?.user?.email ?? ''}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{(profile?.role ?? 'patient').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Safety statement — CR-SEC-01 */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyText}>
            Duara helps you and your care team watch trends. It does not diagnose or treat any condition.
            In an emergency, press SOS or call emergency services.
          </Text>
        </View>

        {/* Crisis resources — always one tap away */}
        <SectionHeader title="CRISIS RESOURCES" />
        <View style={styles.card}>
          {crisisLines.map((line) => (
            <TouchableOpacity
              key={line.phone}
              style={styles.crisisRow}
              onPress={() => Linking.openURL(`tel:${line.phone}`)}
              accessibilityLabel={`Call ${line.name}`}
              accessibilityRole="button"
            >
              {/* Red phone dot */}
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emergency, marginRight: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.crisisName}>{line.name}</Text>
                <Text style={styles.crisisPhone}>{line.phone}</Text>
              </View>
              <Text style={[styles.rowLabel, { color: colors.emergency }]}>Call</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Account */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.card}>
          <MenuRow label="Activity log" sublabel="Who viewed your data" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuRow label="Export my data" sublabel="Kenya DPA right" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuRow label="Delete my account" danger onPress={() => {}} />
        </View>

        {/* Devices */}
        <SectionHeader title="DEVICES" />
        <View style={styles.card}>
          <MenuRow label="Epi Strap" sublabel="Not paired" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuRow label="Add-on devices" sublabel="BP cuff, glucose meter, scale" onPress={() => {}} />
        </View>

        {/* Settings */}
        <SectionHeader title="SETTINGS" />
        <View style={styles.card}>
          <MenuRow label="Language" sublabel="English" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuRow label="Accessibility" sublabel="Font size, dark mode" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuRow label="Notifications" sublabel="Medication reminders, alerts" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuRow label="PIN / Biometric lock" onPress={() => {}} />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} accessibilityRole="button">
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Duara v1.0 · Project Epi</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: spacing.xxxl },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.tealMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.teal,
    flexShrink: 0,
  },
  avatarText: { color: colors.teal, fontWeight: '700', fontSize: fonts.xl },
  profileInfo: { flex: 1 },
  profileName: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, marginBottom: 2 },
  profileEmail: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tealBadge,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  roleBadgeText: { fontSize: fonts.xs, color: colors.teal, fontWeight: '700', letterSpacing: 0.8 },

  safetyCard: {
    backgroundColor: colors.tealDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.teal,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  safetyText: {
    fontSize: fonts.sm,
    color: colors.teal,
    lineHeight: 18,
    textAlign: 'center',
  },

  sectionLabel: {
    fontSize: fonts.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  rowTextWrap: { flex: 1 },
  rowLabel: { fontSize: fonts.md, color: colors.text, fontWeight: '500' },
  rowSublabel: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },

  crisisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: 52,
  },
  crisisName: { fontSize: fonts.md, color: colors.text, fontWeight: '600', marginBottom: 2 },
  crisisPhone: { fontSize: fonts.sm, color: colors.textSecondary },

  signOutBtn: {
    marginTop: spacing.xxl,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  signOutText: { fontSize: fonts.md, color: colors.emergency, fontWeight: '600' },

  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fonts.xs,
    marginTop: spacing.xl,
  },
});
