import { View, TouchableOpacity, Text, StyleSheet } from "react-native"
import { colors, fonts, fontFamilies, spacing } from "../lib/theme"
import { Ionicons } from "@expo/vector-icons"

export interface ListRowProps {
  icon?: string
  title: string
  subtitle?: string
  rightElement?: React.ReactNode
  onPress?: () => void
}

export function ListRow({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
}: ListRowProps) {
  const Container = onPress ? TouchableOpacity : View

  return (
    <Container
      style={s.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole={onPress ? "button" : "none"}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      {icon && <Ionicons name={icon as any} size={24} color={colors.text} />}
      <View style={s.content}>
        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={s.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
    </Container>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    minHeight: 48,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fonts.base,
    fontWeight: "600",
    color: colors.text,
    fontFamily: fontFamilies.bodySemiBold,
  },
  subtitle: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: fontFamilies.body,
  },
})
