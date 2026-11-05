import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  StatusBar,
} from "react-native"
import { router } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radius, spacing, shadows } from "../../lib/theme"
import { useAuth } from "../_layout"
import { TAB_BOTTOM, TAB_HEIGHT } from "./_layout"
import {
  getEvents,
  getInsightsSummary,
  logEvent,
  logMoodCheckin,
  getTodaysMoodScore,
  type Event,
} from "../../lib/supabase"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

const SEVERITY_COLORS: Record<string, string> = {
  mild: colors.teal, moderate: colors.amber, severe: colors.emergency,
}

function eventBorderColor(type: string) {
  if (type === "seizure")     return colors.emergency
  if (type === "missed_dose") return colors.amber
  return colors.teal
}
function eventBadgeBg(type: string) {
  if (type === "seizure")     return colors.badgeReviewBg
  if (type === "missed_dose") return colors.amberDim
  return colors.tealBadge
}
function eventBadgeColor(type: string) {
  if (type === "seizure")     return colors.emergency
  if (type === "missed_dose") return colors.amber
  return colors.teal
}
function eventLabel(type: string) {
  if (type === "seizure")     return "Seizure"
  if (type === "missed_dose") return "Missed dose"
  return type
}

// ─── 7-day seizure heatmap ────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function SeizureHeatmap({ events }: { events: Event[] }) {
  const today     = new Date()
  const activeDay = new Set<number>()
  for (const ev of events) {
    const d    = new Date(ev.occurred_at)
    const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 7) activeDay.add((d.getDay() + 6) % 7)
  }
  return (
    <View style={hm.wrap}>
      <Text style={hm.label}>Seizure activity</Text>
      <View style={hm.row}>
        {DAYS.map((day, i) => (
          <View key={day} style={hm.col}>
            <View style={[hm.dot, activeDay.has(i) && hm.dotActive]} />
            <Text style={hm.dayLabel}>{day}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const hm = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.lg, ...shadows.sm,
  },
  label:     { fontSize: fonts.xs, fontWeight: "700", color: colors.textSecondary, marginBottom: spacing.md, letterSpacing: 0.8, textTransform: "uppercase" },
  row:       { flexDirection: "row", justifyContent: "space-between" },
  col:       { alignItems: "center", gap: 6 },
  dot:       { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bgCardAlt, borderWidth: 1, borderColor: colors.border },
  dotActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  dayLabel:  { fontSize: fonts.xs, color: colors.textMuted },
})

// ─── Log Event Modal ──────────────────────────────────────────────────────────

type EventType = "seizure" | "missed_dose" | "other"
type Severity  = "mild" | "moderate" | "severe"

function LogEventModal({
  visible, onClose, onSaved, userId,
}: { visible: boolean; onClose: () => void; onSaved: () => void; userId: string }) {
  const [eventType, setEventType] = useState<EventType>("seizure")
  const [severity,  setSeverity]  = useState<Severity>("mild")
  const [saving,    setSaving]    = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await logEvent(userId, eventType, severity)
      onSaved()
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Could not save event.")
    } finally {
      setSaving(false)
    }
  }

  const eventTypes: { key: EventType; label: string }[] = [
    { key: "seizure", label: "Seizure" }, { key: "missed_dose", label: "Missed dose" }, { key: "other", label: "Other" },
  ]
  const severities: { key: Severity; label: string }[] = [
    { key: "mild", label: "Mild" }, { key: "moderate", label: "Moderate" }, { key: "severe", label: "Severe" },
  ]

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>Log an event</Text>

          <Text style={modal.sectionLabel}>Event type</Text>
          <View style={modal.choiceRow}>
            {eventTypes.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[modal.choiceBtn, eventType === key && modal.choiceBtnActive]}
                onPress={() => setEventType(key)}
              >
                <Text style={[modal.choiceBtnText, eventType === key && modal.choiceBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={modal.sectionLabel}>Severity</Text>
          <View style={modal.choiceRow}>
            {severities.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[modal.choiceBtn, severity === key && modal.choiceBtnActive]}
                onPress={() => setSeverity(key)}
              >
                <Text style={[modal.choiceBtnText, severity === key && modal.choiceBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[modal.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#000" /> : <Text style={modal.saveBtnText}>Save</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
            <Text style={modal.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const modal = StyleSheet.create({
  overlay:            { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet:              { backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: colors.border, padding: 24, paddingBottom: 40 },
  handle:             { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderLight, alignSelf: "center", marginBottom: spacing.xl },
  title:              { fontSize: fonts.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.xl },
  sectionLabel:       { fontSize: fonts.xs, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: spacing.sm },
  choiceRow:          { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl, flexWrap: "wrap" },
  choiceBtn:          { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCardAlt },
  choiceBtnActive:    { borderColor: colors.teal, backgroundColor: colors.tealDim },
  choiceBtnText:      { fontSize: fonts.base, color: colors.textSecondary, fontWeight: "600" },
  choiceBtnTextActive:{ color: colors.teal },
  saveBtn:            { backgroundColor: colors.teal, borderRadius: radius.lg, paddingVertical: spacing.md + 2, alignItems: "center", marginBottom: spacing.md },
  saveBtnText:        { color: "#000", fontWeight: "700", fontSize: fonts.md },
  cancelBtn:          { alignItems: "center", paddingVertical: spacing.sm },
  cancelBtnText:      { color: colors.textSecondary, fontSize: fonts.base },
})

// ─── Mood check-in ────────────────────────────────────────────────────────────

const MOOD_EMOJIS = ["😔", "😕", "😐", "🙂", "😊"] as const
const MOOD_LABELS = ["Rough", "Low", "Okay", "Good", "Great"] as const

function MoodCheckin({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [todayScore, setTodayScore] = useState<number | null>(null)
  const [saving,     setSaving]     = useState<number | null>(null)

  useEffect(() => { getTodaysMoodScore(userId).then(setTodayScore).catch(() => {}) }, [userId])

  async function handleSelect(score: number) {
    if (saving !== null) return
    setSaving(score)
    try {
      await logMoodCheckin(userId, score)
      setTodayScore(score)
      onSaved()
    } catch {
      Alert.alert("Could not save mood", "Please try again.")
    } finally {
      setSaving(null)
    }
  }

  return (
    <View style={moodS.card}>
      <View style={moodS.header}>
        <Text style={moodS.title}>How are you feeling today?</Text>
        {todayScore !== null && (
          <View style={moodS.doneBadge}><Text style={moodS.doneBadgeText}>Logged</Text></View>
        )}
      </View>
      <View style={moodS.row}>
        {MOOD_EMOJIS.map((emoji, i) => {
          const score    = i + 1
          const selected = todayScore === score
          return (
            <TouchableOpacity key={score} style={[moodS.emojiBtn, selected && moodS.emojiBtnSelected]} onPress={() => handleSelect(score)} activeOpacity={0.75}>
              {saving === score
                ? <ActivityIndicator size="small" color={colors.teal} />
                : <Text style={moodS.emoji}>{emoji}</Text>}
              <Text style={[moodS.emojiLabel, selected && moodS.emojiLabelSelected]}>{MOOD_LABELS[i]}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
      <Text style={moodS.disclaimer}>
        Mood data is private by default. Your clinician cannot see it unless you choose to share.
      </Text>
    </View>
  )
}

const moodS = StyleSheet.create({
  card:              { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.xl, ...shadows.sm },
  header:            { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  title:             { fontSize: fonts.md, fontWeight: "700", color: colors.text },
  doneBadge:         { backgroundColor: colors.tealBadge, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
  doneBadgeText:     { fontSize: fonts.xs, fontWeight: "700", color: colors.teal },
  row:               { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  emojiBtn:          { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: "transparent" },
  emojiBtnSelected:  { borderColor: colors.teal, backgroundColor: colors.tealDim },
  emoji:             { fontSize: 26 },
  emojiLabel:        { fontSize: fonts.xs, color: colors.textMuted, marginTop: 4 },
  emojiLabelSelected:{ color: colors.teal, fontWeight: "700" },
  disclaimer:        { fontSize: fonts.xs, color: colors.textMuted, lineHeight: 16 },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const { session } = useAuth()
  const insets      = useSafeAreaInsets()
  const bottomPad   = TAB_HEIGHT + TAB_BOTTOM + insets.bottom + 16

  const [filter,          setFilter]          = useState<"week" | "all">("week")
  const [events,          setEvents]          = useState<Event[]>([])
  const [insights,        setInsights]        = useState<{
    this_week_events: number; pattern: string; suggestion: string; med_checkins: number
  } | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [logModalVisible, setLogModalVisible] = useState(false)
  const [moodKey,         setMoodKey]         = useState(0)

  function loadData() {
    if (!session?.user) return
    setLoading(true)
    const uid = session.user.id
    Promise.all([getEvents(uid, filter), getInsightsSummary(uid)])
      .then(([evts, ins]) => { setEvents(evts); setInsights(ins); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [session, filter])

  const lastSeizure = events.find(e => e.event_type === "seizure")
  const freeDays    = lastSeizure
    ? Math.floor((Date.now() - new Date(lastSeizure.occurred_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat tiles */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{loading ? "—" : events.length}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{loading ? "—" : freeDays !== null ? freeDays : "—"}</Text>
            <Text style={styles.statLabel}>Seizure-free days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{loading || !insights ? "—" : insights.med_checkins}</Text>
            <Text style={styles.statLabel}>Dose check-ins</Text>
          </View>
        </View>

        {/* Segmented control */}
        <View style={styles.segmentWrap}>
          {(["week", "all"] as const).map((f) => (
            <TouchableOpacity key={f} style={[styles.segmentBtn, filter === f && styles.segmentBtnActive]} onPress={() => setFilter(f)} activeOpacity={0.85}>
              <Text style={[styles.segmentText, filter === f && styles.segmentTextActive]}>
                {f === "week" ? "This week" : "All time"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SeizureHeatmap events={events} />

        {/* Insights card */}
        <TouchableOpacity style={styles.insightCard} onPress={() => router.push("/insights")} activeOpacity={0.85}>
          <View style={styles.insightLeftBar} />
          <View style={styles.insightContent}>
            <View style={styles.insightBadge}>
              <Text style={styles.insightBadgeText}>THIS WEEK</Text>
            </View>
            {insights ? (
              <>
                <Text style={styles.insightHeading}>{insights.pattern}</Text>
                <Text style={styles.insightSub}>
                  Built from {insights.this_week_events} event log{insights.this_week_events !== 1 ? "s" : ""} and{" "}
                  {insights.med_checkins} medication check-in{insights.med_checkins !== 1 ? "s" : ""}. This is a pattern, not a diagnosis.
                </Text>
                <View style={styles.insightActions}>
                  <TouchableOpacity style={styles.insightBtnPrimary}>
                    <Text style={styles.insightBtnPrimaryText}>{insights.suggestion}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.insightBtnOutlined}>
                    <Text style={styles.insightBtnOutlinedText}>See logs</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.insightPlaceholder}>Checking your patterns...</Text>
            )}
          </View>
        </TouchableOpacity>

        {session?.user && (
          <MoodCheckin key={moodKey} userId={session.user.id} onSaved={() => setMoodKey((k) => k + 1)} />
        )}

        <Text style={styles.sectionTitle}>Events</Text>

        {loading ? (
          <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xl }} />
        ) : events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No events logged{filter === "week" ? " this week" : ""}.</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={[styles.eventCard, { borderLeftColor: eventBorderColor(event.event_type) }]}>
              <View style={styles.eventTop}>
                <View style={[styles.typeBadge, { backgroundColor: eventBadgeBg(event.event_type) }]}>
                  <Text style={[styles.typeBadgeText, { color: eventBadgeColor(event.event_type) }]}>
                    {eventLabel(event.event_type)}
                  </Text>
                </View>
                {event.severity && (
                  <>
                    <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[event.severity] ?? colors.teal }]} />
                    <Text style={styles.severityText}>{event.severity}</Text>
                  </>
                )}
              </View>
              {event.details && Object.keys(event.details).length > 0 && (
                <View style={styles.detailsRow}>
                  {Object.entries(event.details).map(([k, v]) => (
                    <Text key={k} style={styles.detailText}>{k.replace(/_/g, " ")}: {String(v)}</Text>
                  ))}
                </View>
              )}
              <Text style={styles.eventTime}>{formatDate(event.occurred_at)}</Text>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.addEventBtn} onPress={() => setLogModalVisible(true)}>
          <Ionicons name="add-circle" size={18} color={colors.teal} />
          <Text style={styles.addEventBtnText}>Log an event</Text>
        </TouchableOpacity>
      </ScrollView>

      {session?.user && (
        <LogEventModal
          visible={logModalVisible}
          userId={session.user.id}
          onClose={() => setLogModalVisible(false)}
          onSaved={() => { setLogModalVisible(false); loadData() }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  scroll:    { flex: 1 },
  container: { padding: spacing.lg },

  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: "center",
    ...shadows.sm,
  },
  statVal:   { fontSize: fonts.xl, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, textAlign: "center", marginTop: 2 },

  segmentWrap: {
    flexDirection: "row", backgroundColor: colors.bgCard, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, padding: 3, marginBottom: spacing.lg, ...shadows.sm,
  },
  segmentBtn:        { flex: 1, borderRadius: radius.full, paddingVertical: spacing.sm, alignItems: "center" },
  segmentBtnActive:  { backgroundColor: colors.teal },
  segmentText:       { fontSize: fonts.sm, fontWeight: "600", color: colors.textSecondary },
  segmentTextActive: { color: "#fff", fontWeight: "700" },

  insightCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, flexDirection: "row", marginBottom: spacing.xl, overflow: "hidden", ...shadows.sm,
  },
  insightLeftBar:         { width: 4, backgroundColor: colors.teal },
  insightContent:         { flex: 1, padding: spacing.lg },
  insightBadge:           { backgroundColor: colors.tealBadge, alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3, marginBottom: spacing.sm },
  insightBadgeText:       { fontSize: fonts.xs, fontWeight: "700", color: colors.teal, letterSpacing: 1 },
  insightHeading:         { fontSize: fonts.lg, fontWeight: "700", color: colors.text, marginBottom: spacing.sm, lineHeight: 26 },
  insightSub:             { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },
  insightPlaceholder:     { fontSize: fonts.base, color: colors.textMuted, fontStyle: "italic", paddingVertical: spacing.sm },
  insightActions:         { flexDirection: "row", gap: spacing.md },
  insightBtnPrimary:      { backgroundColor: colors.teal, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  insightBtnPrimaryText:  { color: "#000", fontWeight: "700", fontSize: fonts.sm },
  insightBtnOutlined:     { borderRadius: radius.full, borderWidth: 1, borderColor: colors.teal, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  insightBtnOutlinedText: { color: colors.teal, fontWeight: "700", fontSize: fonts.sm },

  sectionTitle: { fontSize: fonts.lg, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  emptyCard:    { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: "center" },
  emptyText:    { color: colors.textSecondary, fontSize: fonts.base },

  eventCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, borderLeftWidth: 4, padding: spacing.lg, marginBottom: spacing.md, ...shadows.sm,
  },
  eventTop:      { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  typeBadge:     { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
  typeBadgeText: { fontSize: fonts.sm, fontWeight: "600" },
  severityDot:   { width: 8, height: 8, borderRadius: 4 },
  severityText:  { fontSize: fonts.sm, color: colors.textSecondary },
  detailsRow:    { gap: 4, marginBottom: spacing.sm },
  detailText:    { fontSize: fonts.sm, color: colors.textSecondary },
  eventTime:     { fontSize: fonts.xs, color: colors.textMuted, marginTop: 4 },

  addEventBtn: {
    marginTop: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, borderWidth: 1.5, borderColor: colors.teal, borderRadius: radius.lg, paddingVertical: spacing.md,
  },
  addEventBtnText: { color: colors.teal, fontWeight: "700", fontSize: fonts.md },
})
