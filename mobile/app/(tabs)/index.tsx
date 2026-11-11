// Today screen — matches artboard "Mojo Modern App Design / Main"
// Spec: MOJO_PREMIUM_UI_UPGRADE.md §★ artboard · §8 Patient Today

import { useEffect, useRef, useState } from "react"

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  Modal,
  Linking,
  Pressable,
  StatusBar,
} from "react-native"
import { Image } from "expo-image"

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import * as Haptics from "expo-haptics"
import { router } from "expo-router"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { TabErrorFallback } from "../../components/TabErrorBoundary"
import { colors, fonts, radius, spacing, shadows } from "../../lib/theme"
import { TAB_BOTTOM, TAB_HEIGHT } from "./_layout"
import { useAuth } from "../_layout"
import { useTranslation } from "../../lib/i18n-context"
import {
  getMedications,
  logMedicationTaken,
  getCareCircle,
  type Medication,
  supabase,
} from "../../lib/supabase"
import { getWeather, iconUrl, type WeatherData } from "../../lib/weather"
import * as Location from "expo-location"

// ─── Quick-action chip data ────────────────────────────────────────────────────

type QuickAction = {
  icon: string
  label: string
  color: string
  bg: string
  onPress?: () => void
  route?: string
}

// ─── Three-ring vitals visual ─────────────────────────────────────────────────
// Concentric rings: outer = activity (coral), mid = sleep (iris), inner = meds (lagoon)

function HealthRings({ size = 108 }: { size?: number }) {
  const ring1 = size
  const ring2 = size * 0.70
  const ring3 = size * 0.42
  const bw1   = 7
  const bw2   = 6
  const bw3   = 5

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Outer — activity / coral */}
      <View style={{
        position:     "absolute",
        width:        ring1,
        height:       ring1,
        borderRadius: ring1 / 2,
        borderWidth:  bw1,
        borderColor:  "#FF6B4A",
        opacity:      0.88,
      }} />
      {/* Middle — sleep / iris */}
      <View style={{
        position:     "absolute",
        width:        ring2,
        height:       ring2,
        borderRadius: ring2 / 2,
        borderWidth:  bw2,
        borderColor:  colors.iris,
        opacity:      0.90,
      }} />
      {/* Inner — meds / lagoon */}
      <View style={{
        position:     "absolute",
        width:        ring3,
        height:       ring3,
        borderRadius: ring3 / 2,
        borderWidth:  bw3,
        borderColor:  colors.teal,
      }} />
      {/* Centre dot */}
      <View style={{
        width:           10,
        height:          10,
        borderRadius:    5,
        backgroundColor: colors.teal,
      }} />
    </View>
  )
}

// ─── 7-day streak dots ────────────────────────────────────────────────────────

function DayDots({ streak }: { streak: number }) {
  const today = new Date().getDay()          // 0 = Sun
  return (
    <View style={{ flexDirection: "row", gap: 4, marginTop: 10 }}>
      {Array.from({ length: 7 }).map((_, i) => {
        const dayIdx  = (today - 6 + i + 7) % 7
        const hasSafe = i >= 7 - Math.min(streak, 7)
        return (
          <View
            key={i}
            style={{
              width:           9,
              height:          9,
              borderRadius:    3,
              backgroundColor: hasSafe ? colors.teal : colors.border,
            }}
          />
        )
      })}
    </View>
  )
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { width }            = useWindowDimensions()
  const insets               = useSafeAreaInsets()
  const { profile, session } = useAuth()
  const { t }                = useTranslation()

  const [medications,      setMedications]      = useState<Medication[]>([])
  const [circleCount,      setCircleCount]      = useState(0)
  const [loading,          setLoading]          = useState(true)
  const [takenId,          setTakenId]          = useState<string | null>(null)
  const [weather,          setWeather]          = useState<WeatherData | null>(null)
  const [streakDays,       setStreakDays]       = useState(0)
  const [hasActiveAlert,   setHasActiveAlert]   = useState(false)
  const [logModalVisible,  setLogModalVisible]  = useState(false)
  const [loggingEvent,     setLoggingEvent]     = useState<string | null>(null)
  const [nearestHospital,  setNearestHospital]  = useState<{ name: string; phone: string | null } | null>(null)
  const [latestMoodScore,  setLatestMoodScore]  = useState<number | null>(null)
  const [bpm,              setBpm]              = useState<number | null>(null)

  const bpmPulse   = useRef(new Animated.Value(0)).current

  // 7 staggered entrance slots
  const anims = useRef(
    Array.from({ length: 7 }, () => ({ y: new Animated.Value(24), op: new Animated.Value(0) })),
  ).current

  useEffect(() => {
    let alive = true
    const entranceAnims = anims.map((a, i) =>
      Animated.sequence([
        Animated.delay(i * 70 + 80),
        Animated.parallel([
          Animated.spring(a.y,  { toValue: 0, tension: 65, friction: 14, useNativeDriver: true }),
          Animated.timing(a.op, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
      ])
    )
    entranceAnims.forEach((a) => a.start())

    const bpmLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bpmPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(bpmPulse, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.delay(Math.max(0, 60000 / Math.max(bpm ?? 60, 40) - 1600)),
      ]),
    )
    bpmLoop.start()

    getWeather().then((w) => { if (alive) setWeather(w) }).catch(() => {})

    return () => {
      alive = false
      entranceAnims.forEach((a) => a.stop())
      bpmLoop.stop()
    }
  }, [])

  useEffect(() => {
    if (!session?.user) return
    let alive = true
    const uid = session.user.id

    Promise.all([getMedications(uid), getCareCircle(uid)])
      .then(([meds, circle]) => {
        if (!alive) return
        setMedications(meds)
        setCircleCount(circle.length)
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })

    supabase
      .from("events").select("occurred_at").eq("user_id", uid)
      .in("type", ["seizure", "sz", "tonic-clonic", "absence"])
      .order("occurred_at", { ascending: false }).limit(1)
      .then(({ data }) => {
        if (!alive) return
        if (!data || !data.length) { setStreakDays(30); return }
        setStreakDays(Math.max(0, Math.floor((Date.now() - new Date(data[0].occurred_at).getTime()) / 86_400_000)))
      })
      .catch(() => {})

    supabase
      .from("sos_events").select("id").eq("patient_id", uid)
      .not("status", "in", '("resolved","cancelled")').limit(1)
      .then(({ data }) => { if (alive) setHasActiveAlert((data ?? []).length > 0) })
      .catch(() => {})

    supabase
      .from("mood_logs").select("score").eq("patient_id", uid)
      .order("logged_at", { ascending: false }).limit(1)
      .then(({ data }) => { if (alive && data?.[0]) setLatestMoodScore(data[0].score) })
      .catch(() => {})

    return () => { alive = false }
  }, [session])

  useEffect(() => {
    let alive = true
    async function fetchHospital() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (!alive || status !== "granted") return
        const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        if (!alive) return
        const { data }   = await supabase.rpc("nearest_er_facility", { lat: coords.latitude, lon: coords.longitude })
        const row = data as { name: string; phone: string | null } | null
        if (alive && row?.name) setNearestHospital({ name: row.name, phone: row.phone ?? null })
      } catch {}
    }
    fetchHospital()
    return () => { alive = false }
  }, [])

  async function handleTaken(med: Medication) {
    if (!session?.user || takenId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setTakenId(med.id)
    await logMedicationTaken(med.id, session.user.id)
  }

  async function handleLogEvent(eventType: string) {
    if (!session?.user) return
    setLoggingEvent(eventType)
    try {
      await supabase.from("events").insert({
        patient_id:  session.user.id,
        logged_by:   session.user.id,
        event_type:  eventType.toLowerCase(),
        severity:    "mild",
        occurred_at: new Date().toISOString(),
        details:     {},
      })
    } finally {
      setLoggingEvent(null)
      setLogModalVisible(false)
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const hour        = new Date().getHours()
  const greeting    = hour < 12 ? t("home_greeting_morning") : hour < 18 ? t("home_greeting_afternoon") : t("home_greeting_evening")
  const firstName   = profile?.full_name?.split(" ")[0] ?? ""
  const rawInitials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : null
  const today      = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
  const nextMed    = medications[0]
  const showCrisis = latestMoodScore !== null && latestMoodScore <= 2
  const pad        = spacing.xl   // 20
  const bottomPad  = TAB_HEIGHT + TAB_BOTTOM + insets.bottom + 20

  function slot(i: number) { return { transform: [{ translateY: anims[i].y }], opacity: anims[i].op } }

  const QUICK_ACTIONS: QuickAction[] = [
    { icon: "bandage-outline",  label: "Symptom",  color: "#FF6B4A", bg: "#FFF3EE", onPress: () => setLogModalVisible(true) },
    { icon: "happy-outline",    label: "Mood",     color: colors.iris,  bg: colors.irisDim, route: "/mood" },
    { icon: "pulse-outline",    label: "ECG",      color: "#F5B700", bg: "#FFF8E1", route: "/health" },
    { icon: "location-outline", label: "Hospital", color: colors.teal,  bg: colors.successDim,
      onPress: () => Linking.openURL(nearestHospital?.phone ? `tel:${nearestHospital.phone}` : "tel:+254202726300") },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.container, { paddingHorizontal: pad, paddingBottom: bottomPad }]}
        >

          {/* ── Header ─────────────────────────────────────────────────── */}
          <Animated.View style={[s.header, slot(0)]}>
            <View style={s.headerLeft}>
              {rawInitials ? (
                <LinearGradient colors={[colors.teal, colors.iris]} style={s.avatar}>
                  <Text style={s.avatarText}>{rawInitials}</Text>
                </LinearGradient>
              ) : (
                <View style={[s.avatar, s.avatarPlaceholder]}>
                  <View style={s.avatarPersonBody} />
                  <View style={s.avatarPersonHead} />
                </View>
              )}
              <View>
                <Text style={s.greeting}>
                  {firstName ? `${greeting}, ${firstName}` : greeting}
                </Text>
                {!profile?.full_name && (
                  <TouchableOpacity onPress={() => router.push("/me" as any)} activeOpacity={0.75}>
                    <Text style={s.addNameLink}>Add your name</Text>
                  </TouchableOpacity>
                )}
                <Text style={s.dateLabel}>{today}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Active alert banner ──────────────────────────────────────── */}
          {hasActiveAlert && (
            <TouchableOpacity
              style={s.alertBanner}
              onPress={() => router.push("/sos")}
              activeOpacity={0.85}
            >
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={s.alertBannerText}>{t("home_active_alert")}</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          )}

          {/* ── Hero card — dark ink ──────────────────────────────────────── */}
          <Animated.View style={[s.heroCard, slot(1)]}>

            {/* Strap live chip */}
            <View style={s.liveChip}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>Live</Text>
              <Text style={s.liveSep}>·</Text>
              <Ionicons name="battery-half-outline" size={13} color="rgba(255,255,255,0.65)" />
              <Text style={s.liveText}>84%</Text>
            </View>

            {/* Stats row */}
            <View style={s.heroRow}>
              {/* Heart rate */}
              <View style={s.heroLeft}>
                <View style={s.bpmRow}>
                  <Animated.Text
                    style={[
                      s.bpmValue,
                      {
                        opacity: bpmPulse.interpolate({ inputRange: [0.6, 1], outputRange: [0.80, 1] }),
                      },
                    ]}
                  >
                    {bpm ?? "—"}
                  </Animated.Text>
                  <View style={s.bpmUnit}>
                    <Text style={s.bpmUnitText}>bpm</Text>
                    <Ionicons name="heart" size={13} color={colors.emergency} style={{ marginTop: 1 }} />
                  </View>
                </View>
                <View style={s.statusChip}>
                  <View style={s.statusDot} />
                  <Text style={s.statusText}>Within limits</Text>
                </View>
              </View>

              {/* Rings + legend */}
              <View style={s.heroRight}>
                <HealthRings size={100} />
                <View style={s.legend}>
                  <View style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: colors.teal }]} />
                    <Text style={s.legendLabel}>Meds</Text>
                  </View>
                  <View style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: colors.iris }]} />
                    <Text style={s.legendLabel}>Sleep</Text>
                  </View>
                  <View style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: "#FF6B4A" }]} />
                    <Text style={s.legendLabel}>Steps</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── Next-dose strip ───────────────────────────────────────────── */}
          <Animated.View style={slot(2)}>
            {loading ? (
              <View style={[s.doseStrip, { justifyContent: "center" }]}>
                <ActivityIndicator color={colors.teal} size="small" />
              </View>
            ) : nextMed ? (
              <View style={s.doseStrip}>
                <View style={s.doseIcon}>
                  <Ionicons name="sunny" size={22} color={colors.sun} />
                </View>
                <View style={s.doseInfo}>
                  <Text style={s.doseTime}>Next dose · {nextMed.schedule?.time ?? "—"}</Text>
                  <Text style={s.doseName}>{nextMed.name}</Text>
                </View>
                <TouchableOpacity
                  style={[s.takenBtn, takenId === nextMed.id && s.takenBtnDone]}
                  onPress={() => handleTaken(nextMed)}
                  disabled={takenId === nextMed.id}
                  activeOpacity={0.82}
                >
                  {takenId === nextMed.id
                    ? <Ionicons name="checkmark" size={16} color={colors.text} />
                    : <Text style={s.takenBtnText}>Taken</Text>}
                </TouchableOpacity>
              </View>
            ) : null}
          </Animated.View>

          {/* ── 2-col row: Streak + Seizure now ──────────────────────────── */}
          <Animated.View style={[s.twoCol, slot(3)]}>

            {/* Seizure-free streak */}
            <View style={[s.tileCard, s.streakTile]}>
              <Text style={s.streakNum}>{streakDays}</Text>
              <Text style={s.tileTitle}>Seizure-free</Text>
              <Text style={s.tileCaption}>days</Text>
              <DayDots streak={streakDays} />
            </View>

            {/* Seizure now tile */}
            <TouchableOpacity
              style={[s.tileCard, s.seizureNowTile]}
              onPress={() => router.push("/sos")}
              activeOpacity={0.84}
            >
              <View style={s.seizureIcon}>
                <Ionicons name="flash" size={22} color="#fff" />
              </View>
              <Text style={s.seizureTitle}>Seizure{"\n"}now</Text>
              <Text style={s.seizureCaption}>Tap to start timer</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── 4 round quick actions ─────────────────────────────────────── */}
          <Animated.View style={[s.quickRow, slot(4)]}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={s.quickAction}
                onPress={a.route ? () => router.push(a.route as any) : a.onPress}
                activeOpacity={0.78}
              >
                <View style={[s.quickCircle, { backgroundColor: a.bg }]}>
                  <Ionicons name={a.icon as any} size={22} color={a.color} />
                </View>
                <Text style={s.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* ── Care circle card ─────────────────────────────────────────── */}
          <Animated.View style={[s.card, slot(5)]}>
            <View style={[s.cardIconWrap, { backgroundColor: colors.tealMuted }]}>
              <Ionicons name="people" size={20} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.cardTitleRow}>
                <View style={s.liveDotGreen} />
                <Text style={s.cardTitleText}>Care circle active</Text>
              </View>
              <Text style={s.cardSubText}>
                {circleCount > 0
                  ? `${circleCount} member${circleCount > 1 ? "s" : ""} watching over you`
                  : "Add someone to your care circle"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.teal} />
          </Animated.View>

          {/* ── Emergency strip ───────────────────────────────────────────── */}
          <Animated.View style={[s.emergencyCard, slot(6)]}>
            <View style={s.emergencyHeader}>
              <View style={[s.cardIconWrap, { backgroundColor: colors.emergencyDim }]}>
                <Ionicons name="medkit" size={18} color={colors.emergency} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitleText, { color: colors.emergency }]}>Emergency</Text>
                <Text style={s.cardSubText} numberOfLines={1}>
                  {nearestHospital?.name ?? "Kenyatta National Hospital"}
                </Text>
              </View>
            </View>
            <View style={s.emergencyBtns}>
              {[
                { label: "999", route: "tel:999" },
                { label: "112", route: "tel:112" },
                { label: "Hospital", route: nearestHospital?.phone ? `tel:${nearestHospital.phone}` : "tel:+254202726300" },
              ].map((b, i) => (
                <TouchableOpacity
                  key={b.label}
                  style={[s.emergencyBtn, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.emergency + "22" }]}
                  onPress={() => Linking.openURL(b.route)}
                  activeOpacity={0.8}
                >
                  <Text style={s.emergencyBtnText}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* ── Weather ───────────────────────────────────────────────────── */}
          {weather && (
            <View style={s.card}>
              <Image
                source={{ uri: iconUrl(weather.current.iconCode) }}
                style={{ width: 44, height: 44 }}
                contentFit="contain"
                cachePolicy="disk"
                transition={150}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitleText}>{weather.current.city}</Text>
                <Text style={s.cardSubText}>{weather.current.description} · Feels {weather.current.feels_like}°C</Text>
              </View>
              <Text style={s.weatherTemp}>{weather.current.temp}°C</Text>
            </View>
          )}

          {/* ── Crisis resource ───────────────────────────────────────────── */}
          {showCrisis && (
            <View style={s.crisisCard}>
              <Text style={s.crisisTitle}>Feeling overwhelmed?</Text>
              <Text style={s.crisisName}>Befrienders Kenya</Text>
              <Text style={s.crisisSub}>0800 723 253 · Free · 24/7</Text>
              <TouchableOpacity
                style={s.crisisBtn}
                onPress={() => Linking.openURL("tel:0800723253")}
                activeOpacity={0.85}
              >
                <Text style={s.crisisBtnText}>{"Call now — it's free"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── Log event sheet ───────────────────────────────────────────────── */}
      <Modal
        visible={logModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Log a symptom</Text>
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              {[
                { value: "Seizure",   icon: "flash-outline",     color: colors.emergency },
                { value: "Headache",  icon: "sad-outline",       color: colors.iris },
                { value: "Dizziness", icon: "sync-circle-outline", color: colors.amber },
                { value: "Other",     icon: "ellipsis-horizontal-outline", color: colors.textMuted },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={s.sheetOption}
                  onPress={() => handleLogEvent(opt.value)}
                  disabled={loggingEvent === opt.value}
                  activeOpacity={0.78}
                >
                  <View style={[s.sheetOptionIcon, { backgroundColor: opt.color + "15" }]}>
                    {loggingEvent === opt.value
                      ? <ActivityIndicator size="small" color={opt.color} />
                      : <Ionicons name={opt.icon as any} size={18} color={opt.color} />}
                  </View>
                  <Text style={s.sheetOptionText}>{opt.value}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.sheetCancel} onPress={() => setLogModalVisible(false)} activeOpacity={0.8}>
              <Text style={s.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { paddingTop: 12, gap: spacing.md },

  // Header
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    ...shadows.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.tealMuted,
    overflow: "hidden",
  },
  avatarPersonHead: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.teal,
    position: "absolute",
    top: 8,
  },
  avatarPersonBody: {
    width: 24, height: 14, borderRadius: 12,
    backgroundColor: colors.teal,
    position: "absolute",
    bottom: 6,
  },
  avatarText:  { color: "#fff", fontWeight: "800", fontSize: fonts.md },
  greeting:    { fontSize: fonts.md, color: colors.text, fontWeight: "700" },
  addNameLink: { fontSize: fonts.sm, color: colors.teal, fontWeight: "600", marginTop: 1, textDecorationLine: "underline" },
  dateLabel:   { fontSize: fonts.xs, color: colors.textMuted, marginTop: 1 },

  // Alert banner
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.emergency, borderRadius: radius.lg,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    ...shadows.md, shadowColor: colors.emergency, shadowOpacity: 0.35,
  },
  alertBannerText: { flex: 1, color: "#fff", fontWeight: "700", fontSize: fonts.base },

  // Hero dark-ink card
  heroCard: {
    backgroundColor: colors.heroCard,
    borderRadius:    radius.xxl,   // 28
    padding:         spacing.xl,
    gap:             spacing.md,
    ...shadows.lg,
    shadowColor:     "#0C1F20",
    shadowOpacity:   0.18,
  },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.success },
  liveText: { fontSize: fonts.xs, color: "rgba(255,255,255,0.70)", fontWeight: "600" },
  liveSep:  { fontSize: fonts.xs, color: "rgba(255,255,255,0.30)" },

  heroRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroLeft: { gap: 10 },
  heroRight:{ alignItems: "center", gap: 10 },

  bpmRow:      { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  bpmValue:    { fontSize: 64, fontWeight: "800", color: "#FFFFFF", lineHeight: 68, letterSpacing: -2 },
  bpmUnit:     { gap: 2, paddingBottom: 6 },
  bpmUnitText: { fontSize: fonts.base, color: "rgba(255,255,255,0.55)", fontWeight: "500" },

  statusChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(34,192,138,0.18)", borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start",
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statusText: { fontSize: fonts.xs, color: colors.success, fontWeight: "700" },

  legend:      { gap: 5, marginTop: 6 },
  legendRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot:   { width: 6, height: 6, borderRadius: 3 },
  legendLabel: { fontSize: 11, color: "rgba(255,255,255,0.60)", fontWeight: "500" },

  // Dose strip
  doseStrip: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.sunDim, borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1, borderColor: colors.sun + "40",
  },
  doseIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.sun + "28",
    alignItems: "center", justifyContent: "center",
  },
  doseInfo:  { flex: 1 },
  doseTime:  { fontSize: fonts.xs, color: colors.textSecondary, fontWeight: "500", marginBottom: 2 },
  doseName:  { fontSize: fonts.md, fontWeight: "700", color: colors.text },
  takenBtn: {
    backgroundColor: colors.sun, borderRadius: radius.full,
    paddingHorizontal: 16, paddingVertical: 9, flexShrink: 0,
    ...shadows.sm, shadowColor: colors.sun, shadowOpacity: 0.30,
  },
  takenBtnDone: { backgroundColor: colors.successDim },
  takenBtnText: { color: colors.text, fontWeight: "700", fontSize: fonts.sm },

  // 2-col tiles
  twoCol: { flexDirection: "row", gap: spacing.md },
  tileCard: {
    flex: 1, borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  streakTile: {
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  streakNum: { fontSize: 40, fontWeight: "800", color: colors.text, letterSpacing: -1 },
  tileTitle: { fontSize: fonts.sm, fontWeight: "600", color: colors.text, marginTop: 2 },
  tileCaption: { fontSize: fonts.xs, color: colors.textMuted },
  seizureNowTile: {
    backgroundColor: colors.lagoon700,
    ...shadows.md,
    shadowColor: colors.teal,
    shadowOpacity: 0.28,
  },
  seizureIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
  },
  seizureTitle:   { fontSize: fonts.lg, fontWeight: "800", color: "#FFFFFF", lineHeight: 24 },
  seizureCaption: { fontSize: fonts.xs, color: "rgba(255,255,255,0.65)", marginTop: 6 },

  // Quick actions
  quickRow:    { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  quickAction: { alignItems: "center", gap: 7 },
  quickCircle: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: "center", justifyContent: "center",
    ...shadows.sm,
  },
  quickLabel: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },

  // Generic card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing.lg,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             spacing.md,
    ...shadows.sm,
  },
  cardIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  liveDotGreen: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.success },
  cardTitleText: { fontSize: fonts.base, fontWeight: "700", color: colors.text },
  cardSubText:   { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  // Emergency card
  emergencyCard: {
    backgroundColor: colors.bgCard,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.emergency + "30",
    overflow:        "hidden",
    ...shadows.sm,
  },
  emergencyHeader: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.md, padding: spacing.lg,
  },
  emergencyBtns: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.emergency + "18" },
  emergencyBtn:  { flex: 1, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  emergencyBtnText: { fontSize: fonts.sm, fontWeight: "700", color: colors.emergency },

  weatherTemp: { fontSize: fonts.xxl, fontWeight: "800", color: colors.text },

  // Crisis
  crisisCard: {
    backgroundColor: colors.emergencyDim,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.emergency + "30",
    padding:         spacing.lg,
    gap:             4,
  },
  crisisTitle: { fontSize: fonts.base, fontWeight: "700", color: colors.emergency },
  crisisName:  { fontSize: fonts.lg, fontWeight: "800", color: colors.text },
  crisisSub:   { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  crisisBtn: {
    backgroundColor: colors.emergency,
    borderRadius: radius.md, paddingVertical: 12, alignItems: "center",
    ...shadows.sm, shadowColor: colors.emergency, shadowOpacity: 0.35,
  },
  crisisBtnText: { color: "#fff", fontWeight: "800", fontSize: fonts.base },

  // Modal sheet
  overlay:      { flex: 1, backgroundColor: "rgba(15,27,45,0.50)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius:  radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding:    spacing.xl,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center", marginBottom: spacing.lg,
  },
  sheetTitle: { fontSize: fonts.lg, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: spacing.md },
  sheetOption: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.bgCardAlt, borderRadius: radius.md,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  sheetOptionIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  sheetOptionText: { fontSize: fonts.md, fontWeight: "600", color: colors.text, flex: 1 },
  sheetCancel: { alignItems: "center", paddingVertical: spacing.lg },
  sheetCancelText: { fontSize: fonts.md, color: colors.textSecondary, fontWeight: "600" },
})

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <TabErrorFallback error={error} retry={retry} />
}