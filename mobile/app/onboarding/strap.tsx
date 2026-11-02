import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../../lib/theme"

function StrapIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 64, height: 48, alignItems: "center", justifyContent: "center" }}>
      {/* Strap band */}
      <View
        style={{
          width: 56,
          height: 20,
          borderRadius: 10,
          borderWidth: 2.5,
          borderColor: color,
        }}
      />
      {/* ECG blip */}
      <View
        style={{
          position: "absolute",
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
        }}
      >
        <View style={{ width: 10, height: 2, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: 3, height: 10, backgroundColor: color, borderRadius: 1, marginTop: -8 }} />
        <View style={{ width: 3, height: 16, backgroundColor: color, borderRadius: 1, marginTop: 8 }} />
        <View style={{ width: 3, height: 10, backgroundColor: color, borderRadius: 1, marginTop: -8 }} />
        <View style={{ width: 10, height: 2, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  )
}

const FEATURES = [
  "Continuous ECG monitoring between clinic visits",
  "Automatic fall and seizure detection",
  "Medication reminder vibration on your wrist",
  "Instant SOS with one button press",
]

export default function StrapScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.stepDot, i === 3 && styles.stepDotActive]}
            />
          ))}
        </View>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <StrapIcon color={colors.teal} />
        </View>

        <Text style={styles.heading}>Pair your Mojo Strap</Text>
        <Text style={styles.subheading}>
          The Mojo Strap keeps you safer around the clock — monitoring your
          heart and alerting your care circle the moment it detects a problem.
        </Text>

        <View style={styles.featureList}>
          {FEATURES.map((item) => (
            <View key={item} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Not-yet-available notice */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeDot} />
          <Text style={styles.noticeText}>
            Mojo Strap hardware is not yet available in your region. You can
            pair it later from Settings once you receive it.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnSkip}
            onPress={() => router.push("./notifications")}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSkipText}>{"I don't have a strap yet"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    alignSelf: "center",
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.teal,
    width: 24,
    borderRadius: 4,
  },

  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.tealDim,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.xl,
  },

  heading: {
    fontSize: fonts.xxl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  featureList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
    marginTop: 6,
    flexShrink: 0,
  },
  featureText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.amber,
    marginTop: 6,
    flexShrink: 0,
  },
  noticeText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },

  actions: { marginTop: "auto" },
  btnSkip: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  btnSkipText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: fonts.md,
  },
})
