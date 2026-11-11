// Care Circle invite sheet — name, phone, role, permissions
// Spec: EPIMOYO_REDESIGN.md §5.5

import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, TextInput, Switch, Share, Alert } from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, fontFamilies, radius, spacing } from "../lib/theme"
import { Card, Button } from "./index"

export interface CareCircleInviteSheetProps {
  visible: boolean
  onClose: () => void
  onSend?: (data: InviteData) => Promise<void>
  loading?: boolean
}

export interface InviteData {
  full_name: string
  phone: string
  role: "caregiver" | "family" | "clinician"
  permissions: {
    emergency_alerts: boolean
    seizure_log: boolean
    medications: boolean
    mood: boolean
  }
}

const ROLES = [
  { value: "caregiver" as const, label: "Caregiver" },
  { value: "family" as const, label: "Family" },
  { value: "clinician" as const, label: "Clinician" },
]

const DEFAULT_PERMISSIONS = {
  emergency_alerts: true,
  seizure_log: false,
  medications: false,
  mood: false,
}

export function CareCircleInviteSheet({
  visible,
  onClose,
  onSend,
  loading = false,
}: CareCircleInviteSheetProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"caregiver" | "family" | "clinician">("caregiver")
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS)

  async function handleSend() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing information", "Please enter name and phone number")
      return
    }

    if (!onSend) return

    await onSend({
      full_name: name,
      phone,
      role,
      permissions,
    })

    // Reset form
    setName("")
    setPhone("")
    setRole("caregiver")
    setPermissions(DEFAULT_PERMISSIONS)
  }

  async function handleShare() {
    try {
      const message = `Hi! I'd like to add you to my care circle in epimoyo. Click here to accept: [invite link]`
      await Share.share({
        message,
        title: "Join my epimoyo care circle",
      })
    } catch (err) {
      console.error("Share failed:", err)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Invite to circle</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Name</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="Full name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            {/* Phone */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Phone</Text>
              <View style={s.phoneInputWrap}>
                <Text style={s.phonePrefix}>+254</Text>
                <TextInput
                  style={s.phoneInput}
                  placeholder="712 345 678"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Role */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Role</Text>
              <View style={s.roleGrid}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[s.roleBtn, role === r.value && s.roleBtnSelected]}
                    onPress={() => setRole(r.value)}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.roleBtnText,
                        role === r.value && s.roleBtnTextSelected,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Permissions */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>What can they see?</Text>
              <View style={s.permissionsList}>
                {[
                  {
                    key: "emergency_alerts" as const,
                    label: "Emergency alerts",
                    desc: "Receive SOS alerts and your location during emergencies",
                  },
                  {
                    key: "seizure_log" as const,
                    label: "Seizure log",
                    desc: "View your logged seizures and patterns",
                  },
                  {
                    key: "medications" as const,
                    label: "Medications",
                    desc: "See your medication schedule and adherence",
                  },
                  {
                    key: "mood" as const,
                    label: "Mood logs",
                    desc: "View your mood entries and trends",
                  },
                ].map((perm) => (
                  <View key={perm.key} style={s.permissionRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.permLabel}>{perm.label}</Text>
                      <Text style={s.permDesc}>{perm.desc}</Text>
                    </View>
                    <Switch
                      value={permissions[perm.key]}
                      onValueChange={(val) =>
                        setPermissions((prev) => ({ ...prev, [perm.key]: val }))
                      }
                      trackColor={{
                        false: colors.toggleInactive ?? "#ccc",
                        true: colors.toggleActive ?? colors.primary,
                      }}
                      thumbColor="#fff"
                      disabled={loading}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* What they can't see */}
            <Card variant="default" style={s.infoCard}>
              <Text style={s.infoLabel}>They cannot see:</Text>
              <Text style={s.infoText}>• Mood logs (unless allowed)</Text>
              <Text style={s.infoText}>• Your medication list (unless allowed)</Text>
              <Text style={s.infoText}>• Your location (except during SOS)</Text>
            </Card>
          </ScrollView>

          {/* Actions */}
          <View style={s.actions}>
            <Button
              label="Cancel"
              variant="secondary"
              onPress={onClose}
              disabled={loading}
            />
            <Button
              label={loading ? "Sending..." : "Send invite"}
              variant="primary"
              onPress={handleSend}
              disabled={loading || !name.trim() || !phone.trim()}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
    fontFamily: fontFamilies.bodySemiBold,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.sm,
    color: colors.text,
    fontFamily: fontFamilies.body,
  },
  phoneInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  phonePrefix: {
    fontSize: fonts.sm,
    fontWeight: "600",
    color: colors.text,
    marginRight: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    fontSize: fonts.sm,
    color: colors.text,
    fontFamily: fontFamilies.body,
  },
  roleGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  roleBtnSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  roleBtnText: {
    fontSize: fonts.xs,
    fontWeight: "600",
    color: colors.text,
  },
  roleBtnTextSelected: {
    color: colors.primary,
  },
  permissionsList: {
    gap: spacing.md,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  permLabel: {
    fontSize: fonts.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  permDesc: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoLabel: {
    fontSize: fonts.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
