// Map screen — disabled until a Google Maps API key is configured.
// The full implementation (live location, SOS history, weather overlay) is in
// git history. To restore it: add GOOGLE_MAPS_API_KEY to .env.local, update
// android/app/src/main/AndroidManifest.xml, and revert this file.

import { StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, spacing } from "../../lib/theme"

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Map coming soon</Text>
        <Text style={styles.sub}>
          A Google Maps API key is required to enable the live location map.
          Contact your administrator.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: {
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
})
