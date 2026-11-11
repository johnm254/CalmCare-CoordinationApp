import { View, Text, StyleSheet } from "react-native"
import { colors, fonts, fontFamilies, spacing } from "../lib/theme"
import { Button } from "./Button"

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={s.container}>
      {icon && <View style={s.icon}>{icon}</View>}
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={s.button}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
    fontFamily: fontFamilies.bodySemiBold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.md,
    minWidth: 200,
  },
})
