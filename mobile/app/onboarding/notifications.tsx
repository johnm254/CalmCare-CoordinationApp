import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../../lib/theme"

function BellIcon({ color }: { color: string }) {
  return (
    <View
      style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
    >
      {/* Bell body */}
      <View
        style={{
          width: 30,
          height: 26,
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          borderWidth: 3,
          borderColor: color,
          borderBottomWidth: 0,
          marginBottom: 0,
        }}
      />
      {/* Bell base bar */}
      <View
        style={{
          width: 34,
          height: 3,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
      {/* Bell clapper */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          marginTop: 2,
        }}
      />
    </View>
  )
}

export default function NotificationsScreen() {
  async function handleEnable() {
    await Linking.openSettings()
    router.replace("/(tabs)")
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <BellIcon color={colors.teal} />
        </View>

        <Text style={styles.heading}>Enable notifications</Text>
        <Text style={styles.subheading}>
          Mojo needs notifications to remind you about medications and alert
          your caregivers in emergencies.
        </Text>

        {/* What you get */}
        <View style={styles.featureList}>
          {[
            "Medication reminders at the times you set",
            "Emergency alerts dispatched to your care circle",
            "Seizure log prompts so nothing gets missed",
          ].map((item) => (
            <View key={item} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnEnable}
            onPress={handleEnable}
            activeOpacity={0.85}
          >
            <Text style={styles.btnEnableText}>Enable notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={styles.skipRow}
          >
            <Text style={styles.skipText}>Not now</Text>
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
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.xxl,
    backgroundColor: colors.tealDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.tealMuted,
  },

  heading: {
    fontSize: fonts.xl,
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
    marginBottom: spacing.xxl,
  },

  featureList: {
    width: "100%",
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
    marginTop: 3,
  },
  featureText: {
    flex: 1,
    fontSize: fonts.base,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  actions: {
    width: "100%",
    marginTop: "auto",
  },
  btnEnable: {
    backgroundColor: colors.teal,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnEnableText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },
  skipRow: { alignItems: "center", paddingVertical: spacing.sm },
  skipText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: "600" },
})
