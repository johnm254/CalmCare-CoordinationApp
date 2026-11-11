// Onboarding step 6 — Strap pairing with BLE discovery
// Spec: EPIMOYO_REDESIGN.md §5.9

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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radius, spacing } from "../../lib/theme"
import { type ScanResult } from "../../lib/ble-strap"

// Demo devices shown after simulated scan
const DEMO_DEVICES: ScanResult[] = [
  { id: "demo-strap-001", name: "EpiStrap-A1B2", rssi: -58 },
  { id: "demo-strap-002", name: "EpiStrap-C3D4", rssi: -74 },
]

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

export default function StrapScreen() {
  const insets = useSafeAreaInsets()
  const [scanning, setScanning] = useState(false)
  const [found, setFound] = useState<ScanResult[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [progress] = useState(0.75) // Step 6 of 8

  useEffect(() => {
    startScan()
  }, [])

  function startScan() {
    setFound([])
    setScanning(true)
    // Simulate a 2-second BLE discovery then surface demo devices
    setTimeout(() => {
      setFound(DEMO_DEVICES)
      setScanning(false)
    }, 2000)
  }

  async function handleConnect(deviceId: string) {
    setConnecting(deviceId)
    // Simulate 1.5-second pairing handshake
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setConnecting(null)
    setConnected(true)
  }

  function handleBack() {
    router.back()
  }

  // ── Connected success ─────────────────────────────────────────────────

  if (connected) {
    return (
      <View style={s.safe}>
        {/* Progress bar */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={s.container}>
            <View style={s.successIconWrap}>
              <View style={s.checkCircle}>
                <Ionicons name="checkmark" size={44} color={colors.success} />
              </View>
            </View>

            <Text style={s.heading}>Strap connected!</Text>
            <Text style={s.subheading}>
              Your epimoyo Strap is paired and ready. It will monitor for fall
              events and let you trigger an SOS with the strap button.
            </Text>

            {/* Connection details */}
            <View style={s.detailsBox}>
              <View style={s.detailRow}>
                <Ionicons name="battery-half-outline" size={16} color={colors.text} />
                <Text style={s.detailText}>Battery: 87%</Text>
              </View>
              <View style={s.detailRow}>
                <Ionicons name="signal-outline" size={16} color={colors.text} />
                <Text style={s.detailText}>Signal: Strong (-52 dBm)</Text>
              </View>
            </View>

            <View style={[s.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
              <TouchableOpacity
                style={s.btnPrimary}
                onPress={() => router.push("./caregiver")}
                activeOpacity={0.85}
              >
                <Text style={s.btnPrimaryText}>Continue</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // ── Scanning / device list ────────────────────────────────────────────────

  return (
    <View style={s.safe}>
      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.stepLabel}>Step 6 of 8</Text>
        <View style={{ width: 24 }} />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <View style={s.container}>
          <View style={s.iconWrap}>
            <StrapIcon color={colors.teal} />
          </View>

          <Text style={s.heading}>Pair your epimoyo Strap</Text>
          <Text style={s.subheading}>
            Make sure your strap is charged and nearby. It will appear in the list below
            automatically.
          </Text>

          {/* Scan status */}
          <View style={s.scanStatus}>
            {scanning ? (
              <View style={s.scanningRow}>
                <ActivityIndicator color={colors.teal} size="small" />
                <Text style={s.scanningText}>Scanning for epimoyo Strap...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={s.btnScanAgain}
                onPress={startScan}
                activeOpacity={0.8}
              >
                <Ionicons name="sync-outline" size={16} color={colors.text} />
                <Text style={s.btnScanAgainText}>Scan again</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Device list */}
          {found.length === 0 && !scanning ? (
            <View style={s.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyText}>No straps found nearby.</Text>
              <Text style={s.emptyHint}>
                Make sure the strap is powered on and in pairing mode.
              </Text>
            </View>
          ) : (
            <FlatList
              data={found}
              keyExtractor={(item) => item.id}
              style={s.deviceList}
              contentContainerStyle={{ gap: spacing.sm }}
              renderItem={({ item }) => (
                <View style={s.deviceRow}>
                  <View style={s.deviceIcon}>
                    <StrapIcon color={colors.teal} />
                  </View>
                  <View style={s.deviceInfo}>
                    <Text style={s.deviceName}>{item.name ?? "epimoyo Strap"}</Text>
                    {item.rssi !== null && (
                      <Text style={s.deviceRssi}>Signal: {item.rssi} dBm</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      s.btnConnect,
                      connecting === item.id && s.btnConnectDisabled,
                    ]}
                    onPress={() => handleConnect(item.id)}
                    activeOpacity={0.85}
                    disabled={connecting !== null}
                  >
                    {connecting === item.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={s.btnConnectText}>Connect</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          <View style={[s.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
            <TouchableOpacity
              onPress={() => router.push("./caregiver")}
              style={s.skipRow}
            >
              <Text style={s.skipText}>Skip — I'll pair later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  progressBar: {
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    fontSize: fonts.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },

  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.xxl,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  heading: {
    fontSize: fonts.xl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subheading: {
    fontSize: fonts.base,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },

  // Success state
  successIconWrap: {
    alignSelf: "center",
    marginVertical: spacing.lg,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  detailsBox: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  detailText: {
    fontSize: fonts.sm,
    color: colors.text,
    fontWeight: "500",
  },

  // Scan status
  scanStatus: {
    alignItems: "center",
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
    color: colors.textMuted,
  },

  btnScanAgain: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  btnScanAgainText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: fonts.sm,
  },

  // Device list
  deviceList: {
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
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: fonts.xs,
    color: colors.textMuted,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  emptyText: {
    fontSize: fonts.base,
    color: colors.text,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },

  // Buttons
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fonts.base,
  },

  btnConnect: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minWidth: 80,
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
    fontSize: fonts.sm,
  },

  actions: {
    paddingHorizontal: 0,
    paddingTop: spacing.lg,
  },
  skipRow: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    fontWeight: "600",
  },
})
