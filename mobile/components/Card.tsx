import { View, ViewStyle } from "react-native"
import { colors, radius, shadows, spacing } from "../lib/theme"

export interface CardProps {
  children: React.ReactNode
  variant?: "default" | "elevated" | "dark"
  style?: ViewStyle
}

export function Card({ children, variant = "default", style }: CardProps) {
  const variants = {
    default: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      ...shadows.sm,
    },
    elevated: {
      backgroundColor: colors.surface,
      ...shadows.md,
    },
    dark: {
      backgroundColor: colors.surfaceDark,
      ...shadows.lg,
    },
  }

  return (
    <View
      style={[
        {
          borderRadius: radius.xl,
          padding: spacing.lg,
          ...variants[variant],
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
