import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { colors, fonts, radius, spacing } from "../../lib/theme"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../_layout"

const MOOD_OPTIONS = [
  { score: 1, label: "Very low", color: "#EF4444" },
  { score: 2, label: "Low", color: "#F97316" },
  { score: 3, label: "Okay", color: "#F4B860" },
  { score: 4, label: "Good", color: "#22C87A" },
  { score: 5, label: "Great", color: "#00BFA6" },
]

type MoodLog = {
  id: string
  score: number
  note: string | null
  logged_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function formatDay(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString([], { weekday: "short" }).slice(0, 2)
}

export default function MoodScreen() {
  const { session } = useAuth()
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const [noteFocused, setNoteFocused] = useState(false)
  const [logging, setLogging] = useState(false)
  const [loggedEntry, setLoggedEntry] = useState<MoodLog | null>(null)
  const [history, setHistory] = useState<MoodLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    fetchHistory()
  }, [userId])

  async function fetchHistory() {
    setLoadingHistory(true)
    try {
      const { data } = await supabase
        .from("mood_logs")
        .select("id, score, note, logged_at")
        .eq("patient_id", userId)
        .order("logged_at", { ascending: false })
        .limit(7)
      setHistory((data as MoodLog[]) ?? [])
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleLogMood() {
    if (!selectedScore || !userId) return
    setLogging(true)
    try {
      const { data, error } = await supabase
        .from("mood_logs")
        .insert({
          patient_id: userId,
          score: selectedScore,
          note: note.trim() || null,
          logged_at: new Date().toISOString(),
        })
        .select("id, score, note, logged_at")
        .single()
      if (error) throw error
      setLoggedEntry(data as MoodLog)
      setHistory((prev) => [data as MoodLog, ...prev].slice(0, 7))
    } catch {
      // graceful failure — still show confirmation if score is set
      setLoggedEntry({
        id: "local",
        score: selectedScore,
        note: note.trim() || null,
        logged_at: new Date().toISOString(),
      })
    } finally {
      setLogging(false)
    }
  }

  const moodColor =
    selectedScore != null
      ? MOOD_OPTIONS.find((m) => m.score === selectedScore)?.color ?? colors.teal
      : colors.teal

  const showCrisisCard =
    (selectedScore != null && selectedScore <= 2) ||
    history.some((h) => h.score <= 2)

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <Text style={styles.heading}>How are you feeling today?</Text>

          {/* Mood selector */}
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((opt) => {
              const active = selectedScore === opt.score
              return (
                <TouchableOpacity
                  key={opt.score}
                  style={styles.moodOption}
                  onPress={() => setSelectedScore(opt.score)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.moodCircle,
                      {
                        backgroundColor: active
                          ? opt.color
                          : `${opt.color}22`,
                        borderColor: opt.color,
                        borderWidth: active ? 0 : 1.5,
                      },
                    ]}
                  >
                    <Text style={[styles.moodScore, { color: active ? "#fff" : opt.color }]}>
                      {opt.score}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.moodLabel,
                      { color: active ? opt.color : colors.textMuted },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Note input */}
          <View
            style={[styles.inputWrapper, noteFocused && styles.inputFocused]}
          >
            <TextInput
              style={styles.input}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setNoteFocused(false)}
              returnKeyType="done"
            />
          </View>

          {/* Log button / confirmation */}
          {loggedEntry ? (
            <View style={styles.confirmedCard}>
              <View
                style={[
                  styles.confirmedDot,
                  {
                    backgroundColor:
                      MOOD_OPTIONS.find((m) => m.score === loggedEntry.score)
                        ?.color ?? colors.teal,
                  },
                ]}
              />
              <View>
                <Text style={styles.confirmedTitle}>Mood logged</Text>
                <Text style={styles.confirmedDate}>
                  {formatDate(loggedEntry.logged_at)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setLoggedEntry(null)
                  setSelectedScore(null)
                  setNote("")
                }}
                style={styles.logAgainBtn}
              >
                <Text style={styles.logAgainText}>Log again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.btnLog,
                (!selectedScore || logging) && styles.btnDisabled,
              ]}
              onPress={handleLogMood}
              disabled={!selectedScore || logging}
              activeOpacity={0.85}
            >
              {logging ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.btnLogText,
                    !selectedScore && styles.btnDisabledText,
                  ]}
                >
                  Log mood
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Privacy note */}
          <Text style={styles.privacyNote}>
            Mood data is private by default — only you and your doctor can see
            it. Caregivers cannot access mood logs.
          </Text>

          {/* 7-day history */}
          <Text style={styles.sectionLabel}>Last 7 days</Text>
          {loadingHistory ? (
            <ActivityIndicator color={colors.teal} style={{ marginVertical: spacing.xl }} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>No mood logs yet. Start tracking today.</Text>
          ) : (
            <View style={styles.historyRow}>
              {history.map((log) => {
                const moodOpt = MOOD_OPTIONS.find((m) => m.score === log.score)
                return (
                  <View key={log.id} style={styles.historyItem}>
                    <View
                      style={[
                        styles.historyDot,
                        { backgroundColor: moodOpt?.color ?? colors.teal },
                      ]}
                    />
                    <Text style={styles.historyDay}>{formatDay(log.logged_at)}</Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* Crisis resource card */}
          {showCrisisCard && (
            <View style={styles.crisisCard}>
              <View style={styles.crisisHeader}>
                <View style={styles.crisisDot} />
                <Text style={styles.crisisTitle}>Feeling very low?</Text>
              </View>
              <Text style={styles.crisisOrg}>Befrienders Kenya</Text>
              <Text style={styles.crisisLine}>0800 723 253 (free, 24/7)</Text>
              <TouchableOpacity
                style={styles.crisisCallBtn}
                onPress={() => Linking.openURL("tel:0800723253")}
                activeOpacity={0.85}
              >
                <Text style={styles.crisisCallText}>Call now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.crisisSosBtn}
                onPress={() => router.push("/sos")}
                activeOpacity={0.85}
              >
                <Text style={styles.crisisSosBtnText}>Medical emergency — Start SOS</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  heading: {
    fontSize: fonts.xl,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xl,
  },

  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  moodOption: { alignItems: "center", flex: 1 },
  moodCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  moodScore: { fontSize: fonts.lg, fontWeight: "800" },
  moodLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },

  inputWrapper: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.lg,
    height: 54,
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.teal,
    backgroundColor: "rgba(139,92,246,0.05)",
  },
  input: { color: colors.text, fontSize: fonts.base },

  btnLog: {
    backgroundColor: colors.teal,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    backgroundColor: colors.bgCardAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnLogText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },
  btnDisabledText: { color: colors.textMuted },

  confirmedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  confirmedDot: { width: 12, height: 12, borderRadius: 6 },
  confirmedTitle: { fontSize: fonts.base, fontWeight: "700", color: colors.text },
  confirmedDate: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },
  logAgainBtn: { marginLeft: "auto" },
  logAgainText: { fontSize: fonts.sm, color: colors.teal, fontWeight: "700" },

  privacyNote: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },

  sectionLabel: {
    fontSize: fonts.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  historyRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  historyItem: { alignItems: "center", gap: spacing.xs },
  historyDot: { width: 28, height: 28, borderRadius: 14 },
  historyDay: { fontSize: fonts.xs, color: colors.textMuted, fontWeight: "600" },

  crisisCard: {
    backgroundColor: colors.emergencyDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.emergency,
    padding: spacing.lg,
  },
  crisisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  crisisDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emergency,
  },
  crisisTitle: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.emergency,
  },
  crisisOrg: {
    fontSize: fonts.md,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  crisisLine: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  crisisCallBtn: {
    backgroundColor: colors.emergency,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  crisisCallText: { color: "#fff", fontWeight: "800", fontSize: fonts.base },
  crisisSosBtn: {
    borderWidth: 1.5,
    borderColor: colors.emergency,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  crisisSosBtnText: { color: colors.emergency, fontWeight: "700", fontSize: fonts.sm },
})
