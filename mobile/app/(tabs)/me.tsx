import { useEffect, useState, useCallback, useRef } from "react"

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Switch,
  TextInput,
  ActivityIndicator,
  Animated,
  Linking,
  Alert,
  Platform,
} from "react-native"

import { SafeAreaView } from "react-native-safe-area-context"

import { router } from "expo-router"

import * as Location from "expo-location"

import { colors, fonts, radius, spacing } from "../../lib/theme"

import { useAuth } from "../_layout"

import { supabase } from "../../lib/supabase"

import { useTranslation } from "../../lib/i18n-context"

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalKey = "language" | "notifications" | "pin" | "accessibility" | "export" | "delete" | "strap" | "addons"

type AuditEntry = {
  id: string

  action: string

  actor_role: string | null

  resource_type: string | null

  at: string
}

function formatAuditAction(action: string, actorRole: string | null): string {
  const role =
    actorRole === "clinician"
      ? "Clinician"
      : actorRole === "admin"
        ? "Admin"
        : "System"

  const map: Record<string, string> = {
    view_patient: `${role} viewed your profile`,

    view_events: `${role} viewed your health events`,

    view_alerts: `${role} viewed your alerts`,

    view_medications: `${role} viewed your medications`,

    view_followups: `${role} viewed your follow-ups`,

    break_glass: `${role} used emergency access`,
  }

  return map[action] ?? `${role}: ${action.replace(/_/g, " ")}`
}

// ─── Icon badge ───────────────────────────────────────────────────────────────

function IconBadge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <View style={[ic.badge, { backgroundColor: bg }]}>{children}</View>
}

const ic = StyleSheet.create({
  badge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
})

// ─── Bottom sheet ─────────────────────────────────────────────────────────────

function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={sh.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={sh.sheet}>
        <View style={sh.handle} />
        <View style={sh.header}>
          <Text style={sh.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={sh.closeBtn}>
            <View style={sh.closeX1} />
            <View style={sh.closeX2} />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </Modal>
  )
}

const sh = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },

  sheet: {
    backgroundColor: colors.bgCard,

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,

    borderColor: colors.border,

    paddingHorizontal: spacing.xl,
    paddingBottom: 48,

    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: "center",
    marginVertical: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },

  title: { fontSize: fonts.lg, fontWeight: "800", color: colors.text },

  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  closeX1: {
    position: "absolute",
    width: 18,
    height: 2,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },

  closeX2: {
    position: "absolute",
    width: 18,
    height: 2,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
    transform: [{ rotate: "-45deg" }],
  },
})

// ─── Language modal ───────────────────────────────────────────────────────────

const LANGUAGES = [
  { key: "en", label: "English", native: "English" },

  { key: "sw", label: "Swahili", native: "Kiswahili" },

  { key: "fr", label: "French", native: "Français" },
]

function LanguageSheet({
  visible,
  onClose,
  selected,
  onSelect,
  swahiliEnabled,
}: {
  visible: boolean
  onClose: () => void
  selected: string
  onSelect: (k: string) => void
  swahiliEnabled: boolean
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Language">
      <View style={{ gap: spacing.md }}>
        {LANGUAGES.map((lang) => {
          const isSwahili = lang.key === "sw"
          const disabled = isSwahili && !swahiliEnabled
          return (
            <TouchableOpacity
              key={lang.key}
              style={[
                opt.row,
                selected === lang.key && !disabled && opt.rowActive,
                disabled && { opacity: 0.5 },
              ]}
              onPress={() => {
                if (disabled) return
                onSelect(lang.key)
                onClose()
              }}
              activeOpacity={disabled ? 1 : 0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={opt.label}>{lang.label}</Text>
                <Text style={opt.sub}>{lang.native}</Text>
              </View>
              {disabled ? (
                <View style={opt.comingSoonBadge}>
                  <Text style={opt.comingSoonText}>Coming soon</Text>
                </View>
              ) : (
                selected === lang.key && <View style={opt.check} />
              )}
            </TouchableOpacity>
          )
        })}
        <Text style={opt.note}>
          More languages coming soon. Help us translate at
          mojo.health/translate
        </Text>
      </View>
    </Sheet>
  )
}

// ─── Notifications modal ──────────────────────────────────────────────────────

function NotificationsSheet({
  visible,
  onClose,
  meds,
  alerts,
  digest,
  onChangeMeds,
  onChangeAlerts,
  onChangeDigest,
}: {
  visible: boolean
  onClose: () => void

  meds: boolean
  alerts: boolean
  digest: boolean

  onChangeMeds: (v: boolean) => void

  onChangeAlerts: (v: boolean) => void

  onChangeDigest: (v: boolean) => void
}) {
  function SwitchRow({
    label,
    sub,
    value,
    onChange,
  }: {
    label: string
    sub: string
    value: boolean
    onChange: (v: boolean) => void
  }) {
    return (
      <View style={sw.row}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text style={sw.label}>{label}</Text>
          <Text style={sw.sub}>{sub}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{
            false: colors.toggleInactive,
            true: colors.toggleActive,
          }}
          thumbColor="#fff"
          ios_backgroundColor={colors.toggleInactive}
        />
      </View>
    )
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Notifications">
      <View style={{ gap: spacing.sm }}>
        <SwitchRow
          label="Medication reminders"
          sub="Get reminded 30 minutes before each dose."
          value={meds}
          onChange={onChangeMeds}
        />
        <View style={sw.divider} />
        <SwitchRow
          label="Emergency alerts"
          sub="Receive SOS alerts from your care circle contacts."
          value={alerts}
          onChange={onChangeAlerts}
        />
        <View style={sw.divider} />
        <SwitchRow
          label="Weekly summary"
          sub="A Sunday recap of your health week."
          value={digest}
          onChange={onChangeDigest}
        />
        <View style={[sw.divider, { marginBottom: spacing.md }]} />
        <TouchableOpacity
          style={sw.systemBtn}
          onPress={() => {
            if (Platform.OS === "ios") Linking.openURL("app-settings:")
            else Linking.openSettings()
          }}
        >
          <Text style={sw.systemBtnText}>
            Open system notification settings
          </Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  )
}

const sw = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },

  label: {
    fontSize: fonts.base,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },

  sub: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  divider: { height: 1, backgroundColor: colors.border },

  systemBtn: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,

    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  systemBtnText: { fontSize: fonts.sm, color: colors.teal, fontWeight: "600" },
})

// ─── PIN / Biometric modal ────────────────────────────────────────────────────

function PinSheet({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="PIN &amp; Biometric lock">
      <View style={{ gap: spacing.lg }}>
        <View style={pin.infoCard}>
          <View style={pin.shieldIcon}>
            <View style={pin.shieldTop} />
            <View style={pin.shieldBottom} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pin.infoTitle}>App lock</Text>
            <Text style={pin.infoText}>
              Require Face ID, fingerprint, or PIN when opening Mojo. Your data
              stays private even if someone else has your phone.
            </Text>
          </View>
        </View>
        <View style={pin.comingSoon}>
          <Text style={pin.comingSoonText}>
            Biometric lock · Coming in next update
          </Text>
        </View>
        <Text style={pin.tip}>
          Tip: Enable your phone's screen lock to protect Mojo immediately. Go
          to Settings → Security.
        </Text>
        <TouchableOpacity
          style={pin.settingsBtn}
          onPress={() => {
            if (Platform.OS === "ios") Linking.openURL("app-settings:")
            else Linking.openSettings()
          }}
        >
          <Text style={pin.settingsBtnText}>Open phone security settings</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  )
}

const pin = StyleSheet.create({
  infoCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  shieldIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  shieldTop: {
    width: 22,
    height: 16,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.teal,
    borderBottomWidth: 0,
  },

  shieldBottom: {
    width: 22,
    height: 12,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    borderWidth: 2,
    borderColor: colors.teal,
    borderTopWidth: 0,
    marginTop: -1,
  },

  infoTitle: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },

  infoText: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  comingSoon: {
    backgroundColor: colors.amberDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.amber,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  comingSoonText: {
    fontSize: fonts.sm,
    color: colors.amber,
    fontWeight: "600",
  },

  tip: { fontSize: fonts.sm, color: colors.textMuted, lineHeight: 18 },

  settingsBtn: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  settingsBtnText: {
    fontSize: fonts.sm,
    color: colors.teal,
    fontWeight: "600",
  },
})

// ─── Accessibility modal ──────────────────────────────────────────────────────

type FontSize = "small" | "medium" | "large"

function AccessibilitySheet({
  visible,
  onClose,
  fontSize,
  onSelectFont,
}: {
  visible: boolean
  onClose: () => void
  fontSize: FontSize
  onSelectFont: (s: FontSize) => void
}) {
  const sizes: { key: FontSize; label: string; preview: number }[] = [
    { key: "small", label: "Small", preview: 13 },

    { key: "medium", label: "Medium", preview: 16 },

    { key: "large", label: "Large", preview: 20 },
  ]

  return (
    <Sheet visible={visible} onClose={onClose} title="Accessibility">
      <Text style={acc.sectionLabel}>TEXT SIZE</Text>
      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
          marginBottom: spacing.xl,
        }}
      >
        {sizes.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[acc.sizeBtn, fontSize === s.key && acc.sizeBtnActive]}
            onPress={() => onSelectFont(s.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                acc.sizePreview,
                { fontSize: s.preview },
                fontSize === s.key && { color: colors.teal },
              ]}
            >
              Aa
            </Text>
            <Text
              style={[
                acc.sizeLabel,
                fontSize === s.key && { color: colors.teal },
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={acc.note}>
        <Text style={acc.noteText}>
          High-contrast mode and screen reader support are controlled by your
          device's accessibility settings.
        </Text>
      </View>
      <TouchableOpacity
        style={acc.deviceBtn}
        onPress={() => {
          if (Platform.OS === "ios") Linking.openURL("App-Prefs:ACCESSIBILITY")
          else Linking.openSettings()
        }}
      >
        <Text style={acc.deviceBtnText}>
          Open device accessibility settings
        </Text>
      </TouchableOpacity>
    </Sheet>
  )
}

const acc = StyleSheet.create({
  sectionLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },

  sizeBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    gap: 6,
  },

  sizeBtnActive: { borderColor: colors.teal, backgroundColor: colors.tealDim },

  sizePreview: { fontWeight: "700", color: colors.textSecondary },

  sizeLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  note: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  noteText: { fontSize: fonts.sm, color: colors.textMuted, lineHeight: 18 },

  deviceBtn: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  deviceBtnText: { fontSize: fonts.sm, color: colors.teal, fontWeight: "600" },
})

// ─── Export modal ─────────────────────────────────────────────────────────────

function ExportSheet({
  visible,
  onClose,
  email,
  onExport,
  loading,
  done,
}: {
  visible: boolean
  onClose: () => void
  email: string

  onExport: () => void
  loading: boolean
  done: boolean
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Export my data">
      {done ? (
        <View style={ex.doneCard}>
          <View style={ex.checkCircle}>
            <Text style={ex.checkMark}>✓</Text>
          </View>
          <Text style={ex.doneTitle}>Request submitted</Text>
          <Text style={ex.doneSub}>
            Your data export will be sent to {email} within 24 hours. This is
            your right under the Kenya Data Protection Act 2019.
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          <View style={ex.infoCard}>
            <Text style={ex.infoText}>
              We will compile all your health events, medications, care circle,
              and account data into a downloadable file and send it to:
            </Text>
            <Text style={ex.emailText}>{email}</Text>
          </View>
          <View style={ex.legalCard}>
            <Text style={ex.legalText}>
              Kenya Data Protection Act 2019 — Article 26(c) right to data
              portability.
            </Text>
          </View>
          <TouchableOpacity
            style={[ex.exportBtn, loading && { opacity: 0.6 }]}
            onPress={onExport}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={ex.exportBtnText}>Send data export</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={ex.cancelBtn}>
            <Text style={ex.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </Sheet>
  )
}

const ex = StyleSheet.create({
  doneCard: {
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },

  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successDim,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },

  checkMark: { fontSize: fonts.xl, color: colors.success, fontWeight: "800" },

  doneTitle: { fontSize: fonts.lg, fontWeight: "800", color: colors.text },

  doneSub: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  infoCard: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },

  infoText: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  emailText: { fontSize: fonts.base, color: colors.teal, fontWeight: "700" },

  legalCard: {
    backgroundColor: colors.tealDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.teal + "40",
    padding: spacing.md,
  },

  legalText: { fontSize: fonts.xs, color: colors.teal, lineHeight: 16 },

  exportBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },

  exportBtnText: { color: "#000", fontWeight: "800", fontSize: fonts.md },

  cancelBtn: { alignItems: "center", paddingVertical: spacing.sm },

  cancelText: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    fontWeight: "600",
  },
})

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteSheet({
  visible,
  onClose,
  onDelete,
  loading,
}: {
  visible: boolean
  onClose: () => void
  onDelete: () => void
  loading: boolean
}) {
  const [text, setText] = useState("")

  return (
    <Sheet visible={visible} onClose={onClose} title="Delete my account">
      <View style={{ gap: spacing.lg }}>
        <View style={del.warningCard}>
          <Text style={del.warningTitle}>This cannot be undone</Text>
          <Text style={del.warningText}>
            All your health records, care circle, and account data will be
            permanently deleted. Your clinicians will lose access immediately.
          </Text>
        </View>
        <Text style={del.instruction}>
          Type{" "}
          <Text style={{ color: colors.emergency, fontWeight: "800" }}>
            DELETE
          </Text>{" "}
          to confirm:
        </Text>
        <TextInput
          style={del.input}
          value={text}
          onChangeText={setText}
          placeholder="Type DELETE here"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[
            del.deleteBtn,
            (text !== "DELETE" || loading) && { opacity: 0.4 },
          ]}
          onPress={onDelete}
          disabled={text !== "DELETE" || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={del.deleteBtnText}>Permanently delete account</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={del.cancelBtn}>
          <Text style={del.cancelText}>Keep my account</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  )
}

const del = StyleSheet.create({
  warningCard: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.emergency + "40",
    padding: spacing.lg,
    gap: spacing.sm,
  },

  warningTitle: {
    fontSize: fonts.base,
    fontWeight: "800",
    color: colors.emergency,
  },

  warningText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  instruction: { fontSize: fonts.sm, color: colors.textSecondary },

  input: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,

    borderColor: colors.border,
    color: colors.text,
    fontSize: fonts.md,

    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,

    letterSpacing: 2,
  },

  deleteBtn: {
    backgroundColor: colors.emergency,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },

  deleteBtnText: { color: "#fff", fontWeight: "800", fontSize: fonts.base },

  cancelBtn: { alignItems: "center", paddingVertical: spacing.sm },

  cancelText: { fontSize: fonts.sm, color: colors.teal, fontWeight: "600" },
})

// ─── Mojo Strap modal ──────────────────────────────────────────────────────────

type StrapPhase = "idle" | "scanning" | "pairing" | "connected"

interface MockDevice {
  id: string
  name: string
  rssi: number
}

const MOCK_STRAP_DEVICES: MockDevice[] = [
  { id: "M1:A2:B3:C4:D5:01", name: "Mojo Strap", rssi: -52 },
  { id: "M1:A2:B3:C4:D5:02", name: "Mojo Strap (2)", rssi: -71 },
]

function rssiLabel(rssi: number) {
  if (rssi > -60) return "Strong"
  if (rssi > -75) return "Good"
  return "Weak"
}

function EpiStrapSheet({
  visible,
  onClose,
  flagEnabled,
  onConnected,
  onDisconnected,
}: {
  visible: boolean
  onClose: () => void
  flagEnabled: boolean
  onConnected: () => void
  onDisconnected: () => void
}) {
  const [phase, setPhase] = useState<StrapPhase>("idle")
  const [foundDevices, setFoundDevices] = useState<MockDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<MockDevice | null>(null)
  const [connectedDevice, setConnectedDevice] = useState<MockDevice | null>(null)
  const scanTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible && phase !== "connected") {
      setPhase("idle")
      setFoundDevices([])
      setSelectedDevice(null)
      scanTimers.current.forEach(clearTimeout)
      scanTimers.current = []
    }
  }, [visible])

  useEffect(() => {
    if (phase === "scanning") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        ]),
      ).start()
    } else {
      pulseAnim.stopAnimation()
      pulseAnim.setValue(0)
    }
  }, [phase])

  function startScan() {
    setPhase("scanning")
    setFoundDevices([])
    scanTimers.current.push(
      setTimeout(() => setFoundDevices([MOCK_STRAP_DEVICES[0]]), 900),
      setTimeout(() => setFoundDevices(MOCK_STRAP_DEVICES), 1800),
    )
  }

  function selectDevice(device: MockDevice) {
    scanTimers.current.forEach(clearTimeout)
    setSelectedDevice(device)
    setPhase("pairing")
    scanTimers.current.push(
      setTimeout(() => {
        setPhase("connected")
        setConnectedDevice(device)
        onConnected()
      }, 2200),
    )
  }

  function forgetDevice() {
    setPhase("idle")
    setFoundDevices([])
    setSelectedDevice(null)
    setConnectedDevice(null)
    onDisconnected()
  }

  const dotColor =
    phase === "connected"
      ? colors.success
      : phase === "scanning" || phase === "pairing"
        ? colors.amber
        : colors.textMuted

  return (
    <Sheet visible={visible} onClose={onClose} title="Mojo Strap">
      <View style={{ gap: spacing.lg }}>
        {!flagEnabled && (
          <View style={dev.earlyBanner}>
            <Text style={dev.earlyBannerText}>
              Early access — strap pairing not active in this build
            </Text>
          </View>
        )}

        {/* Device identity card */}
        <View style={dev.deviceCard}>
          <View style={dev.strapIcon}>
            <View style={[dev.strapBody, phase === "connected" && { borderColor: colors.success, backgroundColor: colors.successDim }]} />
            <View style={[dev.strapBand, phase === "connected" && { borderColor: colors.success }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={dev.deviceName}>
              {phase === "connected" && connectedDevice ? connectedDevice.name : "Mojo Strap"}
            </Text>
            <View style={dev.statusRow}>
              <View style={[dev.statusDot, { backgroundColor: dotColor }]} />
              <Text style={dev.statusText}>
                {phase === "idle" ? "Not paired"
                  : phase === "scanning" ? "Scanning..."
                  : phase === "pairing" ? `Pairing with ${selectedDevice?.name}...`
                  : "Connected"}
              </Text>
            </View>
          </View>
          {phase === "connected" && (
            <View style={{ alignItems: "flex-end", gap: 2 }}>
              <Text style={dev.mockStat}>87% batt</Text>
              <Text style={dev.mockStat}>72 bpm</Text>
            </View>
          )}
        </View>

        {/* ── IDLE ─────────────────────────────────────── */}
        {phase === "idle" && (
          <>
            <View style={dev.infoCard}>
              <Text style={dev.infoText}>
                The Mojo Strap automatically detects seizure patterns and sends a
                silent SOS if you are unresponsive. Requires Bluetooth.
              </Text>
            </View>
            <View style={dev.stepsCard}>
              {[
                "Make sure Bluetooth is on",
                "Hold the strap button for 3 seconds until it flashes",
                'Tap "Scan for devices" below',
              ].map((step, i) => (
                <View key={i} style={dev.step}>
                  <View style={dev.stepNum}>
                    <Text style={dev.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={dev.stepText}>{step}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={dev.pairBtn} activeOpacity={0.85} onPress={startScan}>
              <Text style={dev.pairBtnText}>Scan for devices</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── SCANNING ─────────────────────────────────── */}
        {phase === "scanning" && (
          <>
            <View style={dev.scanRow}>
              <Animated.View style={[dev.scanDot, { opacity: pulseAnim }]} />
              <Animated.View style={[dev.scanDot, {
                opacity: pulseAnim.interpolate({ inputRange: [0.2, 1], outputRange: [0.15, 0.6] }),
                transform: [{ scale: 1.4 }],
              }]} />
              <Animated.View style={[dev.scanDot, {
                opacity: pulseAnim.interpolate({ inputRange: [0.2, 1], outputRange: [0.08, 0.3] }),
                transform: [{ scale: 1.9 }],
              }]} />
              <Text style={dev.scanningText}>Scanning for devices nearby...</Text>
            </View>
            {foundDevices.length > 0 && (
              <View style={{ gap: spacing.sm }}>
                <Text style={dev.foundLabel}>Devices found</Text>
                {foundDevices.map((device) => (
                  <View key={device.id} style={dev.deviceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={dev.deviceRowName}>{device.name}</Text>
                      <Text style={dev.deviceRowSub}>Signal: {rssiLabel(device.rssi)}</Text>
                    </View>
                    <TouchableOpacity
                      style={dev.selectBtn}
                      onPress={() => selectDevice(device)}
                      activeOpacity={0.85}
                    >
                      <Text style={dev.selectBtnText}>Select</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={dev.cancelScanBtn}
              onPress={() => { scanTimers.current.forEach(clearTimeout); setPhase("idle") }}
              activeOpacity={0.85}
            >
              <Text style={dev.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── PAIRING ──────────────────────────────────── */}
        {phase === "pairing" && (
          <View style={dev.pairingCard}>
            <ActivityIndicator color={colors.teal} />
            <Text style={dev.pairingText}>Pairing with {selectedDevice?.name}...</Text>
            <Text style={dev.pairingSub}>This takes a few seconds</Text>
          </View>
        )}

        {/* ── CONNECTED ────────────────────────────────── */}
        {phase === "connected" && (
          <>
            <View style={dev.statsRow}>
              <View style={dev.statCard}>
                <Text style={dev.statVal}>87%</Text>
                <Text style={dev.statLabel}>Battery</Text>
              </View>
              <View style={dev.statCard}>
                <Text style={dev.statVal}>72</Text>
                <Text style={dev.statLabel}>BPM</Text>
              </View>
              <View style={dev.statCard}>
                <Text style={[dev.statVal, { color: colors.success }]}>On</Text>
                <Text style={dev.statLabel}>SOS trigger</Text>
              </View>
            </View>
            <View style={dev.infoCard}>
              <Text style={dev.infoText}>
                Strap is active. If you are unresponsive for more than 60 seconds
                after a detected event, it will trigger an SOS automatically.
              </Text>
            </View>
            <TouchableOpacity style={dev.forgetBtn} onPress={forgetDevice} activeOpacity={0.85}>
              <Text style={dev.forgetBtnText}>Forget device</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Sheet>
  )
}

// ─── Add-on devices modal ─────────────────────────────────────────────────────

const ADD_ONS = [
  {
    key: "bp",
    name: "Blood pressure cuff",
    status: "Not paired",
    color: colors.blue,
  },

  {
    key: "glucose",
    name: "Glucose meter",
    status: "Not paired",
    color: colors.amber,
  },

  {
    key: "scale",
    name: "Smart scale",
    status: "Not paired",
    color: colors.teal,
  },

  {
    key: "oximeter",
    name: "Pulse oximeter",
    status: "Not paired",
    color: colors.success,
  },
]

function AddOnsSheet({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Add-on devices">
      <View style={{ gap: spacing.md }}>
        {ADD_ONS.map((device) => (
          <TouchableOpacity
            key={device.key}
            style={dev.addonRow}
            onPress={() =>
              Alert.alert(
                device.name,
                'Tap "Pair" on your device and bring it close to your phone.',
              )
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                dev.addonDot,
                {
                  backgroundColor: device.color + "22",
                  borderColor: device.color + "55",
                },
              ]}
            >
              <View
                style={[dev.addonDotInner, { backgroundColor: device.color }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={dev.deviceName}>{device.name}</Text>
              <Text style={dev.statusText}>{device.status}</Text>
            </View>
            <View style={dev.pairChip}>
              <Text style={dev.pairChipText}>Pair</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Text style={dev.addonNote}>
          Connected devices send readings automatically when in range. Data
          stays on your device and is shared only with your care circle if you
          grant access.
        </Text>
      </View>
    </Sheet>
  )
}

const dev = StyleSheet.create({
  deviceCard: {
    flexDirection: "row",
    gap: spacing.lg,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
  },

  strapIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  strapBody: {
    width: 28,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.teal,
    backgroundColor: colors.tealDim,
  },

  strapBand: {
    width: 12,
    height: 10,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: colors.teal,
    marginTop: -2,
    opacity: 0.5,
  },

  deviceName: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  statusDot: { width: 7, height: 7, borderRadius: 4 },

  statusText: { fontSize: fonts.sm, color: colors.textSecondary },

  infoCard: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  infoText: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  stepsCard: { gap: spacing.md },

  step: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },

  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.tealDim,
    borderWidth: 1,
    borderColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },

  stepNumText: { fontSize: fonts.xs, fontWeight: "800", color: colors.teal },

  stepText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },

  pairBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },

  pairBtnText: { color: "#000", fontWeight: "800", fontSize: fonts.md },

  earlyBanner: {
    backgroundColor: colors.amberDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.amber,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  earlyBannerText: { fontSize: fonts.xs, color: colors.amber, textAlign: "center" },

  mockStat: { fontSize: fonts.xs, color: colors.textSecondary, fontWeight: "600" },

  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
    position: "absolute",
    left: 0,
  },
  scanningText: { fontSize: fonts.sm, color: colors.textSecondary, marginLeft: 28 },

  foundLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  deviceRowName: { fontSize: fonts.base, fontWeight: "700", color: colors.text },
  deviceRowSub: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2 },
  selectBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  selectBtnText: { fontSize: fonts.sm, fontWeight: "700", color: "#000" },

  cancelScanBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  cancelScanText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: "600" },

  pairingCard: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pairingText: { fontSize: fonts.base, fontWeight: "700", color: colors.text },
  pairingSub: { fontSize: fonts.sm, color: colors.textSecondary },

  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  statVal: { fontSize: fonts.lg, fontWeight: "800", color: colors.teal },
  statLabel: { fontSize: fonts.xs, color: colors.textMuted, textAlign: "center" },

  forgetBtn: {
    borderWidth: 1.5,
    borderColor: colors.emergency,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  forgetBtnText: { fontSize: fonts.sm, fontWeight: "700", color: colors.emergency },

  addonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  addonDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  addonDotInner: { width: 12, height: 12, borderRadius: 6 },

  pairChip: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.teal,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },

  pairChipText: { fontSize: fonts.xs, color: colors.teal, fontWeight: "700" },

  addonNote: { fontSize: fonts.xs, color: colors.textMuted, lineHeight: 16 },
})

const opt = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  rowActive: { borderColor: colors.teal, backgroundColor: colors.tealDim },

  label: { fontSize: fonts.base, fontWeight: "600", color: colors.text },

  sub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },

  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.teal,
    borderWidth: 2,
    borderColor: colors.teal,
  },

  note: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    lineHeight: 16,
    paddingTop: spacing.sm,
  },

  comingSoonBadge: {
    backgroundColor: colors.amberDim,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.amber,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },

  comingSoonText: {
    fontSize: fonts.xs,
    color: colors.amber,
    fontWeight: "700",
  },
})

// ─── Setting row ──────────────────────────────────────────────────────────────

function SettingRow({
  iconBg,
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  iconBg: string
  icon: React.ReactNode
  label: string
  value?: string
  onPress: () => void
  danger?: boolean
}) {
  return (
    <TouchableOpacity
      style={s.row}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
    >
      <IconBadge bg={iconBg}>{icon}</IconBadge>
      <View style={s.rowText}>
        <Text style={[s.rowLabel, danger && { color: colors.emergency }]}>
          {label}
        </Text>
      </View>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      <View
        style={[s.chevron, danger && { borderColor: colors.emergency + "80" }]}
      />
    </TouchableOpacity>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionAccent} />
      <Text style={s.sectionLabel}>{title}</Text>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MeScreen() {
  const { profile, session } = useAuth()

  const { locale, setLocale } = useTranslation()

  // Modal

  const [openModal, setOpenModal] = useState<ModalKey | null>(null)

  // Location permission

  const [locationStatus, setLocationStatus] =
    useState<Location.PermissionStatus | null>(null)

  // Settings state

  const [language, setLanguage] = useState<string>(locale)

  const [swahiliEnabled, setSwahiliEnabled] = useState(false)

  const [notifMeds, setNotifMeds] = useState(true)

  const [notifAlerts, setNotifAlerts] = useState(true)

  const [notifDigest, setNotifDigest] = useState(false)

  const [fontSize, setFontSize] = useState<FontSize>("medium")

  // Export state

  const [exporting, setExporting] = useState(false)

  const [exportDone, setExportDone] = useState(false)

  // Delete state

  const [deleting, setDeleting] = useState(false)

  // Audit log

  const [showLog, setShowLog] = useState(false)

  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])

  const [loadingLog, setLoadingLog] = useState(false)

  // Strap
  const [strapConnected, setStrapConnected] = useState(false)
  const [bleStrapEnabled, setBleStrapEnabled] = useState(true)

  const initials = (profile?.full_name ?? "U")

    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const email = session?.user?.email ?? ""

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then((r) =>
      setLocationStatus(r.status),
    )
    supabase
      .from("feature_flags")
      .select("enabled")
      .eq("name", "ble_strap")
      .maybeSingle()
      .then(({ data }) => {
        if (data != null) setBleStrapEnabled(data.enabled)
      })
    supabase
      .from("feature_flags")
      .select("enabled")
      .eq("name", "swahili_ui")
      .maybeSingle()
      .then(({ data }) => {
        if (data != null) setSwahiliEnabled(data.enabled)
      })
  }, [])

  async function requestLocation() {
    const r = await Location.requestForegroundPermissionsAsync()

    setLocationStatus(r.status)
  }

  async function loadAuditLog() {
    if (!session?.user) return

    setLoadingLog(true)

    const { data } = await supabase

      .from("audit_log")

      .select("id, action, actor_role, resource_type, at")

      .eq("patient_id", session.user.id)

      .order("at", { ascending: false })

      .limit(20)

    setAuditLog(data ?? [])

    setLoadingLog(false)
  }

  async function handleExport() {
    if (!session?.user) return

    setExporting(true)

    try {
      await supabase
        .from("profiles")

        .update({ data_export_requested_at: new Date().toISOString() })

        .eq("id", session.user.id)

      setExportDone(true)
    } catch {
      Alert.alert("Error", "Could not submit request. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (!session?.user) return

    setDeleting(true)

    try {
      await supabase
        .from("profiles")

        .update({ deletion_requested_at: new Date().toISOString() })

        .eq("id", session.user.id)

      await supabase.auth.signOut()
    } catch {
      Alert.alert(
        "Error",
        "Could not process request. Contact support@mojo.health",
      )
    } finally {
      setDeleting(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()

    router.replace("/(auth)/login")
  }

  const LANG_LABEL: Record<string, string> = {
    en: "English",
    sw: "Kiswahili",
    fr: "Français",
  }

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.profileGlow} />
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={s.onlineDot} />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{profile?.full_name ?? "—"}</Text>
            <Text style={s.profileEmail}>{email}</Text>
            <View style={s.roleBadge}>
              <Text style={s.roleBadgeText}>
                {(profile?.role ?? "patient").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* GPS permission banner */}
        {locationStatus !== null &&
          locationStatus !== Location.PermissionStatus.GRANTED && (
            <TouchableOpacity
              style={s.gpsBanner}
              onPress={requestLocation}
              activeOpacity={0.85}
            >
              <View style={s.gpsIconWrap}>
                <View style={s.gpsCircle} />
                <View style={s.gpsDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.gpsBannerTitle}>Location access needed</Text>
                <Text style={s.gpsBannerSub}>
                  Required for SOS alerts to share your position
                </Text>
              </View>
              <View style={s.grantChip}>
                <Text style={s.grantChipText}>Grant</Text>
              </View>
            </TouchableOpacity>
          )}

        {/* Safety statement */}
        <View style={s.safetyCard}>
          <Text style={s.safetyText}>
            Mojo helps you and your care team watch trends. It does not
            diagnose or treat any condition. In an emergency, press SOS or call
            emergency services.
          </Text>
        </View>

        {/* Crisis resources */}
        <SectionHeader title="CRISIS RESOURCES" />
        <View style={s.card}>
          <TouchableOpacity
            style={s.crisisRow}
            onPress={() => Linking.openURL("tel:+254722178177")}
            accessibilityRole="button"
            accessibilityLabel="Call Befrienders Kenya"
          >
            <View style={[s.crisisDot]} />
            <View style={{ flex: 1 }}>
              <Text style={s.crisisName}>Befrienders Kenya</Text>
              <Text style={s.crisisPhone}>+254 722 178 177</Text>
            </View>
            <View style={s.callChip}>
              <Text style={s.callChipText}>Call</Text>
            </View>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity
            style={s.crisisRow}
            onPress={() => Linking.openURL("tel:999")}
            accessibilityRole="button"
            accessibilityLabel="Call emergency services"
          >
            <View style={[s.crisisDot]} />
            <View style={{ flex: 1 }}>
              <Text style={s.crisisName}>Emergency services</Text>
              <Text style={s.crisisPhone}>999 / 112</Text>
            </View>
            <View style={s.callChip}>
              <Text style={s.callChipText}>Call</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <SectionHeader title="PRIVACY" />
        <View style={s.card}>
          <View style={s.privacyRow}>
            <View style={s.privacyDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Mood data is private by default</Text>
              <Text style={s.privacyBody}>
                Only you and your linked doctor can see your mood logs. Caregivers
                cannot access mood data unless you explicitly grant permission.
              </Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.privacyRow}>
            <View style={[s.privacyDot, { backgroundColor: colors.blue }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Location is only shared during SOS</Text>
              <Text style={s.privacyBody}>
                Your GPS is never tracked in the background. It is only shared
                with your Care Circle when you activate an SOS alert.
              </Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <SectionHeader title="ACCOUNT" />
        <View style={s.card}>
          {/* Activity log — expandable */}
          <TouchableOpacity
            style={s.row}
            onPress={() => {
              if (!showLog) loadAuditLog()
              setShowLog((v) => !v)
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <IconBadge bg="rgba(139,92,246,0.12)">
              <View
                style={{
                  width: 14,
                  height: 10,
                  borderRadius: 2,
                  borderWidth: 1.5,
                  borderColor: colors.teal,
                }}
              />
            </IconBadge>
            <View style={s.rowText}>
              <Text style={s.rowLabel}>Activity log</Text>
            </View>
            <Text style={s.rowValue}>Who viewed your data</Text>
            <View
              style={[
                s.chevron,
                { transform: [{ rotate: showLog ? "135deg" : "45deg" }] },
              ]}
            />
          </TouchableOpacity>

          {showLog && (
            <View style={s.logContainer}>
              {loadingLog ? (
                <ActivityIndicator
                  size="small"
                  color={colors.teal}
                  style={{ marginVertical: 12 }}
                />
              ) : auditLog.length === 0 ? (
                <Text style={s.logEmpty}>No access events recorded yet.</Text>
              ) : (
                auditLog.map((entry) => (
                  <View key={entry.id} style={s.logEntry}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.logAction}>
                        {formatAuditAction(entry.action, entry.actor_role)}
                      </Text>
                      {entry.resource_type ? (
                        <Text style={s.logResource}>{entry.resource_type}</Text>
                      ) : null}
                    </View>
                    <Text style={s.logTime}>
                      {new Date(entry.at).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={s.divider} />
          <SettingRow
            iconBg="rgba(59,130,246,0.12)"
            icon={
              <View
                style={{
                  width: 14,
                  height: 12,
                  borderRadius: 2,
                  borderWidth: 1.5,
                  borderColor: colors.blue,
                }}
              />
            }
            label="Export my data"
            value="Kenya DPA right"
            onPress={() => {
              setExportDone(false)
              setOpenModal("export")
            }}
          />
          <View style={s.divider} />
          <SettingRow
            iconBg="rgba(239,68,68,0.10)"
            icon={
              <View
                style={{
                  width: 12,
                  height: 14,
                  borderRadius: 2,
                  borderWidth: 1.5,
                  borderColor: colors.emergency,
                }}
              />
            }
            label="Delete my account"
            onPress={() => setOpenModal("delete")}
            danger
          />
        </View>

        {/* Devices */}
        <SectionHeader title="DEVICES" />
        <View style={s.card}>
          <SettingRow
            iconBg="rgba(139,92,246,0.12)"
            icon={
              <View
                style={{
                  width: 18,
                  height: 12,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: colors.teal,
                }}
              />
            }
            label="Mojo Strap"
            value={strapConnected ? "Connected" : "Not paired"}
            onPress={() => setOpenModal("strap")}
          />
          <View style={s.divider} />
          <SettingRow
            iconBg="rgba(244,184,96,0.12)"
            icon={
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <View
                  style={{
                    width: 12,
                    height: 2,
                    backgroundColor: colors.amber,
                    borderRadius: 1,
                  }}
                />
                <View
                  style={{
                    width: 2,
                    height: 12,
                    backgroundColor: colors.amber,
                    borderRadius: 1,
                    position: "absolute",
                  }}
                />
              </View>
            }
            label="Add-on devices"
            value="BP cuff, glucose, scale"
            onPress={() => setOpenModal("addons")}
          />
        </View>

        {/* Settings */}
        <SectionHeader title="SETTINGS" />
        <View style={s.card}>
          <SettingRow
            iconBg="rgba(59,130,246,0.12)"
            icon={
              <Text
                style={{ fontSize: 13, color: colors.blue, fontWeight: "800" }}
              >
                A
              </Text>
            }
            label="Language"
            value={LANG_LABEL[language]}
            onPress={() => setOpenModal("language")}
          />
          <View style={s.divider} />
          <SettingRow
            iconBg="rgba(139,92,246,0.12)"
            icon={
              <View style={{ gap: 3 }}>
                <View
                  style={{
                    width: 14,
                    height: 2,
                    backgroundColor: colors.teal,
                    borderRadius: 1,
                  }}
                />
                <View
                  style={{
                    width: 10,
                    height: 2,
                    backgroundColor: colors.teal,
                    borderRadius: 1,
                  }}
                />
              </View>
            }
            label="Notifications"
            value={
              [notifMeds && "Meds", notifAlerts && "Alerts"]
                .filter(Boolean)
                .join(" · ") || "Off"
            }
            onPress={() => setOpenModal("notifications")}
          />
          <View style={s.divider} />
          <SettingRow
            iconBg="rgba(244,184,96,0.10)"
            icon={
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 14,
                    height: 9,
                    borderRadius: 7,
                    borderWidth: 1.5,
                    borderColor: colors.amber,
                    borderBottomWidth: 0,
                  }}
                />
                <View
                  style={{
                    width: 18,
                    height: 11,
                    borderRadius: 3,
                    borderWidth: 1.5,
                    borderColor: colors.amber,
                    marginTop: -1,
                  }}
                />
              </View>
            }
            label="PIN / Biometric lock"
            onPress={() => setOpenModal("pin")}
          />
          <View style={s.divider} />
          <SettingRow
            iconBg="rgba(59,130,246,0.10)"
            icon={
              <Text
                style={{ fontSize: 12, color: colors.blue, fontWeight: "800" }}
              >
                Aa
              </Text>
            }
            label="Accessibility"
            value={`Text: ${fontSize}`}
            onPress={() => setOpenModal("accessibility")}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={s.signOutBtn}
          onPress={handleSignOut}
          accessibilityRole="button"
        >
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Mojo v1.0</Text>
      </ScrollView>

      {/* Modals */}
      <LanguageSheet
        visible={openModal === "language"}
        onClose={() => setOpenModal(null)}
        selected={language}
        onSelect={(k) => {
          setLanguage(k)
          if (k === "en" || k === "sw") setLocale(k)
        }}
        swahiliEnabled={swahiliEnabled}
      />
      <NotificationsSheet
        visible={openModal === "notifications"}
        onClose={() => setOpenModal(null)}
        meds={notifMeds}
        alerts={notifAlerts}
        digest={notifDigest}
        onChangeMeds={setNotifMeds}
        onChangeAlerts={setNotifAlerts}
        onChangeDigest={setNotifDigest}
      />
      <PinSheet
        visible={openModal === "pin"}
        onClose={() => setOpenModal(null)}
      />
      <AccessibilitySheet
        visible={openModal === "accessibility"}
        onClose={() => setOpenModal(null)}
        fontSize={fontSize}
        onSelectFont={setFontSize}
      />
      <ExportSheet
        visible={openModal === "export"}
        onClose={() => setOpenModal(null)}
        email={email}
        onExport={handleExport}
        loading={exporting}
        done={exportDone}
      />
      <DeleteSheet
        visible={openModal === "delete"}
        onClose={() => setOpenModal(null)}
        onDelete={handleDelete}
        loading={deleting}
      />
      <EpiStrapSheet
        visible={openModal === "strap"}
        onClose={() => setOpenModal(null)}
        flagEnabled={bleStrapEnabled}
        onConnected={() => setStrapConnected(true)}
        onDisconnected={() => setStrapConnected(false)}
      />
      <AddOnsSheet
        visible={openModal === "addons"}
        onClose={() => setOpenModal(null)}
      />
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  scroll: { flex: 1 },

  container: { padding: spacing.xl, paddingBottom: spacing.xxxl },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,

    backgroundColor: colors.bgCard,

    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,

    padding: spacing.xl,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },

  profileGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,

    borderRadius: 60,
    backgroundColor: colors.tealDim,
  },

  avatarWrap: { position: "relative", flexShrink: 0 },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,

    backgroundColor: colors.tealMuted,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 2,
    borderColor: colors.teal,
  },

  avatarText: { color: colors.teal, fontWeight: "800", fontSize: fonts.xl },

  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,

    width: 13,
    height: 13,
    borderRadius: 7,

    backgroundColor: colors.success,

    borderWidth: 2,
    borderColor: colors.bgCard,
  },

  profileInfo: { flex: 1 },

  profileName: {
    fontSize: fonts.lg,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },

  profileEmail: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.tealBadge,

    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },

  roleBadgeText: {
    fontSize: fonts.xs,
    color: colors.teal,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  gpsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,

    backgroundColor: colors.amberDim,
    borderRadius: radius.lg,
    borderWidth: 1,

    borderColor: colors.amber + "60",
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },

  gpsIconWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  gpsCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.amber,
    position: "absolute",
  },

  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amber,
  },

  gpsBannerTitle: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.amber,
    marginBottom: 2,
  },

  gpsBannerSub: { fontSize: fonts.xs, color: colors.textSecondary },

  grantChip: {
    backgroundColor: colors.amber,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },

  grantChipText: { fontSize: fonts.xs, color: "#000", fontWeight: "800" },

  safetyCard: {
    backgroundColor: colors.tealDim,
    borderRadius: radius.md,
    borderWidth: 1,

    borderColor: colors.teal + "40",
    padding: spacing.md,
    marginBottom: spacing.xl,
  },

  safetyText: {
    fontSize: fonts.sm,
    color: colors.teal,
    lineHeight: 18,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  sectionAccent: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.teal,
  },

  sectionLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 34 + spacing.md,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    minHeight: 56,
  },

  rowText: { flex: 1 },

  rowLabel: { fontSize: fonts.base, color: colors.text, fontWeight: "500" },

  rowValue: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    flexShrink: 1,
    textAlign: "right",
    maxWidth: 120,
  },

  chevron: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: colors.textMuted,
    transform: [{ rotate: "45deg" }],
  },

  crisisRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    minHeight: 56,
    gap: spacing.md,
  },

  crisisDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emergency,
    flexShrink: 0,
  },

  crisisName: {
    fontSize: fonts.base,
    color: colors.text,
    fontWeight: "600",
    marginBottom: 2,
  },

  crisisPhone: { fontSize: fonts.sm, color: colors.textSecondary },

  callChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.emergency + "60",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },

  callChipText: {
    fontSize: fonts.xs,
    color: colors.emergency,
    fontWeight: "700",
  },

  logContainer: {
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 2,
  },

  logEntry: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 5,
  },

  logAction: { fontSize: fonts.sm, color: colors.text, fontWeight: "500" },

  logResource: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 1 },

  logTime: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    flexShrink: 0,
    marginLeft: spacing.sm,
  },

  logEmpty: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.md,
  },

  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  privacyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
    marginTop: 4,
    flexShrink: 0,
  },

  privacyBody: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 3,
  },

  signOutBtn: {
    marginTop: spacing.xxl,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,

    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
  },

  signOutText: {
    fontSize: fonts.md,
    color: colors.emergency,
    fontWeight: "700",
  },

  version: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fonts.xs,
    marginTop: spacing.xl,
  },
})
