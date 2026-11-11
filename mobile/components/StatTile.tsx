import { View, Text, StyleSheet } from "react-native"
import { colors, fonts, fontFamilies, radius, shadows, spacing } from "../lib/theme"

export interface StatTileProps {
  value: string | number
  label: string
  unit?: string
  variant?: "default" | "highlight"
}

export function StatTile({
  value,
  label,
  unit,
  variant = "default",
}: StatTileProps) {
  const variantStyles = {
    default: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    highlight: {
      backgroundColor: colors.surfaceDark,
      borderWidth: 0,
    },
  }

  const v = variantStyles[variant]
  const textColor = variant === "highlight" ? colors.textOnDark : colors.text

  return (
    <View
      style={[
        s.tile,
        v,
      ]}
    >
      <Text
        style={[
          s.value,
          { color: textColor, fontFamily: fontFamilies.display },
        ]}
      >
        {value}
      </Text>
      {unit && (
        <Text style={[s.unit, { color: textColor }]}>
          {unit}
        </Text>
      )}
      <Text style={[s.label, { color: textColor }]}>
        {label}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  tile: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    ...shadows.sm,
  },
  value: {
    fontSize: fonts.xl,
    fontWeight: "800",
    lineHeight: fonts.xl + 8,
  },
  unit: {
    fontSize: fonts.sm,
    fontWeight: "500",
    marginTop: spacing.xs,
  },
  label: {
    fontSize: fonts.xs,
    marginTop: spacing.sm,
    textAlign: "center",
  },
})
