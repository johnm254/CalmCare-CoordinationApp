import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native"
import { colors, radius, shadows } from "../../lib/theme"

type CardProps = {
  children: React.ReactNode
  style?: ViewStyle
  dark?: boolean
  onPress?: () => void
}

export default function Card({ children, style, dark, onPress }: CardProps) {
  const baseStyle = [
    styles.card,
    dark ? styles.cardDark : styles.cardLight,
    style,
  ]

  if (onPress) {
    return (
      <TouchableOpacity style={baseStyle} onPress={onPress} activeOpacity={0.82}>
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={baseStyle}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    ...shadows.sm,
  },
  cardLight: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardDark: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.surfaceDark,
    ...shadows.md,
  },
})
