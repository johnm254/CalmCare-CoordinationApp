import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native"
import { colors, radius } from "../../lib/theme"

type ChipProps = {
  label: string
  color?: { bg: string; text: string }
  onPress?: () => void
  style?: ViewStyle
}

export default function Chip({
  label,
  color = { bg: colors.primarySoft, text: colors.primary },
  onPress,
  style,
}: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[
        styles.chip,
        { backgroundColor: color.bg },
        style,
      ]}
    >
      <Text style={[styles.label, { color: color.text }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
})
