import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { colors, fonts, radius, spacing } from "../lib/theme"

export function TabErrorFallback({
  error,
  retry,
}: {
  error: Error
  retry: () => void
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>!</Text>
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message} numberOfLines={3}>
        {error.message || "An unexpected error occurred."}
      </Text>
      <TouchableOpacity style={styles.button} onPress={retry} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxxl,
    backgroundColor: colors.bg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.emergencyDim,
    borderWidth: 1.5,
    borderColor: "rgba(200,16,46,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.emergency,
    lineHeight: 30,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xxl,
    lineHeight: 18,
  },
  button: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: fonts.base,
    letterSpacing: 0.3,
  },
})
