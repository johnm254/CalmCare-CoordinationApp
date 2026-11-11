import { View, Text, StyleSheet } from "react-native"
import { colors, radius, shadows } from "../../lib/theme"

type StatTileProps = {
  value: string | number | null | undefined
  label: string
  color?: string
}

export default function StatTile({ value, label, color = colors.primary }: StatTileProps) {
  const display = value === null || value === undefined ? "—" : String(value)

  return (
    <View style={styles.tile}>
      <Text style={[styles.value, { color }]}>{display}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center",
    gap: 4,
    ...shadows.sm,
    flex: 1,
  },
  value: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: "500", textAlign: "center" },
})
