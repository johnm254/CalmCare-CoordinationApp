import { useState } from "react"
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../../lib/theme"

const CONSENT_ITEMS = [
  {
    id: "health",
    title: "Health data collection",
    description: "We collect seizure events, medications, and mood logs.",
    required: true,
  },
  {
    id: "location",
    title: "Location sharing",
    description:
      "Your GPS is shared with caregivers only during an SOS. Never in the background.",
    required: true,
  },
  {
    id: "caregiver",
    title: "Caregiver visibility",
    description:
      "People in your Care Circle can see your health events and medications.",
    required: true,
  },
  {
    id: "mood",
    title: "Mood data",
    description:
      "Mood logs are private by default — only you and your doctor can see them.",
    required: true,
  },
  {
    id: "emergency",
    title: "Emergency dispatch",
    description:
      "During SOS, your location may be shared with emergency services.",
    required: true,
  },
  {
    id: "research",
    title: "Research opt-in (optional)",
    description:
      "You can optionally share anonymised data to improve care.",
    required: false,
  },
  {
    id: "kenya_dpa",
    title: "Kenya DPA rights",
    description:
      "You have the right to access, correct, or delete your data at any time.",
    required: true,
  },
]

export default function ConsentScreen() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    health: false,
    location: false,
    caregiver: false,
    mood: false,
    emergency: false,
    research: false,
    kenya_dpa: false,
  })

  const requiredIds = CONSENT_ITEMS.filter((i) => i.required).map((i) => i.id)
  const allRequiredOn = requiredIds.every((id) => toggles[id])

  function toggle(id: string) {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleContinue() {
    if (!allRequiredOn) return
    router.replace("/(tabs)")
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>mojo</Text>
          <Text style={styles.heading}>Privacy & Consent</Text>
          <Text style={styles.subheading}>
            Please review and accept the following before continuing.
          </Text>
          <TouchableOpacity style={styles.privacyLink}>
            <Text style={styles.privacyLinkText}>Read full privacy policy</Text>
          </TouchableOpacity>
        </View>

        {/* Consent items */}
        {CONSENT_ITEMS.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTextWrap}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {!item.required && (
                    <View style={styles.optionalBadge}>
                      <Text style={styles.optionalBadgeText}>Optional</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </View>
              <Switch
                value={toggles[item.id]}
                onValueChange={() => toggle(item.id)}
                trackColor={{
                  false: colors.toggleInactive,
                  true: colors.toggleActive,
                }}
                thumbColor={toggles[item.id] ? "#fff" : colors.textMuted}
              />
            </View>
          </View>
        ))}

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.btnContinue, !allRequiredOn && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!allRequiredOn}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.btnContinueText,
              !allRequiredOn && styles.btnDisabledText,
            ]}
          >
            I understand &amp; agree
          </Text>
        </TouchableOpacity>

        <Text style={styles.footNote}>
          Items 1–5 and 7 are required to use Mojo. Item 6 is optional and can
          be changed at any time in Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  header: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 6,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: fonts.xl,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  privacyLink: { paddingVertical: spacing.sm },
  privacyLinkText: {
    fontSize: fonts.sm,
    color: colors.teal,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cardTextWrap: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  cardDesc: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  optionalBadge: {
    backgroundColor: colors.tealBadge,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  optionalBadgeText: {
    fontSize: fonts.xs,
    color: colors.teal,
    fontWeight: "700",
  },

  btnContinue: {
    backgroundColor: colors.teal,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    backgroundColor: colors.bgCardAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnContinueText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },
  btnDisabledText: { color: colors.textMuted },

  footNote: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
})
