import { Text, StyleSheet } from "react-native"
import { colors, fonts, fontFamilies, spacing } from "../lib/theme"

export interface SectionHeaderProps {
  label: string
  size?: "sm" | "md"
}

export function SectionHeader({ label, size = "md" }: SectionHeaderProps) {
  const sizeStyles = {
    sm: { fontSize: fonts.xs },
    md: { fontSize: fonts.sm },
  }

  return (
    <Text
      style={[
        s.label,
        sizeStyles[size],
      ]}
    >
      {label.toUpperCase()}
    </Text>
  )
}

const s = StyleSheet.create({
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
})
