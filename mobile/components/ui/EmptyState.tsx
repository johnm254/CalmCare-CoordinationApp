import { View, Text, StyleSheet } from "react-native"
import { colors, radius } from "../../lib/theme"
import Button from "./Button"

type EmptyStateProps = {
  title: string
  subtitle?: string
  action?: string
  onAction?: () => void
}

export default function EmptyState({ title, subtitle, action, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.illustration}>
        <View style={styles.ilCircle} />
        <View style={styles.ilDash1} />
        <View style={styles.ilDash2} />
        <View style={styles.ilDot} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action && onAction ? (
        <Button label={action} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  illustration: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  ilCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    borderStyle: "dashed",
    position: "absolute",
  },
  ilDash1: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primarySoft,
    position: "absolute",
    top: 24,
  },
  ilDash2: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primarySoft,
    position: "absolute",
    top: 32,
  },
  ilDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  btn: { marginTop: 8, alignSelf: "center" },
})
