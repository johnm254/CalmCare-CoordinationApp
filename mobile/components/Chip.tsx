import { TouchableOpacity, Text, StyleSheet } from "react-native"
import { colors, fonts, fontFamilies, radius, spacing } from "../lib/theme"

export interface ChipProps {
  label: string
  onPress?: () => void
  selected?: boolean
  variant?: "default" | "filled" | "filled-danger"
}

export function Chip({
  label,
  onPress,
  selected = false,
  variant = "default",
}: ChipProps) {
  const variants = {
    default: {
      backgroundColor: selected ? colors.primarySoft : colors.border,
      textColor: selected ? colors.primary : colors.textMuted,
    },
    filled: {
      backgroundColor: colors.primary,
      textColor: "#FFFFFF",
    },
    "filled-danger": {
      backgroundColor: colors.danger,
      textColor: "#FFFFFF",
    },
  }

  const v = variants[variant]

  return (
    <TouchableOpacity
      style={[
        s.chip,
        {
          backgroundColor: v.backgroundColor,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityRole={onPress ? "button" : "none"}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text
        style={[
          s.label,
          {
            color: v.textColor,
            fontFamily: fontFamilies.bodySemiBold,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  label: {
    fontSize: fonts.sm,
    fontWeight: "600",
  },
})
