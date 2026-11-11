// Onboarding step 2 — Consent and privacy summary
// Spec: EPIMOYO_REDESIGN.md §5.8

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from "react-native"
import { useState } from "react"
import { router } from "expo-router"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radius, spacing } from "../../lib/theme"

const CONSENTS = [
  {
    id: "terms",
    title: "Terms of Service",
    desc: "I agree to the terms of service and privacy policy",
  },
  {
    id: "data",
    title: "Data Processing",
    desc: "I consent to my health data being processed to improve my care",
  },
  {
    id: "emergency",
    title: "Emergency Contacts",
    desc: "epimoyo may share my location with emergency contacts during SOS",
  },
]

export default function ConsentScreen() {
  const insets = useSafeAreaInsets()
  const [consents, setConsents] = useState<Record<string, boolean>>({
    terms: false,
    data: false,
    emergency: false,
  })
  const [progress, setProgress] = useState(0.25) // Step 2 of 8

  const allConsented = Object.values(consents).every(Boolean)

  function toggleConsent(id: string) {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleNext() {
    if (!allConsented) return
    router.push("./profile")
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
          <Text style={s.stepLabel}>Step 2 of 8</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>Your privacy matters</Text>
          <Text style={s.subtitle}>
            epimoyo is designed with your safety and privacy first. Please review and accept:
          </Text>

          {/* Consent items */}
          <View style={s.consentList}>
            {CONSENTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.consentRow}
                onPress={() => toggleConsent(item.id)}
                activeOpacity={0.8}
              >
                <Switch
                  value={consents[item.id]}
                  onValueChange={() => toggleConsent(item.id)}
                  trackColor={{
                    false: colors.toggleInactive ?? "#ccc",
                    true: colors.toggleActive ?? colors.primary,
                  }}
                  thumbColor="#fff"
                />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={s.consentTitle}>{item.title}</Text>
                  <Text style={s.consentDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Privacy info */}
          <View style={s.infoBox}>
            <View style={s.infoDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoText}>
                Your data is encrypted in transit and at rest. You can request a copy of all your data anytime from the Me screen.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={[s.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
          <TouchableOpacity
            style={[s.nextBtn, !allConsented && s.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!allConsented}
            activeOpacity={0.85}
          >
            <Text style={s.nextBtnText}>I understand and agree</Text>
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
  consentList: {
    gap: spacing.md,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  consentTitle: {
    fontSize: fonts.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  consentDesc: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: "row",
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  infoText: {
    fontSize: fonts.sm,
    color: colors.text,
    lineHeight: 18,
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
