import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native"
import { colors, fonts, fontFamilies, radius, spacing, shadows } from "../lib/theme"

export interface ButtonProps {
  label: string
  onPress: () => void
  variant?: "primary" | "secondary" | "danger"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: fonts.sm },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: fonts.base },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, fontSize: fonts.md },
  }

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      pressedBg: colors.primary + "CC",
    },
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
      pressedBg: colors.primarySoft,
    },
    danger: {
      backgroundColor: colors.danger,
      pressedBg: colors.danger + "CC",
    },
  }

  const variant_ = variantStyles[variant]
  const size_ = sizeStyles[size]

  return (
    <TouchableOpacity
      style={[
        s.btn,
        {
          ...size_,
          backgroundColor: disabled ? colors.border : variant_.backgroundColor,
          borderWidth: variant_.borderWidth ?? 0,
          borderColor: variant_.borderColor,
          borderRadius: radius.full,
          opacity: disabled ? 0.5 : 1,
          ...shadows.sm,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text
        style={[
          s.text,
          {
            fontSize: size_.fontSize,
            color: variant === "secondary" ? colors.text : "#FFFFFF",
            fontFamily: fontFamilies.bodyBold,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    minWidth: 48,
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.3,
  },
})
