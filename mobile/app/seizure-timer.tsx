// Seizure timer screen — tracks elapsed time during seizure
// Shows first-aid tips rotating, 5-minute alert, detail form on end
// Spec: EPIMOYO_REDESIGN.md §5.2

import { useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
} from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../lib/theme"
import { useAuth } from "./_layout"
import { useHaptics } from "../lib/use-haptics"
import { Card, Button, Chip } from "../components"
import { supabase } from "../lib/supabase"

const TIPS = [
  "Keep them safe from injury",
  "Do not put anything in their mouth",
  "Turn them on their side when movements stop",
]

const TRIGGER_OPTIONS = [
  "Missed dose",
  "Poor sleep",
  "Stress",
  "Illness",
  "Alcohol",
  "Flashing lights",
  "Other",
]

type TimerState = "running" | "detail" | "saved"

type SeizureType = "tonic-clonic" | "absence" | "focal" | "generalized" | "not-sure"

interface SeizureDetail {
  type: SeizureType
  duration: number
  awareness: boolean | null
  triggers: string[]
  notes: string
}

export default function SeizureTimerScreen() {
  const { session } = useAuth()
  const insets = useSafeAreaInsets()
  const haptics = useHaptics()
  const [timerState, setTimerState] = useState<TimerState>("running")
  const [elapsed, setElapsed] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [detail, setDetail] = useState<SeizureDetail>({
    type: "not-sure",
    duration: 0,
    awareness: null,
    triggers: [],
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [fiveMinAlertShown, setFiveMinAlertShown] = useState(false)

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const opacityAnim = useRef(new Animated.Value(1)).current

  // Start timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1

        // At 5 minutes, show alert
        if (next === 300 && !fiveMinAlertShown) {
          setFiveMinAlertShown(true)
          haptics.strong()
          Alert.alert(
            "This seizure has lasted 5 minutes",
            "Call emergency services now.",
            [
              { text: "Call 999", onPress: () => {} }, // Implement calling
              { text: "Call 112", onPress: () => {} },
              { text: "Dismiss", onPress: () => {} },
            ],
          )
        }

        return next
      })
    }, 1000)

    // Rotate tips every 10 seconds
    tipIntervalRef.current = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length)
    }, 10000)

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current)
    }
  }, [fiveMinAlertShown])

  // Animate tip entrance
  useEffect(() => {
    opacityAnim.setValue(0.5)
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [tipIndex])

  function handleSeizureEnded() {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    if (tipIntervalRef.current) clearInterval(tipIntervalRef.current)

    setDetail((prev) => ({ ...prev, duration: elapsed }))
    setShowDetail(true)
  }

  async function handleSave() {
    if (!session?.user) return

    setSaving(true)

    try {
      // Save seizure event
      const { error } = await supabase.from("events").insert({
        patient_id: session.user.id,
        logged_by: session.user.id,
        event_type: detail.type,
        severity: "mild",
        occurred_at: new Date(Date.now() - elapsed * 1000).toISOString(),
        details: {
          duration_seconds: detail.duration,
          awareness: detail.awareness,
          triggers: detail.triggers,
          notes: detail.notes,
        },
      })

      if (error) throw error

      // Success haptic (spec §5.4)
      haptics.success()

      setTimerState("saved")
      setTimeout(() => {
        router.back()
      }, 2000)
    } catch (err) {
      console.error("Failed to save seizure:", err)
      haptics.error()
      Alert.alert("Error", "Could not save seizure. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleSkip() {
    router.back()
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

  // Timer running state
  if (timerState === "running" && !showDetail) {
    return (
      <View style={[s.safe, { backgroundColor: colors.surfaceDark }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.surfaceDark} />
        <SafeAreaView style={s.container} edges={["top", "bottom"]}>
          <View style={s.content}>
            {/* Timer display */}
            <View style={s.timerBox}>
              <Text style={s.timerText}>{timeStr}</Text>
            </View>

            {/* First-aid tip */}
            <Animated.View style={[s.tipBox, { opacity: opacityAnim }]}>
              <Ionicons name="information-circle" size={24} color={colors.textOnDark} />
              <Text style={s.tipText}>{TIPS[tipIndex]}</Text>
            </Animated.View>

            {/* Seizure ended button */}
            <TouchableOpacity
              style={s.endedBtn}
              onPress={handleSeizureEnded}
              activeOpacity={0.85}
            >
              <Text style={s.endedBtnText}>Seizure ended</Text>
            </TouchableOpacity>

            {/* Alert my care circle option */}
            <TouchableOpacity style={s.alertOption} activeOpacity={0.8}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.textOnDark} />
              <Text style={s.alertOptionText}>Alert my care circle</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // Detail form state
  if (showDetail) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[s.formContainer, { paddingBottom: insets.bottom + spacing.xl }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.formTitle}>Seizure details</Text>
            <Text style={s.formSubtitle}>Duration: {detail.duration}s</Text>

            {/* Type selector */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Type</Text>
              <View style={s.typeGrid}>
                {(
                  [
                    { value: "tonic-clonic", label: "Tonic-clonic" },
                    { value: "absence", label: "Absence" },
                    { value: "focal", label: "Focal" },
                    { value: "generalized", label: "Generalized" },
                    { value: "not-sure", label: "Not sure" },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      s.typeBtn,
                      detail.type === opt.value && s.typeBtnSelected,
                    ]}
                    onPress={() => setDetail((prev) => ({ ...prev, type: opt.value }))}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.typeBtnText,
                        detail.type === opt.value && s.typeBtnTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Awareness */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Awareness</Text>
              <View style={s.awarenessRow}>
                {[
                  { value: true, label: "Aware" },
                  { value: false, label: "Not aware" },
                  { value: null, label: "Not sure" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[
                      s.awarenessBtn,
                      detail.awareness === opt.value && s.awarenessBtnSelected,
                    ]}
                    onPress={() => setDetail((prev) => ({ ...prev, awareness: opt.value }))}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.awarenessBtnText,
                        detail.awareness === opt.value && s.awarenessBtnTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Triggers */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Possible triggers</Text>
              <View style={s.triggerGrid}>
                {TRIGGER_OPTIONS.map((trigger) => (
                  <Chip
                    key={trigger}
                    label={trigger}
                    selected={detail.triggers.includes(trigger)}
                    onPress={() => {
                      setDetail((prev) => ({
                        ...prev,
                        triggers: prev.triggers.includes(trigger)
                          ? prev.triggers.filter((t) => t !== trigger)
                          : [...prev.triggers, trigger],
                      }))
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Notes (optional)</Text>
              <TextInput
                style={s.notesInput}
                placeholder="Any additional details..."
                placeholderTextColor={colors.textMuted}
                value={detail.notes}
                onChangeText={(text) =>
                  setDetail((prev) => ({ ...prev, notes: text }))
                }
                multiline
              />
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={[s.buttonRow, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Button
              label="Skip details"
              variant="secondary"
              onPress={handleSkip}
              disabled={saving}
            />
            <Button
              label={saving ? "Saving..." : "Save"}
              variant="primary"
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // Saved state
  if (timerState === "saved") {
    return (
      <View style={[s.safe, { backgroundColor: colors.bg }]}>
        <SafeAreaView style={s.centerContainer} edges={["top"]}>
          <View style={s.savedContent}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
            <Text style={s.savedTitle}>Logged</Text>
            <Text style={s.savedSub}>Thanks, this helps your care team spot patterns.</Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  return null
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, justifyContent: "space-between", paddingHorizontal: spacing.xl },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.xl },
  timerBox: {
    alignItems: "center",
    gap: spacing.md,
  },
  timerText: {
    fontSize: 80,
    fontWeight: "800",
    color: colors.textOnDark,
    fontFamily: "Courier New",
    fontVariant: ["tabular-nums"] as any,
  },
  tipBox: {
    gap: spacing.md,
    alignItems: "center",
  },
  tipText: {
    fontSize: fonts.lg,
    color: colors.textOnDark,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 280,
  },
  endedBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minWidth: 200,
    alignItems: "center",
  },
  endedBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fonts.base,
  },
  alertOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  alertOptionText: {
    color: colors.textOnDark,
    fontWeight: "600",
    fontSize: fonts.base,
  },
  formContainer: { padding: spacing.xl, gap: spacing.lg },
  formTitle: {
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
  },
  formSubtitle: {
    fontSize: fonts.sm,
    color: colors.textMuted,
  },
  section: { gap: spacing.md },
  sectionLabel: {
    fontSize: fonts.sm,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    minWidth: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  typeBtnSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  typeBtnText: {
    fontSize: fonts.xs,
    fontWeight: "600",
    color: colors.text,
  },
  typeBtnTextSelected: {
    color: colors.primary,
  },
  awarenessRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  awarenessBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  awarenessBtnSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  awarenessBtnText: {
    fontSize: fonts.sm,
    fontWeight: "600",
    color: colors.text,
  },
  awarenessBtnTextSelected: {
    color: colors.primary,
  },
  triggerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: fonts.sm,
    color: colors.text,
    minHeight: 100,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  savedContent: {
    alignItems: "center",
    gap: spacing.lg,
  },
  savedTitle: {
    fontSize: fonts.xxl,
    fontWeight: "700",
    color: colors.text,
  },
  savedSub: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 280,
  },
})
