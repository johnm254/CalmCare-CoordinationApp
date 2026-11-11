// Onboarding step 4 — Select role (patient/caregiver/clinician)
// Spec: EPIMOYO_REDESIGN.md §5.8

import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { useState } from "react"
import { router } from "expo-router"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radius, spacing } from "../../lib/theme"

const ROLES = [
  {
    id: "patient",
    label: "Patient",
    desc: "I have epilepsy and want to track my seizures and manage my care",
    icon: "person-circle-outline" as const,
  },
  {
    id: "caregiver",
    label: "Caregiver",
    desc: "I support someone with epilepsy and want to help manage their care",
    icon: "heart-outline" as const,
  },
  {
    id: "clinician",
    label: "Clinician",
    desc: "I'm a healthcare provider managing patients with epilepsy",
    icon: "medkit-outline" as const,
  },
]

export default function RoleScreen() {
  const insets = useSafeAreaInsets()
  const [selected, setSelected] = useState<string | null>(null)
  const [progress, setProgress] = useState(0.5) // Step 4 of 8

  function handleNext() {
    if (!selected) return
    router.push("./conditions")
  }

  function handleBack() {
    router.back()
  }

  return (
    <View style={s.safe}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Progress bar */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.stepLabel}>Step 4 of 8</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>What's your role?</Text>
          <Text style={s.subtitle}>epimoyo adapts based on who you are.</Text>

          {/* Role cards */}
          <View style={s.roleList}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  s.roleCard,
                  selected === role.id && s.roleCardSelected,
                ]}
                onPress={() => setSelected(role.id)}
                activeOpacity={0.85}
              >
                <View style={s.roleCardContent}>
                  <View style={[s.roleIcon, selected === role.id && s.roleIconSelected]}>
                    <Ionicons
                      name={role.icon}
                      size={28}
                      color={selected === role.id ? colors.primary : colors.text}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.roleLabel}>{role.label}</Text>
                    <Text style={s.roleDesc}>{role.desc}</Text>
                  </View>
                  {selected === role.id && (
                    <View style={s.checkmark}>
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={[s.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
          <TouchableOpacity
            style={[s.nextBtn, !selected && s.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!selected}
            activeOpacity={0.85}
          >
            <Text style={s.nextBtnText}>Continue</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    fontSize: fonts.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  scroll: { flex: 1 },
  container: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.lg },
  title: {
    fontSize: fonts.xl,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  roleList: {
    gap: spacing.md,
  },
  roleCard: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconSelected: {
    backgroundColor: "#fff",
  },
  roleLabel: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleDesc: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fonts.base,
  },
})
