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
} from "react-native"

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"

import { LinearGradient } from "expo-linear-gradient"

import * as Haptics from "expo-haptics"

import { router } from "expo-router"

import { SafeAreaView } from "react-native-safe-area-context"

import { colors, fonts, radius, spacing } from "../../lib/theme"

import { useAuth } from "../_layout"

import {
  getMedications,
  logMedicationTaken,
  getCareCircle,
  type Medication,
  supabase,
} from "../../lib/supabase"

import { getWeather, iconUrl, type WeatherData } from "../../lib/weather"

const LOG_EVENT_OPTIONS = ["Seizure", "Headache", "Dizziness", "Other"] as const

const GRID_ITEMS = [
  {
    icon: "flash",
    lib: "ion",

    title: "Conditions",
    subtitle: "Types and triggers",
    route: "/records",

    color: "#F59E0B",
  },

  {
    icon: "people",
    lib: "ion",

    title: "Care Circle",
    subtitle: "You decide who sees what",
    route: "/circle",

    color: "#8B5CF6",
  },

  {
    icon: "shield-checkmark",
    lib: "ion",

    title: "My Doctor",
    subtitle: "Verified clinician link",
    route: "/circle",

    color: "#10B981",
  },

  {
    icon: "document-text",
    lib: "ion",

    title: "Records",
    subtitle: "Events, notes, reports",
    route: "/records",

    color: "#3B82F6",
  },
]

// ── Animated concentric rings ──────────────────────────────────────────────────

function ConcentricRings({
  size = 72,
  pulse,
}: {
  size?: number
  pulse: Animated.Value
}) {
  const r1 = size / 2

  const r2 = (size * 0.65) / 2

  const r3 = (size * 0.38) / 2

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: r1,

          borderWidth: 2,
          borderColor: "rgba(139,92,246,0.22)",

          transform: [
            {
              scale: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.06],
              }),
            },
          ],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.65,
          height: size * 0.65,
          borderRadius: r2,

          borderWidth: 2,
          borderColor: "rgba(139,92,246,0.45)",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.38,
          height: size * 0.38,
          borderRadius: r3,

          borderWidth: 2.5,
          borderColor: "rgba(139,92,246,0.8)",
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

          shadowOpacity: 0.9,
          shadowRadius: 6,
          elevation: 6,
        }}
      />
    </View>
  )
}

// ── Health banner ──────────────────────────────────────────────────────────────

function HealthBanner({ name, streak }: { name: string; streak: number }) {
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),

        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  return (
    <LinearGradient colors={["#1A1035", "#0D0B1E"]} style={styles.banner}>
      {/* ECG lines decoration */}
      <View style={styles.ecgDecor} pointerEvents="none">
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.ecgLine,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 0.5, 1],

                  outputRange: [0.04, 0.1 - i * 0.02, 0.04],
                }),

                top: 16 + i * 20,
              },
            ]}
          />
        ))}
        {/* Pulse spike */}
        <View style={styles.ecgSpike} />
      </View>

      <View style={styles.bannerContent}>
        <View>
          <Text style={styles.bannerLabel}>SEIZURE-FREE STREAK</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: 4,
              marginTop: 2,
            }}
          >
            <Text style={styles.bannerStreak}>{streak}</Text>
            <Text style={styles.bannerDays}>days</Text>
          </View>
          <Text style={styles.bannerSub}>
            Keep going, {name || "you're doing great"}.
          </Text>
        </View>

        {/* Heart rate visual */}
        <View style={styles.bannerChart}>
          <Animated.View
            style={[
              styles.bannerChartDot,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.4, 1, 0.4],
                }),

                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1.2, 0.8],
                    }),
                  },
                ],
              },
            ]}
          />
          <Ionicons
            name="heart"
            size={28}
            color={colors.emergency}
            style={{ opacity: 0.85 }}
          />
          <Text style={styles.bannerBpm}>
            72 <Text style={styles.bannerBpmLabel}>BPM</Text>
          </Text>
        </View>
      </View>
    </LinearGradient>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { width } = useWindowDimensions()

  const { profile, session } = useAuth()

  const [medications, setMedications] = useState<Medication[]>([])

  const [circleCount, setCircleCount] = useState(0)

  const [loading, setLoading] = useState(true)

  const [takenId, setTakenId] = useState<string | null>(null)

  const [weather, setWeather] = useState<WeatherData | null>(null)

  const [forecastOpen, setForecastOpen] = useState(false)

  const [streakDays, setStreakDays] = useState(0)

  const [hasActiveAlert, setHasActiveAlert] = useState(false)

  const [lastSyncedMinutes, setLastSyncedMinutes] = useState<number | null>(
    null,
  )

  const [logModalVisible, setLogModalVisible] = useState(false)

  const [loggingEvent, setLoggingEvent] = useState<string | null>(null)

  const pulseAnim = useRef(new Animated.Value(0.5)).current

  const sosScale = useRef(new Animated.Value(1)).current

  // Staggered entrance

  const anims = useRef(
    Array.from({ length: 7 }, () => ({
      y: new Animated.Value(28),

      op: new Animated.Value(0),
    })),
  ).current

  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.sequence([
        Animated.delay(i * 80 + 120),

        Animated.parallel([
          Animated.spring(a.y, {
            toValue: 0,
            tension: 65,
            friction: 14,
            useNativeDriver: true,
          }),

          Animated.timing(a.op, {
            toValue: 1,
            duration: 340,
            useNativeDriver: true,
          }),
        ]),
      ]).start()
    })

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),

        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    getWeather().then(setWeather)
  }, [])

  useEffect(() => {
    if (!session?.user) return

    const uid = session.user.id

    Promise.all([getMedications(uid), getCareCircle(uid)]).then(
      ([meds, circle]) => {
        setMedications(meds)

        setCircleCount(circle.length)

        setLoading(false)
      },
    )

    supabase

      .from("events")

      .select("occurred_at")

      .eq("user_id", uid)

      .in("type", ["seizure", "sz", "tonic-clonic", "absence"])

      .order("occurred_at", { ascending: false })

      .limit(1)

      .then(({ data }) => {
        if (!data || data.length === 0) {
          setStreakDays(30)
          return
        }

        const days = Math.floor(
          (Date.now() - new Date(data[0].occurred_at).getTime()) / 86_400_000,
        )

        setStreakDays(Math.max(0, days))
      })

    // Check for open SOS alerts

    supabase

      .from("sos_events")

      .select("id")

      .eq("patient_id", uid)

      .not("status", "in", '("resolved","cancelled")')

      .limit(1)

      .then(({ data }) => {
        setHasActiveAlert((data ?? []).length > 0)
      })

    // Last synced: most recent event timestamp

    supabase

      .from("events")

      .select("occurred_at")

      .eq("patient_id", uid)

      .order("occurred_at", { ascending: false })

      .limit(1)

      .then(({ data }) => {
        if (data && data.length > 0) {
          const mins = Math.floor(
            (Date.now() - new Date(data[0].occurred_at).getTime()) / 60_000,
          )

          setLastSyncedMinutes(Math.max(0, mins))
        }
      })
  }, [session])

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

    Animated.spring(sosScale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 220,
      friction: 12,
    }).start()
  }

  function onSosPressOut() {
    Animated.spring(sosScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 220,
      friction: 12,
    }).start()
  }

  const hour = new Date().getHours()

  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  const firstName = profile?.full_name?.split(" ")[0] ?? ""

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const nextMed = medications[0]

  const pad = spacing.xl // 20

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
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, slot(0)]}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={["#8B5CF6", "#6D28D9"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.heroName}>
                {firstName || "Your care, your control"}
              </Text>
              {lastSyncedMinutes !== null && (
                <Text style={styles.lastSynced}>
                  Last synced:{" "}
                  {lastSyncedMinutes < 1
                    ? "just now"
                    : `${lastSyncedMinutes} min ago`}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => {}}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Active alert banner ─────────────────────────────────────────── */}
        {hasActiveAlert && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push("/sos")}
            activeOpacity={0.85}
          >
            <Ionicons name="alert-circle" size={18} color="#fff" />
            <Text style={styles.alertBannerText}>
              Active alert — tap to view
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ── Health banner ───────────────────────────────────────────────── */}
        <Animated.View style={slot(1)}>
          <HealthBanner name={firstName} streak={streakDays} />
        </Animated.View>

        {/* ── Circle protection card ─────────────────────────────────────── */}
        <Animated.View style={[styles.card, slot(2)]}>
          <ConcentricRings size={72} pulse={pulseAnim} />
          <View style={styles.circleText}>
            <View style={styles.protectedRow}>
              <Animated.View
                style={[styles.pulseDot, { opacity: pulseAnim }]}
              />
              <Text style={styles.protectedLabel}>PROTECTED</Text>
            </View>
            <Text style={styles.cardTitle}>Your Circle is active</Text>
            <Text style={styles.cardSub}>
              {circleCount > 0
                ? `${circleCount} trusted contact${
                    circleCount !== 1 ? "s" : ""
                  } ready to be alerted.`
                : "Trusted contacts are ready to be alerted the moment you need them."}
            </Text>
          </View>
        </Animated.View>

        {/* ── SOS button ─────────────────────────────────────────────────── */}
        <Animated.View style={[{ transform: [{ scale: sosScale }] }, slot(3)]}>
          <TouchableOpacity
            onPress={() => router.push("/sos")}
            onLongPress={() => router.push("/sos")}
            onPressIn={onSosPressIn}
            onPressOut={onSosPressOut}
            activeOpacity={1}
          >
            <LinearGradient
              colors={["#EF4444", "#C0392B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sosBtn}
            >
              <View style={styles.sosBtnInner}>
                <View>
                  <Text style={styles.sosBtnTitle}>Hold to send SOS</Text>
                  <Text style={styles.sosBtnSub}>
                    Alerts your Circle with live location
                  </Text>
                </View>
                <View style={styles.sosPowerWrap}>
                  <Ionicons name="power" size={26} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Medication card ────────────────────────────────────────────── */}
        <Animated.View style={slot(4)}>
          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator color={colors.teal} />
            </View>
          ) : nextMed ? (
            <View style={styles.medCard}>
              <View style={styles.medIconWrap}>
                <MaterialCommunityIcons
                  name="pill"
                  size={24}
                  color={colors.teal}
                />
              </View>
              <View style={styles.medInfo}>
                <Text style={styles.medTime}>
                  Next medication · {nextMed.schedule?.time ?? "—"}
                </Text>
                <Text style={styles.medName}>{nextMed.name}</Text>
                <Text style={styles.medDose}>{nextMed.dose}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.takenBtn,
                  takenId === nextMed.id && styles.takenBtnDone,
                ]}
                onPress={() => handleTaken(nextMed)}
                disabled={takenId === nextMed.id}
                activeOpacity={0.85}
              >
                <Text style={styles.takenBtnText}>
                  {takenId === nextMed.id ? "✓ Done" : "Taken"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </Animated.View>

        {/* ── Ambulance quick-dial ────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.ambulanceRow}
          onPress={() => Linking.openURL("tel:999")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Call ambulance 999 or 112"
        >
          <View style={styles.ambulanceIconWrap}>
            <Ionicons name="medical" size={18} color={colors.emergency} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ambulanceLabel}>Call ambulance</Text>
            <Text style={styles.ambulanceNum}>999 / 112 — free, always on</Text>
          </View>
          <Ionicons name="call" size={16} color={colors.emergency} />
        </TouchableOpacity>

        {/* ── Nearest hospital card ──────────────────────────────────────── */}
        <View style={styles.hospitalCard}>
          <View style={styles.hospitalIconWrap}>
            <Ionicons name="medkit" size={22} color={colors.emergency} />
          </View>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalLabel}>Nearest hospital</Text>
            <Text style={styles.hospitalName}>Kenyatta National Hospital</Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL("tel:+254202726300")}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Quick log button ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.quickLogBtn}
          onPress={() => setLogModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.teal} />
          <Text style={styles.quickLogBtnText}>Log event</Text>
        </TouchableOpacity>

        {/* ── 2×2 Quick access grid ─────────────────────────────────────── */}
        <Animated.View style={[styles.grid, slot(5)]}>
          {GRID_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.gridItem, { width: cardWidth }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.82}
            >
              <View
                style={[
                  styles.gridIconBg,
                  { backgroundColor: item.color + "18" },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={item.color}
                />
              </View>
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── Weather widget ─────────────────────────────────────────────── */}
        {weather && (
          <Animated.View style={slot(6)}>
            <TouchableOpacity
              style={styles.weatherCard}
              onPress={() => setForecastOpen((v) => !v)}
              activeOpacity={0.88}
            >
              <View style={styles.weatherMain}>
                <Image
                  source={{ uri: iconUrl(weather.current.iconCode) }}
                  style={styles.weatherIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.weatherCity}>{weather.current.city}</Text>
                  <Text style={styles.weatherDesc}>
                    {weather.current.description}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.weatherTemp}>
                    {weather.current.temp}°C
                  </Text>
                  <Text style={styles.weatherFeels}>
                    Feels {weather.current.feels_like}°
                  </Text>
                </View>
              </View>

              <View style={styles.weatherStatsRow}>
                <View style={styles.weatherStat}>
                  <Ionicons
                    name="water-outline"
                    size={13}
                    color={colors.blue}
                  />
                  <Text style={styles.weatherStatTxt}>
                    {weather.current.humidity}% humidity
                  </Text>
                </View>
                <View style={styles.weatherStat}>
                  <Ionicons
                    name="flag-outline"
                    size={13}
                    color={colors.textMuted}
                  />
                  <Text style={styles.weatherStatTxt}>
                    {weather.current.wind_kph} km/h wind
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/map" as any)}>
                  <Text style={styles.weatherMapLink}>Map →</Text>
                </TouchableOpacity>
              </View>

              {weather.trigger && (
                <View style={styles.triggerRow}>
                  <Ionicons
                    name="warning-outline"
                    size={14}
                    color={colors.amber}
                  />
                  <Text style={styles.triggerTxt}>{weather.trigger}</Text>
                </View>
              )}

              {forecastOpen && (
                <View style={styles.forecastRow}>
                  {weather.forecast.map((day) => (
                    <View key={day.day} style={styles.forecastItem}>
                      <Text style={styles.forecastDay}>{day.day}</Text>
                      <Image
                        source={{ uri: iconUrl(day.iconCode) }}
                        style={styles.forecastIcon}
                      />
                      <Text style={styles.forecastHigh}>{day.high}°</Text>
                      <Text style={styles.forecastLow}>{day.low}°</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Log event modal ─────────────────────────────────────────────── */}
      <Modal
        visible={logModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Log event</Text>
            {LOG_EVENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => handleLogEvent(option)}
                disabled={loggingEvent === option}
                activeOpacity={0.8}
              >
                {loggingEvent === option ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.teal}
                    style={{ marginRight: spacing.md }}
                  />
                ) : (
                  <View style={styles.modalOptionDot} />
                )}
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setLogModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  scroll: { flex: 1 },

  container: { paddingTop: spacing.md, paddingBottom: 40, gap: spacing.md },

  // Header

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: { color: "#fff", fontWeight: "800", fontSize: fonts.md },

  greeting: { fontSize: fonts.sm, color: colors.textSecondary },

  heroName: { fontSize: fonts.md, fontWeight: "700", color: colors.text },

  lastSynced: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.emergency,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  alertBannerText: {
    flex: 1,
    color: "#fff",
    fontWeight: "700",
    fontSize: fonts.base,
  },

  ambulanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.emergencyDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.emergency + "40",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  ambulanceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.emergency + "20",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  ambulanceLabel: {
    fontSize: fonts.sm,
    fontWeight: "700",
    color: colors.emergency,
  },

  ambulanceNum: {
    fontSize: fonts.xs,
    color: colors.emergency,
    opacity: 0.75,
    marginTop: 1,
  },

  hospitalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  hospitalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.emergencyDim,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  hospitalInfo: { flex: 1 },

  hospitalLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  hospitalName: { fontSize: fonts.md, fontWeight: "700", color: colors.text },

  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.emergency,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  quickLogBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    alignSelf: "flex-start",
  },

  quickLogBtnText: {
    color: colors.teal,
    fontWeight: "700",
    fontSize: fonts.sm,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: 36,
    gap: spacing.sm,
  },

  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  modalOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.teal,
  },

  modalOptionText: {
    fontSize: fonts.md,
    fontWeight: "600",
    color: colors.text,
  },

  modalCancelBtn: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },

  modalCancelText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,

    alignItems: "center",
    justifyContent: "center",
  },

  // Health banner

  banner: {
    borderRadius: radius.xl,

    borderWidth: 1,

    borderColor: "rgba(139,92,246,0.2)",

    padding: spacing.xl,

    overflow: "hidden",

    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },

  ecgDecor: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },

  ecgLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,

    backgroundColor: colors.teal,
  },

  ecgSpike: {
    position: "absolute",
    right: 60,
    top: 28,

    width: 2,
    height: 28,

    backgroundColor: colors.emergency,

    opacity: 0.3,
  },

  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bannerLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.teal,
    letterSpacing: 1.2,
  },

  bannerStreak: {
    fontSize: 52,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 56,
  },

  bannerDays: {
    fontSize: fonts.xl,
    fontWeight: "600",
    color: colors.textSecondary,
    paddingBottom: 6,
  },

  bannerSub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 4 },

  bannerChart: { alignItems: "center", gap: 6 },

  bannerChartDot: {
    position: "absolute",
    top: -8,

    width: 10,
    height: 10,
    borderRadius: 5,

    backgroundColor: colors.emergency,
  },

  bannerBpm: {
    fontSize: fonts.xl,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },

  bannerBpmLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: "500",
  },

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
  },

  // Circle card text

  circleText: { flex: 1 },

  protectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },

  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.teal,
  },

  protectedLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.teal,
    letterSpacing: 1.5,
  },

  cardTitle: {
    fontSize: fonts.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },

  cardSub: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 19 },

  // SOS

  sosBtn: {
    borderRadius: radius.xl,

    padding: spacing.lg,

    paddingVertical: 18,

    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },

  sosBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sosBtnTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 3,
  },

  sosBtnSub: { fontSize: fonts.sm, color: "rgba(255,255,255,0.8)" },

  sosPowerWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,

    backgroundColor: "rgba(0,0,0,0.25)",

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
  },

  medIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,

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
  },

  takenBtnDone: { backgroundColor: colors.tealDim },

  takenBtnText: { color: "#fff", fontWeight: "700", fontSize: fonts.sm },

  // Grid

  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },

  gridItem: {
    backgroundColor: colors.bgCard,

    borderRadius: radius.xl,

    borderWidth: 1,
    borderColor: colors.border,

    padding: spacing.lg,

    gap: 6,
  },

  gridIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 4,
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
  },

  weatherMain: { flexDirection: "row", alignItems: "center", gap: 10 },

  weatherIcon: { width: 52, height: 52 },

  weatherCity: { fontSize: fonts.sm, fontWeight: "700", color: colors.text },

  weatherDesc: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
  },

  weatherTemp: { fontSize: fonts.xxl, fontWeight: "800", color: colors.text },

  weatherFeels: { fontSize: fonts.xs, color: colors.textMuted },

  weatherStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },

  weatherStat: { flexDirection: "row", alignItems: "center", gap: 4 },

  weatherStatTxt: { fontSize: fonts.xs, color: colors.textSecondary },

  weatherMapLink: {
    fontSize: fonts.xs,
    color: colors.teal,
    fontWeight: "700",
    marginLeft: "auto",
  },

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

  triggerTxt: {
    fontSize: fonts.xs,
    color: colors.amber,
    lineHeight: 17,
    flex: 1,
  },

  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },

  forecastItem: { alignItems: "center", gap: 2, flex: 1 },

  forecastDay: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    fontWeight: "600",
  },

  forecastIcon: { width: 30, height: 30 },

  forecastHigh: { fontSize: fonts.sm, color: colors.text, fontWeight: "700" },

  forecastLow: { fontSize: fonts.xs, color: colors.textMuted },
})
