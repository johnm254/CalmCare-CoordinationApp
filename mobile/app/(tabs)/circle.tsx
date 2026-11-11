import { useEffect, useState } from "react"
import { TabErrorFallback } from "../../components/TabErrorBoundary"

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from "react-native"

import { useSafeAreaInsets } from "react-native-safe-area-context"

import { router, useFocusEffect } from "expo-router"

import { useCallback } from "react"

import { Ionicons } from "@expo/vector-icons"

import { Card, Button, Chip, EmptyState, ListRow } from "../../components"
import { colors, fonts, radius, spacing, shadows } from "../../lib/theme"

import { useAuth } from "../_layout"

import {
  getCareCircle,
  getGrantsForAllMembers,
  setGrant,
  removeCareCircleMember,
  getLinkedPatients,
  type CareCircleMember,
  type GrantKey,
  type LinkedPatient,
} from "../../lib/supabase"

import { TAB_BOTTOM, TAB_HEIGHT } from "./_layout"

const GRANT_LABELS: {
  key: GrantKey
  label: string
  sub: string
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  {
    key: "emergency_alerts",
    label: "Emergency alerts",
    sub: "Receive your SOS with location",
    icon: "alert-circle",
  },
  {
    key: "medication_schedule",
    label: "Medication schedule",
    sub: "Doses and reminders",
    icon: "medical",
  },
  {
    key: "appointments",
    label: "Appointments",
    sub: "Dates and clinic details",
    icon: "calendar",
  },
  {
    key: "event_summaries",
    label: "Event summaries",
    sub: "What happened, without notes",
    icon: "document-text",
  },
  {
    key: "records",
    label: "Records",
    sub: "Reports and documents",
    icon: "folder",
  },
]

type ContactWithGrants = CareCircleMember & {
  grants: Record<GrantKey, boolean>
}

// ─── Chevron icon (no emoji) ──────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <View
      style={{
        width: 10,
        height: 10,

        borderRightWidth: 2,
        borderBottomWidth: 2,

        borderColor: colors.textMuted,

        transform: [{ rotate: open ? "225deg" : "45deg" }],

        marginTop: open ? 4 : 0,
      }}
    />
  )
}

export default function CircleScreen() {
  const { profile, session, activePatientId, setActivePatientId } = useAuth()
  const insets = useSafeAreaInsets()
  const bottomPad = TAB_HEIGHT + TAB_BOTTOM + insets.bottom + 16

  const [contacts, setContacts] = useState<ContactWithGrants[]>([])

  const [expanded, setExpanded] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState<string | null>(null)

  const [linkedPatients, setLinkedPatients] = useState<LinkedPatient[]>([])

  const [showPicker, setShowPicker] = useState(false)

  const isCaregiver = profile?.role === "caregiver"

  const loadCircle = useCallback(async (alive: { current: boolean }) => {
    if (!session?.user) return

    const uid = session.user.id

    setLoading(true)

    try {
      const circle = await getCareCircle(uid)
      if (!alive.current) return

      const memberIds = circle.map((c) => c.member_id)
      const allGrants = await getGrantsForAllMembers(uid, memberIds)
      if (!alive.current) return

      const withGrants = circle.map((c) => ({
        ...c,
        grants: allGrants[c.member_id] ?? {
          emergency_alerts: false,
          medication_schedule: false,
          appointments: false,
          event_summaries: false,
          records: false,
        },
      }))

      setContacts(withGrants)
      if (withGrants.length > 0 && !expanded) setExpanded(withGrants[0].id)
    } catch {}
    finally {
      if (alive.current) setLoading(false)
    }
  }, [session])

  useFocusEffect(
    useCallback(() => {
      const alive = { current: true }
      loadCircle(alive)
      return () => { alive.current = false }
    }, [loadCircle]),
  )

  useFocusEffect(
    useCallback(() => {
      if (!session?.user || !isCaregiver) return
      let alive = true
      getLinkedPatients(session.user.id).then((patients) => {
        if (!alive) return
        setLinkedPatients(patients)
        if (patients.length > 0 && !activePatientId) {
          setActivePatientId(patients[0].patient_id)
        }
      }).catch(() => {})
      return () => { alive = false }
    }, [session, isCaregiver]),
  )

  async function toggleGrant(contact: ContactWithGrants, key: GrantKey) {
    if (!session?.user || saving) return

    const newVal = !contact.grants[key]

    setSaving(`${contact.id}-${key}`)

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contact.id
          ? { ...c, grants: { ...c.grants, [key]: newVal } }
          : c,
      ),
    )

    try {
      await setGrant(session.user.id, contact.member_id, key, newVal)
    } catch {
      // Revert optimistic update on failure
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contact.id
            ? { ...c, grants: { ...c.grants, [key]: !newVal } }
            : c,
        ),
      )
    } finally {
      setSaving(null)
    }
  }

  async function handleRemove(contact: ContactWithGrants) {
    if (!session?.user) return

    setContacts((prev) => prev.filter((c) => c.id !== contact.id))

    await removeCareCircleMember(contact.id)
  }

  return (
    <View style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {isCaregiver && (
          <View style={styles.caregiverBanner}>
            <Text style={styles.caregiverBannerLabel}>Viewing care for:</Text>
            <TouchableOpacity
              style={styles.patientPickerBtn}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.patientPickerName}>
                {linkedPatients.find((p) => p.patient_id === activePatientId)
                  ?.full_name ?? "Select patient"}
              </Text>
              <Text style={styles.patientPickerChevron}>▾</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCaregiver && showPicker && (
          <View style={styles.pickerDropdown}>
            {linkedPatients.map((p) => (
              <TouchableOpacity
                key={p.patient_id}
                style={[
                  styles.pickerItem,
                  activePatientId === p.patient_id && styles.pickerItemActive,
                ]}
                onPress={() => {
                  setActivePatientId(p.patient_id)
                  setShowPicker(false)
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerItemName}>
                  {p.full_name ?? "Unknown"}
                </Text>
                <Text style={styles.pickerItemRel}>{p.relationship}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Premium intro block */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Care Circle</Text>
          <Text style={styles.subtitle}>You decide who sees what.</Text>
          {!loading && (
            <View style={styles.memberChip}>
              <Text style={styles.memberChipText}>
                {contacts.length} members
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.teal}
            style={{ marginTop: spacing.xl }}
          />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              {/* Two overlapping circles icon */}
              <View style={{ width: 40, height: 28, position: "relative" }}>
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: colors.textMuted,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: colors.textMuted,
                    opacity: 0.5,
                  }}
                />
              </View>
            </View>
            <Text style={styles.emptyText}>No one in your Circle yet.</Text>
            <Text style={styles.emptySub}>
              Invite a trusted contact to get started.
            </Text>
          </View>
        ) : (
          contacts.map((contact) => {
            const isOpen = expanded === contact.id

            const grantCount = Object.values(contact.grants).filter(
              Boolean,
            ).length

            const initials = contact.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()

            return (
              <View key={contact.id} style={styles.contactCard}>
                <TouchableOpacity
                  style={styles.contactHeader}
                  onPress={() => setExpanded(isOpen ? null : contact.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.contactLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.contactName}>
                          {contact.full_name}
                        </Text>
                        {contact.is_emergency && (
                          <View style={styles.emergencyDot} />
                        )}
                      </View>
                      <Text style={styles.contactRole}>
                        {contact.relationship}
                        {contact.is_emergency ? " · emergency contact" : ""}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={styles.grantBadge}>
                      <Text style={styles.grantBadgeText}>
                        {grantCount} of 5
                      </Text>
                    </View>
                    <ChevronIcon open={isOpen} />
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.grantList}>
                    {GRANT_LABELS.map(({ key, label, sub, icon }) => {
                      const savingThis = saving === `${contact.id}-${key}`
                      const granted = contact.grants[key]

                      return (
                        <View key={key} style={styles.grantRow}>
                          <View style={styles.grantIconWrap}>
                            <Ionicons
                              name={icon}
                              size={16}
                              color={granted ? colors.teal : colors.textMuted}
                            />
                          </View>
                          <View style={styles.grantInfo}>
                            <Text style={styles.grantLabel}>{label}</Text>
                            <Text style={styles.grantSub}>{sub}</Text>
                          </View>
                          {savingThis ? (
                            <ActivityIndicator
                              size="small"
                              color={colors.teal}
                            />
                          ) : (
                            <Switch
                              value={contact.grants[key]}
                              onValueChange={() => toggleGrant(contact, key)}
                              trackColor={{
                                false: colors.toggleInactive,
                                true: colors.toggleActive,
                              }}
                              thumbColor="#fff"
                              ios_backgroundColor={colors.toggleInactive}
                            />
                          )}
                        </View>
                      )
                    })}
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemove(contact)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.removeBtnText}>
                        Remove from Circle
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          })
        )}

        {/* Invite button */}
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => router.push("/circle-invite")}
          activeOpacity={0.85}
        >
          <Text style={styles.inviteBtnText}>
            Invite someone to your Circle
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  scroll: { flex: 1 },

  container: { padding: spacing.lg },

  // ─── Premium header block ──────────────────────────────────────────────────
  headerBlock: {
    marginBottom: spacing.xl,
  },

  title: {
    fontSize: fonts.xxl,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },

  subtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  memberChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.tealMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },

  memberChipText: {
    fontSize: fonts.sm,
    color: colors.teal,
    fontWeight: "700",
  },

  // ─── Empty state ───────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,

    borderWidth: 1,
    borderColor: colors.border,

    padding: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.md,
  },

  emptyIconWrap: {
    width: 64,
    height: 48,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: spacing.md,
  },

  emptyText: {
    color: colors.text,
    fontSize: fonts.md,
    fontWeight: "600",
    marginBottom: 4,
  },

  emptySub: { color: colors.textSecondary, fontSize: fonts.sm },

  // ─── Contact cards ─────────────────────────────────────────────────────────
  contactCard: {
    backgroundColor: colors.bgCard,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    marginBottom: spacing.md,

    overflow: "hidden",

    ...shadows.sm,
  },

  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    padding: spacing.lg,
  },

  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,

    backgroundColor: colors.heroCard,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 2,
    borderColor: colors.teal,
  },

  avatarText: { color: "#FFFFFF", fontWeight: "700", fontSize: fonts.lg },

  contactInfo: { flex: 1 },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  contactName: { fontSize: fonts.md, fontWeight: "700", color: colors.text },

  emergencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emergency,
  },

  contactRole: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.md },

  grantBadge: {
    backgroundColor: colors.irisDim,

    borderRadius: radius.full,

    paddingHorizontal: spacing.md,

    paddingVertical: 4,
  },

  grantBadgeText: {
    fontSize: fonts.sm,
    color: colors.iris,
    fontWeight: "600",
  },

  // ─── Grant list ────────────────────────────────────────────────────────────
  grantList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,

    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  grantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingVertical: spacing.md,

    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  grantIconWrap: {
    width: 24,
    alignItems: "center",
    marginRight: spacing.sm,
  },

  grantInfo: { flex: 1, marginRight: spacing.md },

  grantLabel: { fontSize: fonts.base, fontWeight: "600", color: colors.text },

  grantSub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },

  removeBtn: {
    marginTop: spacing.md,

    paddingVertical: spacing.sm,

    alignItems: "center",
  },

  removeBtnText: {
    fontSize: fonts.sm,
    color: colors.emergency,
    fontWeight: "600",
  },

  // ─── Invite button ─────────────────────────────────────────────────────────
  inviteBtn: {
    backgroundColor: colors.teal,

    borderRadius: radius.xl,

    paddingVertical: spacing.lg,

    alignItems: "center",

    marginTop: spacing.md,
  },

  inviteBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: fonts.md },

  // ─── Caregiver banner ──────────────────────────────────────────────────────
  caregiverBanner: {
    backgroundColor: "rgba(20,184,166,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(20,184,166,0.20)",
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  caregiverBannerLabel: {
    fontSize: fonts.xs,
    color: "#3A5255",
    fontWeight: "600",
  },

  patientPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  patientPickerName: {
    fontSize: fonts.sm,
    fontWeight: "700",
    color: "#0C1F20",
  },

  patientPickerChevron: {
    fontSize: fonts.xs,
    color: "#1F7A72",
  },

  pickerDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6CFC4",
    marginBottom: 12,
    overflow: "hidden",
  },

  pickerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#D6CFC4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pickerItemActive: {
    backgroundColor: "rgba(20,184,166,0.08)",
  },

  pickerItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0C1F20",
  },

  pickerItemRel: {
    fontSize: fonts.xs,
    color: "#3A5255",
  },
})

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <TabErrorFallback error={error} retry={retry} />
}