import { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../../lib/theme"
import { supabase } from "../../lib/supabase"
import {
  scanForStraps,
  stopScan,
  connectToStrap,
  isStrapConnected,
  type ScanResult,
} from "../../lib/ble-strap"

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i === current && styles.stepDotActive,
            i < current && styles.stepDotDone,
          ]}
        />
      ))}
    </View>
  )
}

// ── Strap icon ────────────────────────────────────────────────────────────────

function StrapIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
      {/* Watch-like rectangle */}
      <View
        style={{
          width: 28,
          height: 22,
          borderRadius: 6,
          borderWidth: 2.5,
          borderColor: color,
        }}
      />
      {/* Top band */}
      <View
        style={{
          position: "absolute",
          top: 4,
          width: 16,
          height: 8,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderWidth: 2,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
      {/* Bottom band */}
      <View
        style={{
          position: "absolute",
          bottom: 3,
          width: 16,
          height: 8,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          borderWidth: 2,
          borderColor: color,
          borderTopWidth: 0,
        }}
      />
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function StrapScreen() {
  const [bleEnabled, setBleEnabled] = useState<boolean | null>(null)
  const [scanning, setScanning] = useState(false)
  const [found, setFound] = useState<ScanResult[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", "ble_strap")
      .maybeSingle()
      .then(({ data }) => {
        const on = data?.enabled === true
        setBleEnabled(on)
        if (on) startScan()
      })
    return () => stopScan()
  }, [])

  function startScan() {
    setFound([])
    setScanning(true)
    scanForStraps((result) => {
      setFound((prev) =>
        prev.some((d) => d.id === result.id) ? prev : [...prev, result],
      )
    }, 15000).finally(() => setScanning(false))
  }

  function handleStrapEvent() {
    // Local no-op — the global handler is registered in _layout.tsx
    // after the user completes onboarding and the strap is reconnected
    console.log("ble-strap: onboarding event received")
  }

  async function handleConnect(deviceId: string) {
    setConnecting(deviceId)
    const ok = await connectToStrap(deviceId, handleStrapEvent)
    setConnecting(null)
    if (ok) setConnected(true)
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (bleEnabled === null) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.teal} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  // ── Strap not available ───────────────────────────────────────────────────

  if (bleEnabled === false) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.container}>
          <StepIndicator current={3} total={5} />

          <View style={styles.iconWrap}>
            <StrapIcon color={colors.textMuted} />
          </View>

          <Text style={styles.heading}>Mojo Strap</Text>
          <Text style={styles.subheading}>
            The Mojo Strap is coming soon. Once it ships, it will monitor for
            seizures and send automatic SOS alerts.
          </Text>

          <View style={styles.noticeCard}>
            <View style={styles.noticeDot} />
            <Text style={styles.noticeText}>
              Hardware pairing will be available in a future update. No action
              needed right now.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnSkip}
              onPress={() => router.push("./notifications")}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSkipText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // ── Connected success ─────────────────────────────────────────────────────

  if (connected) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.container}>
          <StepIndicator current={3} total={5} />

          <View style={styles.successIconWrap}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          </View>

          <Text style={styles.heading}>Strap connected!</Text>
          <Text style={styles.subheading}>
            Your Mojo Strap is paired and ready. It will monitor for fall
            events and let you trigger an SOS with the strap button.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => router.push("./notifications")}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // ── Scanning / device list ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <StepIndicator current={3} total={5} />

        <View style={styles.iconWrap}>
          <StrapIcon color={colors.teal} />
        </View>

        <Text style={styles.heading}>Pair your Mojo Strap</Text>
        <Text style={styles.subheading}>
          Make sure your strap is charged and nearby. It will appear in the
          list below automatically.
        </Text>

        {/* Scan status */}
        <View style={styles.scanStatus}>
          {scanning ? (
            <View style={styles.scanningRow}>
              <ActivityIndicator color={colors.teal} size="small" />
              <Text style={styles.scanningText}>Scanning for Mojo Strap...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.btnScanAgain}
              onPress={startScan}
              activeOpacity={0.8}
            >
              <Text style={styles.btnScanAgainText}>Scan again</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Device list */}
        {found.length === 0 && !scanning ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No straps found nearby.</Text>
            <Text style={styles.emptyHint}>
              Make sure the strap is powered on and in pairing mode.
            </Text>
          </View>
        ) : (
          <FlatList
            data={found}
            keyExtractor={(item) => item.id}
            style={styles.deviceList}
            contentContainerStyle={{ gap: spacing.sm }}
            renderItem={({ item }) => (
              <View style={styles.deviceRow}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>
                    {item.name ?? "Mojo Strap"}
                  </Text>
                  {item.rssi !== null && (
                    <Text style={styles.deviceRssi}>
                      Signal: {item.rssi} dBm
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.btnConnect,
                    connecting === item.id && styles.btnConnectDisabled,
                  ]}
                  onPress={() => handleConnect(item.id)}
                  activeOpacity={0.85}
                  disabled={connecting !== null}
                >
                  {connecting === item.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnConnectText}>Connect</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.push("./notifications")}
            style={styles.skipRow}
          >
            <Text style={styles.skipText}>Skip — I'll pair later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Step indicator
  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    alignSelf: "center",
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.teal,
    width: 20,
    borderRadius: 4,
  },
  stepDotDone: {
    backgroundColor: colors.tealMuted,
  },

  // Icon
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.xxl,
    backgroundColor: colors.tealDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.tealMuted,
  },

  // Success icon
  successIconWrap: {
    marginBottom: spacing.xxl,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(0,217,126,0.12)",
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: colors.success,
    fontSize: 36,
    fontWeight: "800",
  },

  heading: {
    fontSize: fonts.xl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  // Notice card (strap not available)
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    width: "100%",
    marginBottom: spacing.xxl,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
    marginTop: 3,
  },
  noticeText: {
    flex: 1,
    fontSize: fonts.base,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Scan status row
  scanStatus: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.lg,
    minHeight: 40,
    justifyContent: "center",
  },
  scanningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  scanningText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
  },

  // Device list
  deviceList: {
    width: "100%",
    flex: 1,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  deviceRssi: {
    fontSize: fonts.sm,
    color: colors.textMuted,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  // Buttons
  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    width: "100%",
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },

  btnSkip: {
    backgroundColor: colors.teal,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    width: "100%",
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnSkipText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },

  btnScanAgain: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnScanAgainText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: fonts.base,
  },

  btnConnect: {
    backgroundColor: colors.teal,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  btnConnectDisabled: {
    opacity: 0.6,
  },
  btnConnectText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fonts.base,
  },

  actions: {
    width: "100%",
    marginTop: "auto",
    paddingTop: spacing.lg,
  },
  skipRow: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: "600",
  },
})
