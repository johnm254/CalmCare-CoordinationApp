import { Text, StyleSheet } from "react-native"
import { colors } from "../../lib/theme"

type SectionHeaderProps = {
  title: string
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return <Text style={styles.label}>{title}</Text>
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
})
