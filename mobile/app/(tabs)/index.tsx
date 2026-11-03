import { useEffect, useRef, useState } from "react"

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
  useWindowDimensions,
  Modal,
  Linking,
  Pressable,
} from "react-native"

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"

import { LinearGradient } from "expo-linear-gradient"

import * as Haptics from "expo-haptics"

import { router } from "expo-router"

import { SafeAreaView } from "react-native-safe-area-context"

import { colors, fonts, radius, spacing } from "../../lib/theme"

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

// ─── Constants ────────────────────────────────────────────────────────────────

const LOG_EVENT_OPTIONS = [
  { value: "Seizure",   labelKey: "home_event_seizure"   as const },
  { value: "Headache",  labelKey: "home_event_headache"  as const },
  { value: "Dizziness", labelKey: "home_event_dizziness" as const },
  { value: "Other",     labelKey: "home_event_other"     as const },
]

const GRID_ITEMS = [
  {
    icon: "flash",
    titleKey: "home_grid_conditions" as const,
    subtitleKey: "home_grid_conditions_sub" as const,
    route: "/records",
    color: colors.amber,
  },
  {
    icon: "people",
    titleKey: "home_grid_circle" as const,
    subtitleKey: "home_grid_circle_sub" as const,
    route: "/circle",
    color: colors.teal,
  },
  {
    icon: "shield-checkmark",
    titleKey: "home_grid_doctor" as const,
    subtitleKey: "home_grid_doctor_sub" as const,
    route: "/circle",
    color: colors.success,
  },
  {
    icon: "document-text",
    titleKey: "home_grid_records" as const,
    subtitleKey: "home_grid_records_sub" as const,
    route: "/records",
    color: colors.blue,
  },
]

// ─── Animated concentric rings ─────────────────────────────────────────────────

function ConcentricRings({ size = 72, pulse }: { size?: number; pulse: Animated.Value }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: "rgba(123,53,250,0.20)",
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.65,
          height: size * 0.65,
          borderRadius: (size * 0.65) / 2,
          borderWidth: 1.5,
          borderColor: "rgba(123,53,250,0.42)",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.38,
          height: size * 0.38,
          borderRadius: (size * 0.38) / 2,
          borderWidth: 2,
          borderColor: "rgba(123,53,250,0.75)",
        }}
      />
      <Animated.View
        style={{
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: (size * 0.14) / 2,
          backgroundColor: colors.teal,
          opacity: pulse,
          shadowColor: colors.teal,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.95,
          shadowRadius: 8,
          elevation: 8,
        }}
      />
    </View>
  )
}

// ─── Hero banner ───────────────────────────────────────────────────────────────

function HeroBanner({
  name,
  streak,
  circleCount,
}: {
  name: string
  streak: number
  circleCount: number
}) {
  const { t } = useTranslation()
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    ).start()
  }, [])

  return (
    <LinearGradient
      colors={["#180D4A", "#0C0A1E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      {/* Subtle grid decoration */}
      <View style={styles.heroDecor} pointerEvents="none">
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.heroLine,
              {
                top: 14 + i * 22,
                opacity: pulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.03, 0.08 - i * 0.015, 0.03],
                }),
              },
            ]}
          />
        ))}
      </View>

      {/* Stats row */}
      <View style={styles.heroStats}>
        {/* Streak */}
        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>{streak}</Text>
          <Text style={styles.heroStatLabel}>{t("home_streak_days")}</Text>
          <Text style={styles.heroStatSub}>{t("home_streak_label")}</Text>
        </View>

        {/* Divider */}
        <View style={styles.heroStatDivider} />

        {/* BPM */}
        <View style={styles.heroStat}>
          <Animated.View
            style={{
              opacity: pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }),
            }}
          >
            <Text style={[styles.heroStatValue, { color: colors.emergency }]}>72</Text>
          </Animated.View>
          <Text style={styles.heroStatLabel}>BPM</Text>
          <Text style={styles.heroStatSub}>Heart rate</Text>
        </View>

        {/* Divider */}
        <View style={styles.heroStatDivider} />

        {/* Circle */}
        <View style={styles.heroStat}>
          <Text style={[styles.heroStatValue, { color: colors.success }]}>{circleCount}</Text>
          <Text style={styles.heroStatLabel}>Care</Text>
          <Text style={styles.heroStatSub}>Circle</Text>
        </View>
      </View>

      {/* Sub label */}
      <Text style={styles.heroSub}>{t("home_banner_sub", name)}</Text>
    </LinearGradient>
  )
}

// ─── Quick actions horizontal strip ───────────────────────────────────────────

type QuickAction = {
  icon: string
  label: string
  color: string
  onPress?: () => void
  route?: string
}

function QuickActions({ onLogEvent }: { onLogEvent: () => void }) {
  const ACTIONS: QuickAction[] = [
    { icon: "add-circle-outline", label: "Log Event", color: colors.teal, onPress: onLogEvent },
    { icon: "calendar-outline",   label: "Appointments", color: colors.blue, route: "/appointments" },
    { icon: "analytics-outline",  label: "Insights",     color: colors.amber, route: "/insights" },
    { icon: "map-outline",        label: "Map",          color: colors.success, route: "/map" },
    { icon: "document-text-outline", label: "Records",  color: colors.textSecondary, route: "/records" },
  ]

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickActionsContent}
      style={styles.quickActionsScroll}
    >
      {ACTIONS.map((a) => (
        <TouchableOpacity
          key={a.label}
          style={[styles.quickChip, { borderColor: a.color + "30" }]}
          onPress={a.route ? () => router.push(a.route! as any) : a.onPress}
          activeOpacity={0.75}
        >
          <View style={[styles.quickChipIcon, { backgroundColor: a.color + "18" }]}>
            <Ionicons name={a.icon as any} size={16} color={a.color} />
          </View>
          <Text style={[styles.quickChipLabel, { color: a.color }]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { width } = useWindowDimensions()
  const { profile, session } = useAuth()
  const { t } = useTranslation()

  const [medications, setMedications] = useState<Medication[]>([])
  const [circleCount, setCircleCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [takenId, setTakenId] = useState<string | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecastOpen, setForecastOpen] = useState(false)
  const [streakDays, setStreakDays] = useState(0)
  const [hasActiveAlert, setHasActiveAlert] = useState(false)
  const [lastSyncedMinutes, setLastSyncedMinutes] = useState<number | null>(null)
  const [logModalVisible, setLogModalVisible] = useState(false)
  const [loggingEvent, setLoggingEvent] = useState<string | null>(null)
  const [nearestHospital, setNearestHospital] = useState<{ name: string; phone: string | null } | null>(null)
  const [latestMoodScore, setLatestMoodScore] = useState<number | null>(null)

  const pulseAnim = useRef(new Animated.Value(0.5)).current
  const sosScale = useRef(new Animated.Value(1)).current

  // 8 staggered entrance slots
  const anims = useRef(
    Array.from({ length: 8 }, () => ({ y: new Animated.Value(30), op: new Animated.Value(0) })),
  ).current

  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.sequence([
        Animated.delay(i * 75 + 100),
        Animated.parallel([
          Animated.spring(a.y, { toValue: 0, tension: 60, friction: 13, useNativeDriver: true }),
          Animated.timing(a.op, { toValue: 1, duration: 320, useNativeDriver: true }),
        ]),
      ]).start()
    })

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1100, useNativeDriver: true }),
      ]),
    ).start()

    getWeather().then(setWeather)
  }, [])

  useEffect(() => {
    if (!session?.user) return
    const uid = session.user.id

    Promise.all([getMedications(uid), getCareCircle(uid)]).then(([meds, circle]) => {
      setMedications(meds)
      setCircleCount(circle.length)
      setLoading(false)
    })

    supabase
      .from("events")
      .select("occurred_at")
      .eq("user_id", uid)
      .in("type", ["seizure", "sz", "tonic-clonic", "absence"])
      .order("occurred_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!data || data.length === 0) { setStreakDays(30); return }
        setStreakDays(Math.max(0, Math.floor((Date.now() - new Date(data[0].occurred_at).getTime()) / 86_400_000)))
      })

    supabase
      .from("sos_events")
      .select("id")
      .eq("patient_id", uid)
      .not("status", "in", '("resolved","cancelled")')
      .limit(1)
      .then(({ data }) => setHasActiveAlert((data ?? []).length > 0))

    supabase
      .from("events")
      .select("occurred_at")
      .eq("patient_id", uid)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLastSyncedMinutes(Math.max(0, Math.floor((Date.now() - new Date(data[0].occurred_at).getTime()) / 60_000)))
        }
      })

    supabase
      .from("mood_logs")
      .select("score")
      .eq("patient_id", uid)
      .order("logged_at", { ascending: false })
      .limit(1)
      .then(({ data }) => { if (data && data.length > 0) setLatestMoodScore(data[0].score) })
  }, [session])

  useEffect(() => {
    async function fetchNearestHospital() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") return
        const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        const { data } = await supabase.rpc("nearest_er_facility", { lat: coords.latitude, lon: coords.longitude })
        const row = data as { name: string; phone: string | null } | null
        if (row?.name) setNearestHospital({ name: row.name, phone: row.phone ?? null })
      } catch { /* fall back to hardcoded KNH */ }
    }
    fetchNearestHospital()
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
        patient_id: session.user.id,
        logged_by: session.user.id,
        event_type: eventType.toLowerCase(),
        severity: "mild",
        occurred_at: new Date().toISOString(),
        details: {},
      })
    } finally {
      setLoggingEvent(null)
      setLogModalVisible(false)
    }
  }

  function onSosPressIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    Animated.spring(sosScale, { toValue: 0.97, useNativeDriver: true, tension: 240, friction: 12 }).start()
  }

  function onSosPressOut() {
    Animated.spring(sosScale, { toValue: 1, useNativeDriver: true, tension: 240, friction: 12 }).start()
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t("home_greeting_morning") : hour < 18 ? t("home_greeting_afternoon") : t("home_greeting_evening")
  const firstName = profile?.full_name?.split(" ")[0] ?? ""
  const initials = (profile?.full_name ?? "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
  const showCrisisCard = latestMoodScore !== null && latestMoodScore <= 2
  const nextMed = medications[0]
  const pad = spacing.xl
  const cardWidth = (width - pad * 2 - spacing.md) / 2

  function slot(i: number) {
    return { transform: [{ translateY: anims[i].y }], opacity: anims[i].op }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingHorizontal: pad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, slot(0)]}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[colors.teal, "#4A15C0"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.heroName}>{firstName || t("home_hero_fallback")}</Text>
              {lastSyncedMinutes !== null && (
                <Text style={styles.lastSynced}>
                  {lastSyncedMinutes < 1
                    ? t("home_last_synced_just_now")
                    : t("home_last_synced_mins", lastSyncedMinutes)}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Active alert banner ──────────────────────────────────────────── */}
        {hasActiveAlert && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push("/sos")}
            activeOpacity={0.85}
          >
            <Ionicons name="alert-circle" size={18} color="#fff" />
            <Text style={styles.alertBannerText}>{t("home_active_alert")}</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ── Hero stat banner ─────────────────────────────────────────────── */}
        <Animated.View style={slot(1)}>
          <HeroBanner name={firstName} streak={streakDays} circleCount={circleCount} />
        </Animated.View>

        {/* ── SOS button ───────────────────────────────────────────────────── */}
        <Animated.View style={[{ transform: [{ scale: sosScale }] }, slot(2)]}>
          <TouchableOpacity
            onPress={() => router.push("/sos")}
            onPressIn={onSosPressIn}
            onPressOut={onSosPressOut}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[colors.emergency, "#B91C1C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sosBtn}
            >
              <View style={styles.sosBtnInner}>
                <View>
                  <Text style={styles.sosBtnTitle}>{t("home_sos_title")}</Text>
                  <Text style={styles.sosBtnSub}>{t("home_sos_sub")}</Text>
                </View>
                <View style={styles.sosPowerWrap}>
                  <Ionicons name="power" size={26} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Quick actions strip ──────────────────────────────────────────── */}
        <Animated.View style={[{ marginHorizontal: -pad }, slot(3)]}>
          <QuickActions onLogEvent={() => setLogModalVisible(true)} />
        </Animated.View>

        {/* ── Protection card ──────────────────────────────────────────────── */}
        <Animated.View style={[styles.card, slot(4)]}>
          <ConcentricRings size={70} pulse={pulseAnim} />
          <View style={styles.circleText}>
            <View style={styles.protectedRow}>
              <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
              <Text style={styles.protectedLabel}>{t("home_protected")}</Text>
            </View>
            <Text style={styles.cardTitle}>{t("home_circle_active")}</Text>
            <Text style={styles.cardSub}>
              {circleCount > 0 ? t("home_circle_sub_plural", circleCount) : t("home_circle_sub_default")}
            </Text>
          </View>
        </Animated.View>

        {/* ── Medication card ───────────────────────────────────────────────── */}
        <Animated.View style={slot(5)}>
          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator color={colors.teal} />
            </View>
          ) : nextMed ? (
            <View style={styles.medCard}>
              <View style={styles.medIconWrap}>
                <MaterialCommunityIcons name="pill" size={24} color={colors.teal} />
              </View>
              <View style={styles.medInfo}>
                <Text style={styles.medTime}>
                  {t("home_next_med")} · {nextMed.schedule?.time ?? "—"}
                </Text>
                <Text style={styles.medName}>{nextMed.name}</Text>
                <Text style={styles.medDose}>{nextMed.dose}</Text>
              </View>
              <TouchableOpacity
                style={[styles.takenBtn, takenId === nextMed.id && styles.takenBtnDone]}
                onPress={() => handleTaken(nextMed)}
                disabled={takenId === nextMed.id}
                activeOpacity={0.85}
              >
                <Text style={styles.takenBtnText}>
                  {takenId === nextMed.id ? t("home_taken_done") : t("home_taken")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </Animated.View>

        {/* ── Emergency section ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.emergencyCard, slot(6)]}>
          <View style={styles.emergencyHeader}>
            <View style={styles.emergencyIconWrap}>
              <Ionicons name="medkit" size={20} color={colors.emergency} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>Emergency Access</Text>
              <Text style={styles.emergencyHospital} numberOfLines={1}>
                {nearestHospital?.name ?? "Kenyatta National Hospital"}
              </Text>
            </View>
          </View>
          <View style={styles.emergencyActions}>
            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => Linking.openURL("tel:999")}
              activeOpacity={0.82}
            >
              <Ionicons name="call-outline" size={15} color={colors.emergency} />
              <Text style={styles.emergencyBtnText}>Call 999</Text>
            </TouchableOpacity>
            <View style={styles.emergencyBtnDivider} />
            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => Linking.openURL("tel:112")}
              activeOpacity={0.82}
            >
              <Ionicons name="call-outline" size={15} color={colors.emergency} />
              <Text style={styles.emergencyBtnText}>Call 112</Text>
            </TouchableOpacity>
            <View style={styles.emergencyBtnDivider} />
            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() =>
                Linking.openURL(
                  nearestHospital?.phone ? `tel:${nearestHospital.phone}` : "tel:+254202726300",
                )
              }
              activeOpacity={0.82}
            >
              <Ionicons name="navigate-outline" size={15} color={colors.emergency} />
              <Text style={styles.emergencyBtnText}>Hospital</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── 2 × 2 Feature grid ───────────────────────────────────────────── */}
        <Animated.View style={[styles.grid, slot(7)]}>
          {GRID_ITEMS.map((item) => (
            <Pressable
              key={item.titleKey}
              style={({ pressed }) => [
                styles.gridItem,
                { width: cardWidth, opacity: pressed ? 0.82 : 1 },
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.gridIconBg, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.gridTitle}>{t(item.titleKey)}</Text>
              <Text style={styles.gridSub}>{t(item.subtitleKey)}</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={item.color}
                style={{ marginTop: 2, opacity: 0.7 }}
              />
            </Pressable>
          ))}
        </Animated.View>

        {/* ── Weather widget ────────────────────────────────────────────────── */}
        {weather && (
          <TouchableOpacity
            style={styles.weatherCard}
            onPress={() => setForecastOpen((v) => !v)}
            activeOpacity={0.88}
          >
            <View style={styles.weatherMain}>
              <Image source={{ uri: iconUrl(weather.current.iconCode) }} style={styles.weatherIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.weatherCity}>{weather.current.city}</Text>
                <Text style={styles.weatherDesc}>{weather.current.description}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.weatherTemp}>{weather.current.temp}°C</Text>
                <Text style={styles.weatherFeels}>{t("home_weather_feels", weather.current.feels_like)}</Text>
              </View>
            </View>

            <View style={styles.weatherStatsRow}>
              <View style={styles.weatherStat}>
                <Ionicons name="water-outline" size={13} color={colors.blue} />
                <Text style={styles.weatherStatTxt}>{t("home_weather_humidity", weather.current.humidity)}</Text>
              </View>
              <View style={styles.weatherStat}>
                <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
                <Text style={styles.weatherStatTxt}>{t("home_weather_wind", weather.current.wind_kph)}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/map" as any)}>
                <Text style={styles.weatherMapLink}>{t("home_weather_map")}</Text>
              </TouchableOpacity>
            </View>

            {weather.trigger && (
              <View style={styles.triggerRow}>
                <Ionicons name="warning-outline" size={14} color={colors.amber} />
                <Text style={styles.triggerTxt}>{weather.trigger}</Text>
              </View>
            )}

            {forecastOpen && (
              <View style={styles.forecastRow}>
                {weather.forecast.map((day) => (
                  <View key={day.day} style={styles.forecastItem}>
                    <Text style={styles.forecastDay}>{day.day}</Text>
                    <Image source={{ uri: iconUrl(day.iconCode) }} style={styles.forecastIcon} />
                    <Text style={styles.forecastHigh}>{day.high}°</Text>
                    <Text style={styles.forecastLow}>{day.low}°</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* ── Crisis resource card ─────────────────────────────────────────── */}
        {showCrisisCard && (
          <View style={styles.crisisCard}>
            <View style={styles.crisisHeader}>
              <View style={styles.crisisDot} />
              <Text style={styles.crisisTitle}>Feeling overwhelmed?</Text>
            </View>
            <Text style={styles.crisisOrg}>Befrienders Kenya</Text>
            <Text style={styles.crisisLine}>0800 723 253 · Free · 24/7</Text>
            <TouchableOpacity
              style={styles.crisisCallBtn}
              onPress={() => Linking.openURL("tel:0800723253")}
              activeOpacity={0.85}
            >
              <Text style={styles.crisisCallText}>{"Call now — it's free"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Log event modal ───────────────────────────────────────────────── */}
      <Modal
        visible={logModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t("home_log_event")}</Text>
            <View style={styles.modalOptions}>
              {LOG_EVENT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => handleLogEvent(option.value)}
                  disabled={loggingEvent === option.value}
                  activeOpacity={0.78}
                >
                  {loggingEvent === option.value ? (
                    <ActivityIndicator size="small" color={colors.teal} />
                  ) : (
                    <View style={styles.modalOptionDot} />
                  )}
                  <Text style={styles.modalOptionText}>{t(option.labelKey)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setLogModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingTop: spacing.md, paddingBottom: 56, gap: spacing.md },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: fonts.md },
  greeting: { fontSize: fonts.sm, color: colors.textSecondary },
  heroName: { fontSize: fonts.md, fontWeight: "800", color: colors.text },
  lastSynced: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 1 },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // Alert banner
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.emergency,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  alertBannerText: { flex: 1, color: "#fff", fontWeight: "700", fontSize: fonts.base },

  // Hero banner
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(123,53,250,0.22)",
    padding: spacing.xl,
    paddingBottom: 18,
    overflow: "hidden",
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  heroDecor: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  heroLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: colors.teal },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 14,
  },
  heroStat: { alignItems: "center", flex: 1 },
  heroStatValue: { fontSize: 36, fontWeight: "800", color: colors.text, lineHeight: 40 },
  heroStatLabel: { fontSize: fonts.xs, fontWeight: "700", color: colors.textSecondary, marginTop: 2 },
  heroStatSub: { fontSize: 10, color: colors.textMuted, marginTop: 1, letterSpacing: 0.5 },
  heroStatDivider: { width: 1, height: 44, backgroundColor: colors.border },
  heroSub: { fontSize: fonts.sm, color: colors.textSecondary, textAlign: "center" },

  // Quick actions
  quickActionsScroll: { flexGrow: 0 },
  quickActionsContent: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: 4 },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  quickChipIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickChipLabel: { fontSize: fonts.sm, fontWeight: "600" },

  // Generic card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },

  // Circle card text
  circleText: { flex: 1 },
  protectedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.teal },
  protectedLabel: { fontSize: fonts.xs, fontWeight: "700", color: colors.teal, letterSpacing: 1.5 },
  cardTitle: { fontSize: fonts.md, fontWeight: "700", color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 19 },

  // SOS
  sosBtn: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    paddingVertical: 20,
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  sosBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sosBtnTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 3 },
  sosBtnSub: { fontSize: fonts.sm, color: "rgba(255,255,255,0.80)" },
  sosPowerWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Medication
  medCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  medIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.tealDim,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  medInfo: { flex: 1 },
  medTime: { fontSize: fonts.xs, color: colors.textSecondary, marginBottom: 2 },
  medName: { fontSize: fonts.md, fontWeight: "700", color: colors.text },
  medDose: { fontSize: fonts.sm, color: colors.textSecondary },
  takenBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexShrink: 0,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  takenBtnDone: { backgroundColor: colors.tealDim, shadowOpacity: 0 },
  takenBtnText: { color: "#fff", fontWeight: "700", fontSize: fonts.sm },

  // Emergency
  emergencyCard: {
    backgroundColor: colors.emergencyDim,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.emergency + "38",
    padding: spacing.lg,
    gap: spacing.md,
  },
  emergencyHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  emergencyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.emergency + "20",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emergencyTitle: { fontSize: fonts.sm, fontWeight: "700", color: colors.emergency },
  emergencyHospital: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 1 },
  emergencyActions: {
    flexDirection: "row",
    backgroundColor: colors.emergency + "14",
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  emergencyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
  },
  emergencyBtnText: { fontSize: fonts.sm, fontWeight: "700", color: colors.emergency },
  emergencyBtnDivider: { width: 1, backgroundColor: colors.emergency + "30" },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridItem: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  gridIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  gridTitle: { fontSize: fonts.md, fontWeight: "700", color: colors.text },
  gridSub: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 17 },

  // Weather
  weatherCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  weatherMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  weatherIcon: { width: 52, height: 52 },
  weatherCity: { fontSize: fonts.sm, fontWeight: "700", color: colors.text },
  weatherDesc: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2, textTransform: "capitalize" },
  weatherTemp: { fontSize: fonts.xxl, fontWeight: "800", color: colors.text },
  weatherFeels: { fontSize: fonts.xs, color: colors.textMuted },
  weatherStatsRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  weatherStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  weatherStatTxt: { fontSize: fonts.xs, color: colors.textSecondary },
  weatherMapLink: { fontSize: fonts.xs, color: colors.teal, fontWeight: "700", marginLeft: "auto" },
  triggerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: colors.amberDim,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.amber + "40",
    padding: 10,
  },
  triggerTxt: { fontSize: fonts.xs, color: colors.amber, lineHeight: 17, flex: 1 },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  forecastItem: { alignItems: "center", gap: 2, flex: 1 },
  forecastDay: { fontSize: fonts.xs, color: colors.textMuted, fontWeight: "600" },
  forecastIcon: { width: 30, height: 30 },
  forecastHigh: { fontSize: fonts.sm, color: colors.text, fontWeight: "700" },
  forecastLow: { fontSize: fonts.xs, color: colors.textMuted },

  // Crisis
  crisisCard: {
    backgroundColor: "rgba(244,63,94,0.06)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.25)",
    padding: spacing.lg,
  },
  crisisHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  crisisDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emergency },
  crisisTitle: { fontSize: fonts.base, fontWeight: "700", color: colors.emergency },
  crisisOrg: { fontSize: fonts.lg, fontWeight: "800", color: colors.text, marginBottom: 2 },
  crisisLine: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: spacing.md },
  crisisCallBtn: {
    backgroundColor: colors.emergency,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  crisisCallText: { color: "#fff", fontWeight: "800", fontSize: fonts.base },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.bgCardAlt,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: { fontSize: fonts.lg, fontWeight: "800", color: colors.text, marginBottom: spacing.md, textAlign: "center" },
  modalOptions: { gap: spacing.sm, marginBottom: spacing.md },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  modalOptionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.teal },
  modalOptionText: { fontSize: fonts.md, fontWeight: "600", color: colors.text, flex: 1 },
  modalCancelBtn: { alignItems: "center", paddingVertical: spacing.lg },
  modalCancelText: { fontSize: fonts.md, color: colors.textSecondary, fontWeight: "600" },
})
