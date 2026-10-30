import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../../lib/theme"

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

function SeizureIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 22, height: 4, backgroundColor: color, borderRadius: 2 }} />
      <View
        style={{
          position: "absolute",
          left: 8,
          top: 4,
          width: 4,
          height: 10,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 14,
          top: 10,
          width: 4,
          height: 14,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    </View>
  )
}

function MedsIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 18, height: 9, borderRadius: 9, backgroundColor: color }} />
      <View
        style={{
          width: 18,
          height: 9,
          borderRadius: 9,
          backgroundColor: color,
          opacity: 0.45,
          marginTop: 2,
        }}
      />
    </View>
  )
}

function CircleIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 24 }}>
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 2,
          width: 15,
          height: 15,
          borderRadius: 7.5,
          borderWidth: 2.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 10,
          top: 2,
          width: 15,
          height: 15,
          borderRadius: 7.5,
          borderWidth: 2.5,
          borderColor: color,
          opacity: 0.65,
        }}
      />
    </View>
  )
}

export default function OnboardingWelcome() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Logo mark */}
        <View style={styles.logoWrap}>
          <View style={styles.ring} />
          <View style={[styles.ring, styles.ringMid]} />
          <View style={[styles.ring, styles.ringInner]} />
          <View style={styles.ringCore} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to Mojo</Text>
        <Text style={styles.subtitle}>Your epilepsy care, in your hands.</Text>

        {/* Benefits */}
        <View style={styles.benefitList}>
          {BENEFITS.map((b) => (
            <View key={b.id} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                {b.icon === "seizure" && <SeizureIcon color={colors.teal} />}
                {b.icon === "meds" && <MedsIcon color={colors.teal} />}
                {b.icon === "circle" && <CircleIcon color={colors.teal} />}
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
            onPress={() => router.push("./conditions")}
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

  logoWrap: {
    width: LOGO,
    height: LOGO,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  ring: {
    position: "absolute",
    width: LOGO,
    height: LOGO,
    borderRadius: LOGO / 2,
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.22)",
  },
  ringMid: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderColor: "rgba(139,92,246,0.45)",
  },
  ringInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: "rgba(139,92,246,0.75)",
  },
  ringCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.teal,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
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
