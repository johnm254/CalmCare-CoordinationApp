import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../../lib/theme"
import { WelcomeIllustration } from "../../components/illustrations"

const BENEFITS = [
  {
    id: "tracking",
    icon: "seizure",
    label: "Seizure tracking",
    desc: "Log and monitor seizure events with one tap.",
  },
  {
    id: "meds",
    icon: "meds",
    label: "Medication reminders",
    desc: "Never miss a dose with smart daily reminders.",
  },
  {
    id: "circle",
    icon: "circle",
    label: "Care circle alerts",
    desc: "Your trusted contacts are notified the moment you need help.",
  },
]

export default function OnboardingWelcome() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Welcome illustration */}
        <WelcomeIllustration width={200} height={200} />

        {/* Title */}
        <Text style={styles.title}>Welcome to epimoyo</Text>
        <Text style={styles.subtitle}>Your epilepsy care, in your hands.</Text>

        {/* Benefits */}
        <View style={styles.benefitList}>
          {BENEFITS.map((b) => (
            <View key={b.id} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <View style={{ width: 20, height: 20, backgroundColor: colors.teal, borderRadius: 4 }} />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitLabel}>{b.label}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          {/* Get started */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push("./consent")}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Get started</Text>
          </TouchableOpacity>

          {/* Already have account */}
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            style={styles.linkRow}
          >
            <Text style={styles.linkText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const LOGO = 96

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + spacing.xl,
  },

  title: {
    fontSize: fonts.xxl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xxxl,
  },

  benefitList: {
    width: "100%",
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.tealDim,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { flex: 1 },
  benefitLabel: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  actions: {
    width: "100%",
    marginTop: "auto",
    paddingBottom: spacing.xl,
  },
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },
  linkRow: { alignItems: "center", paddingVertical: spacing.sm },
  linkText: { fontSize: fonts.sm, color: colors.teal, fontWeight: "700" },
})
