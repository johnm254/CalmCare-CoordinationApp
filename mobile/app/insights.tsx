import { useEffect, useRef, useState } from "react"

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"

import { router } from "expo-router"

import { SafeAreaView } from "react-native-safe-area-context"

import { colors, fonts, radius, spacing } from "../lib/theme"

import { useAuth } from "./_layout"

import { getInsightsSummary, logEvent } from "../lib/supabase"

type Insights = {
  this_week_events: number

  pattern: string

  suggestion: string

  med_checkins: number
}

// ─── Microphone View-based icon ───────────────────────────────────────────────

function MicrophoneIcon() {
  return (
    <View style={{ width: 24, height: 30, alignItems: "center" }}>
      {/* Mic capsule */}
      <View
        style={{
          width: 14,
          height: 18,
          borderRadius: 7,

          backgroundColor: colors.teal,
        }}
      />
      {/* Mic base arm */}
      <View
        style={{
          width: 20,
          height: 2,
          backgroundColor: colors.teal,

          borderRadius: 1,
          marginTop: 2,
        }}
      />
      {/* Stem */}
      <View
        style={{
          width: 2,
          height: 6,
          backgroundColor: colors.teal,
          borderRadius: 1,
          marginTop: 0,
        }}
      />
      {/* Base */}
      <View
        style={{
          width: 12,
          height: 2,
          backgroundColor: colors.teal,
          borderRadius: 1,
        }}
      />
    </View>
  )
}

// ─── Sound wave visualization ─────────────────────────────────────────────────

const WAVE_HEIGHTS = [4, 10, 18, 14, 22, 10, 16, 8, 20, 6, 14]

function WaveformIcon() {
  const anims = useRef(WAVE_HEIGHTS.map(() => new Animated.Value(1))).current

  useEffect(() => {
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.4,
            duration: 400 + i * 60,
            useNativeDriver: true,
          }),

          Animated.timing(anim, {
            toValue: 1,
            duration: 400 + i * 60,
            useNativeDriver: true,
          }),
        ]),
      ),
    )

    loops.forEach((l) => l.start())

    return () => loops.forEach((l) => l.stop())
  }, [])

  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 3, height: 28 }}
    >
      {WAVE_HEIGHTS.map((h, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,

            height: h,

            backgroundColor: colors.teal,

            borderRadius: 2,

            opacity: anims[i],
          }}
        />
      ))}
    </View>
  )
}

// ─── Back chevron icon ────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <View style={{ width: 10, height: 16, justifyContent: "center" }}>
      <View
        style={{
          width: 10,
          height: 10,

          borderLeftWidth: 2.5,
          borderBottomWidth: 2.5,

          borderColor: colors.text,

          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  )
}

// ─── Brain/insight icon ───────────────────────────────────────────────────────

function InsightEmptyIcon() {
  return (
    <View
      style={{
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Simple brain-like shape: two overlapping circles */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: colors.textMuted,
          position: "absolute",
          left: 0,
        }}
      />
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: colors.textMuted,
          position: "absolute",
          right: 0,
        }}
      />
    </View>
  )
}

export default function InsightsScreen() {
  const { session } = useAuth()

  const [insights, setInsights] = useState<Insights | null>(null)

  const [loading, setLoading] = useState(true)

  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [voiceNote, setVoiceNote] = useState("")
  const [savingNote, setSavingNote] = useState(false)

  const [showBriefModal, setShowBriefModal] = useState(false)

  useEffect(() => {
    if (!session?.user) return

    getInsightsSummary(session.user.id).then((data) => {
      setInsights(data)

      setLoading(false)
    })
  }, [session])

  async function handleSaveVoiceNote() {
    if (!session?.user || !voiceNote.trim()) return
    setSavingNote(true)
    try {
      await logEvent(session.user.id, "patient_note", "mild", { note: voiceNote.trim() })
      setVoiceNote("")
      setShowVoiceModal(false)
      Alert.alert("Saved", "Your note has been logged.")
    } catch {
      Alert.alert("Error", "Could not save your note. Please try again.")
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>AI Insights</Text>
          <View style={styles.liveBadge}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.teal,
                marginRight: 5,
              }}
            />
            <Text style={styles.liveBadgeText}>Live data</Text>
          </View>
        </View>

        {/* Loading */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.teal} size="large" />
          </View>
        ) : !insights ? (
          /* Empty state */

          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <InsightEmptyIcon />
            </View>
            <Text style={styles.emptyText}>No insights yet.</Text>
            <Text style={styles.emptySub}>
              Log a few events to see patterns here.
            </Text>
          </View>
        ) : (
          /* THIS WEEK insights card */

          <View style={styles.insightCard}>
            <View style={styles.insightLeftBar} />
            <View style={styles.insightContent}>
              <View style={styles.weekBadge}>
                <Text style={styles.weekBadgeText}>THIS WEEK</Text>
              </View>
              <Text style={styles.insightHeading}>
                You logged {insights.this_week_events} event
                {insights.this_week_events !== 1 ? "s" : ""}. {insights.pattern}
              </Text>
              <Text style={styles.insightBody}>
                Built from {insights.this_week_events} event log
                {insights.this_week_events !== 1 ? "s" : ""} and{" "}
                {insights.med_checkins} medication check-in
                {insights.med_checkins !== 1 ? "s" : ""}. This is a pattern, not
                a diagnosis. Talk to your clinician before changing anything.
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>
                    {insights.suggestion}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnOutlined}
                  onPress={() => router.back()}
                >
                  <Text style={styles.btnOutlinedText}>See the logs</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Log by voice card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Log by voice</Text>
            <View style={styles.amberBadge}>
              <Text style={styles.amberBadgeText}>Works offline</Text>
            </View>
          </View>
          <View style={styles.micRow}>
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => setShowVoiceModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Log a note"
            >
              <MicrophoneIcon />
            </TouchableOpacity>
            <WaveformIcon />
          </View>
          <Text style={styles.cardBody}>
            Tap the mic and type what happened. Voice transcription is coming soon.
          </Text>
        </View>

        {/* Visit brief card */}
        <View style={styles.card}>
          <View style={styles.visitBriefRow}>
            <View style={styles.visitBriefInfo}>
              <Text style={styles.cardTitle}>Visit brief is ready</Text>
              <Text style={styles.cardBodySub}>
                Review it, then share with your clinician
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => setShowBriefModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.reviewBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Voice note modal ── */}
        <Modal
          visible={showVoiceModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVoiceModal(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <Text style={styles.modalTitle}>Log a note</Text>
                <Text style={styles.modalSub}>
                  Describe what happened. It will be saved as an event log.
                </Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="e.g. Felt dizzy for about 2 minutes after lunch…"
                  placeholderTextColor={colors.textMuted}
                  value={voiceNote}
                  onChangeText={setVoiceNote}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnPrimary, !voiceNote.trim() && styles.modalBtnDisabled]}
                    onPress={handleSaveVoiceNote}
                    disabled={savingNote || !voiceNote.trim()}
                    activeOpacity={0.85}
                  >
                    {savingNote
                      ? <ActivityIndicator color="#000" size="small" />
                      : <Text style={styles.modalBtnPrimaryText}>Save note</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnOutline]}
                    onPress={() => { setShowVoiceModal(false); setVoiceNote("") }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalBtnOutlineText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── Visit brief modal ── */}
        <Modal
          visible={showBriefModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowBriefModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Visit brief</Text>
              <Text style={styles.modalSub}>
                A snapshot of your week to share with your clinician.
              </Text>
              {insights ? (
                <View style={styles.briefContent}>
                  <View style={styles.briefRow}>
                    <Text style={styles.briefLabel}>Events this week</Text>
                    <Text style={styles.briefValue}>{insights.this_week_events}</Text>
                  </View>
                  <View style={styles.briefRow}>
                    <Text style={styles.briefLabel}>Medication check-ins</Text>
                    <Text style={styles.briefValue}>{insights.med_checkins}</Text>
                  </View>
                  <View style={[styles.briefRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.briefLabel}>Pattern</Text>
                    <Text style={[styles.briefValue, { flex: 1, textAlign: "right" }]}>{insights.pattern}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.modalSub}>No data yet. Log a few events first.</Text>
              )}
              <Text style={styles.briefDisclaimer}>
                This is a draft. Review with your clinician before making any changes to your care plan.
              </Text>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, { marginTop: spacing.md }]}
                onPress={() => setShowBriefModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnPrimaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Mojo never diagnoses or changes your medication. Summaries are drafts
          built from what you and your Circle logged.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  scroll: { flex: 1 },

  container: { padding: spacing.lg, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
    justifyContent: "center",
  },

  title: { fontSize: fonts.xl, fontWeight: "700", color: colors.text, flex: 1 },

  liveBadge: {
    backgroundColor: colors.tealBadge,

    borderRadius: radius.full,

    paddingHorizontal: spacing.md,

    paddingVertical: 4,

    flexDirection: "row",

    alignItems: "center",
  },

  liveBadgeText: {
    fontSize: fonts.xs,
    color: colors.teal,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  loadingWrap: { alignItems: "center", paddingVertical: spacing.xxxl },

  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,

    borderWidth: 1,
    borderColor: colors.border,

    padding: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.md,
  },

  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,

    backgroundColor: colors.bgCardAlt,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: spacing.md,
  },

  emptyText: {
    color: colors.text,
    fontSize: fonts.md,
    fontWeight: "600",
    marginBottom: 4,
  },

  emptySub: {
    color: colors.textSecondary,
    fontSize: fonts.sm,
    textAlign: "center",
  },

  insightCard: {
    backgroundColor: colors.bgCard,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    flexDirection: "row",

    marginBottom: spacing.md,

    overflow: "hidden",
  },

  insightLeftBar: { width: 4, backgroundColor: colors.teal },

  insightContent: { flex: 1, padding: spacing.lg },

  weekBadge: {
    backgroundColor: colors.tealBadge,

    alignSelf: "flex-start",

    borderRadius: radius.full,

    paddingHorizontal: spacing.md,

    paddingVertical: 3,

    marginBottom: spacing.sm,
  },

  weekBadgeText: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.teal,
    letterSpacing: 1,
  },

  insightHeading: {
    fontSize: fonts.xl,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 30,
    marginBottom: spacing.sm,
  },

  insightBody: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },

  actionRow: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },

  btnPrimary: {
    backgroundColor: colors.teal,

    borderRadius: radius.full,

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.sm,
  },

  btnPrimaryText: { color: "#000", fontWeight: "700", fontSize: fonts.sm },

  btnOutlined: {
    borderWidth: 1,
    borderColor: colors.teal,

    borderRadius: radius.full,

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.sm,
  },

  btnOutlinedText: {
    color: colors.teal,
    fontWeight: "700",
    fontSize: fonts.sm,
  },

  card: {
    backgroundColor: colors.bgCard,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.lg,

    marginBottom: spacing.md,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  cardTitle: { fontSize: fonts.md, fontWeight: "700", color: colors.text },

  cardBody: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  cardBodySub: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  amberBadge: {
    backgroundColor: colors.amberDim,

    borderRadius: radius.full,

    paddingHorizontal: spacing.md,

    paddingVertical: 4,
  },

  amberBadgeText: {
    fontSize: fonts.xs,
    color: colors.amber,
    fontWeight: "600",
  },

  micRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },

  micBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,

    backgroundColor: colors.tealDim,

    alignItems: "center",
    justifyContent: "center",
  },

  visitBriefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  visitBriefInfo: { flex: 1 },

  reviewBtn: {
    backgroundColor: colors.teal,

    borderRadius: radius.full,

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.sm,
  },

  reviewBtnText: { color: "#000", fontWeight: "700", fontSize: fonts.sm },

  disclaimer: {
    fontSize: fonts.sm,
    color: colors.textMuted,

    textAlign: "center",
    lineHeight: 20,

    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },

  modalSub: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  noteInput: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    color: colors.text,
    fontSize: fonts.base,
    padding: spacing.md,
    minHeight: 100,
    marginBottom: spacing.lg,
  },

  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
  },

  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBtnPrimary: {
    backgroundColor: colors.teal,
  },

  modalBtnDisabled: {
    backgroundColor: colors.bgCardAlt,
  },

  modalBtnPrimaryText: {
    color: "#000",
    fontWeight: "700",
    fontSize: fonts.base,
  },

  modalBtnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalBtnOutlineText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: fonts.base,
  },

  briefContent: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },

  briefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  briefLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    flex: 1,
  },

  briefValue: {
    fontSize: fonts.sm,
    color: colors.text,
    fontWeight: "600",
  },

  briefDisclaimer: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: "center",
  },
})
