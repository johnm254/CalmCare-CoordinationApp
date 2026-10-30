import { createContext, useContext, useEffect, useRef, useState } from "react"

import {
  Animated,
  AppState,
  AppStateStatus,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import { Stack, router } from "expo-router"

import { StatusBar } from "expo-status-bar"

import { SafeAreaProvider } from "react-native-safe-area-context"

import * as Updates from "expo-updates"

import * as Notifications from "expo-notifications"

import * as Location from "expo-location"

import * as LocalAuthentication from "expo-local-authentication"

import type { Session } from "@supabase/supabase-js"

import {
  supabase,
  getProfile,
  registerPushToken,
  type Profile,
} from "../lib/supabase"

import { colors, fonts, radius, spacing } from "../lib/theme"

import { initializeDB } from "../db/offline"

import {
  registerNotificationCategories,
  requestNotificationPermission,
  getExpoPushToken,
} from "../lib/notifications"

import { I18nProvider } from "../lib/i18n-context"

// ── Auth context ──────────────────────────────────────────────────────────────

interface AuthContextType {
  session: Session | null

  profile: Profile | null

  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  isLoading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

// ── Update state machine ──────────────────────────────────────────────────────

type UpdateStatus = "idle" | "downloading" | "ready" | "applying"

// ── Animated splash screen ────────────────────────────────────────────────────

function SplashOverlay({ exiting }: { exiting: boolean }) {
  const ring1 = useRef(new Animated.Value(0)).current

  const ring2 = useRef(new Animated.Value(0)).current

  const ring3 = useRef(new Animated.Value(0)).current

  const coreS = useRef(new Animated.Value(0)).current

  const titleY = useRef(new Animated.Value(20)).current

  const titleOp = useRef(new Animated.Value(0)).current

  const tagOp = useRef(new Animated.Value(0)).current

  const exitOp = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const spring = (v: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),

        Animated.spring(v, {
          toValue: 1,
          tension: 55,
          friction: 11,
          useNativeDriver: true,
        }),
      ])

    spring(ring1, 0).start()

    spring(ring2, 180).start()

    spring(ring3, 340).start()

    Animated.sequence([
      Animated.delay(280),

      Animated.spring(coreS, {
        toValue: 1,
        tension: 160,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    Animated.sequence([
      Animated.delay(520),

      Animated.parallel([
        Animated.spring(titleY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),

        Animated.timing(titleOp, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    Animated.sequence([
      Animated.delay(850),

      Animated.timing(tagOp, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    if (exiting) {
      Animated.timing(exitOp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start()
    }
  }, [exiting])

  return (
    <Animated.View
      style={[splashStyles.container, { opacity: exitOp }]}
      pointerEvents="none"
    >
      <View style={splashStyles.logoWrap}>
        <Animated.View
          style={[
            splashStyles.ring,
            splashStyles.r1,
            {
              opacity: ring1,

              transform: [
                {
                  scale: ring1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            splashStyles.ring,
            splashStyles.r2,
            {
              opacity: ring2,

              transform: [
                {
                  scale: ring2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            splashStyles.ring,
            splashStyles.r3,
            {
              opacity: ring3,

              transform: [
                {
                  scale: ring3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            splashStyles.core,
            { transform: [{ scale: coreS }], opacity: coreS },
          ]}
        />
      </View>
      <Animated.View
        style={{
          alignItems: "center",
          transform: [{ translateY: titleY }],
          opacity: titleOp,
        }}
      >
        <Text style={splashStyles.brand}>mojo</Text>
      </Animated.View>
      <Animated.Text style={[splashStyles.tagline, { opacity: tagOp }]}>
        Care · Connect · Protect
      </Animated.Text>
    </Animated.View>
  )
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: colors.bg,

    alignItems: "center",

    justifyContent: "center",

    zIndex: 999,

    gap: spacing.lg,
  },

  logoWrap: {
    width: 120,
    height: 120,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: spacing.xl,
  },

  ring: { position: "absolute", borderWidth: 2 },

  r1: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: "rgba(139,92,246,0.20)",
  },

  r2: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderColor: "rgba(139,92,246,0.45)",
  },

  r3: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderColor: "rgba(139,92,246,0.75)",
  },

  core: {
    width: 22,
    height: 22,
    borderRadius: 11,

    backgroundColor: colors.teal,

    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },

  brand: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.text,

    letterSpacing: 7,
    marginBottom: 2,
  },

  tagline: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
})

// ── Biometric lock screen ─────────────────────────────────────────────────────

function BiometricLock({ onUnlock }: { onUnlock: () => void }) {
  const ringPulse = useRef(new Animated.Value(1)).current

  const btnScale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, {
          toValue: 1.08,
          duration: 1600,
          useNativeDriver: true,
        }),

        Animated.timing(ringPulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Auto-prompt on mount

    handleUnlock()
  }, [])

  async function handleUnlock() {
    const has = await LocalAuthentication.hasHardwareAsync()

    const enrolled = await LocalAuthentication.isEnrolledAsync()

    if (!has || !enrolled) {
      onUnlock()
      return
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify to continue",

      fallbackLabel: "Use passcode",
    })

    if (result.success) onUnlock()
  }

  function onPressIn() {
    Animated.spring(btnScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start()
  }

  function onPressOut() {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start()
  }

  return (
    <View style={bioStyles.container}>
      <View style={bioStyles.logoWrap}>
        <Animated.View
          style={[
            bioStyles.ring,
            bioStyles.r1,
            { transform: [{ scale: ringPulse }] },
          ]}
        />
        <View style={[bioStyles.ring, bioStyles.r2]} />
        <View style={[bioStyles.ring, bioStyles.r3]} />
        <View style={bioStyles.core} />
      </View>
      <Text style={bioStyles.title}>Locked</Text>
      <Text style={bioStyles.sub}>Verify your identity to continue</Text>
      <Animated.View
        style={{ transform: [{ scale: btnScale }], marginTop: spacing.xxl }}
      >
        <TouchableOpacity
          onPress={handleUnlock}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={bioStyles.btn}
          activeOpacity={1}
        >
          <Text style={bioStyles.btnText}>Unlock</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const bioStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: colors.bg,

    alignItems: "center",

    justifyContent: "center",

    zIndex: 998,

    gap: spacing.md,
  },

  logoWrap: {
    width: 110,
    height: 110,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: spacing.xl,
  },

  ring: { position: "absolute", borderWidth: 2 },

  r1: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderColor: "rgba(139,92,246,0.18)",
  },

  r2: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderColor: "rgba(139,92,246,0.42)",
  },

  r3: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderColor: "rgba(139,92,246,0.72)",
  },

  core: {
    width: 20,
    height: 20,
    borderRadius: 10,

    backgroundColor: colors.teal,

    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },

  title: {
    fontSize: fonts.xxl,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.lg,
  },

  sub: { fontSize: fonts.base, color: colors.textSecondary },

  btn: {
    backgroundColor: colors.teal,

    paddingVertical: 16,
    paddingHorizontal: 56,

    borderRadius: radius.xl,

    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.5,
  },
})

// ── Root layout ───────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)

  const [initialized, setInitialized] = useState(false)

  // Splash + biometric

  const [splashDone, setSplashDone] = useState(false)

  const [splashExiting, setSplashExiting] = useState(false)

  const [locked, setLocked] = useState(false)

  const bgStartRef = useRef<number | null>(null)

  // Update flow

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle")

  const [downloadPct, setDownloadPct] = useState(0)

  const [countdown, setCountdown] = useState(15)

  // Animations

  const sheetY = useRef(new Animated.Value(320)).current

  const overlayOp = useRef(new Animated.Value(0)).current

  const progressAnim = useRef(new Animated.Value(0)).current

  const checkScale = useRef(new Animated.Value(0)).current

  const shimmerX = useRef(new Animated.Value(-220)).current

  const shimmerLoop = useRef<Animated.CompositeAnimation | null>(null)

  const autoApplyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const downloadFakeTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Sheet show / hide ──────────────────────────────────────────────────────

  function showSheet() {
    Animated.parallel([
      Animated.spring(sheetY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 13,
      }),

      Animated.timing(overlayOp, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }

  function hideSheet(cb?: () => void) {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 320,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(overlayOp, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setUpdateStatus("idle")
      cb?.()
    })
  }

  // ── Shimmer during download ────────────────────────────────────────────────

  function startShimmer() {
    shimmerX.setValue(-220)

    shimmerLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: 320,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.timing(shimmerX, {
          toValue: -220,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )

    shimmerLoop.current.start()
  }

  function stopShimmer() {
    shimmerLoop.current?.stop()
  }

  // ── Fake download progress (expo-updates gives no % callback) ─────────────

  function startFakeProgress() {
    setDownloadPct(0)

    progressAnim.setValue(0)

    let current = 0

    downloadFakeTimer.current = setInterval(() => {
      const increment =
        current < 40 ? 3 : current < 70 ? 1.5 : current < 88 ? 0.6 : 0

      current = Math.min(current + increment, 89)

      setDownloadPct(Math.round(current))

      Animated.timing(progressAnim, {
        toValue: current / 100,
        duration: 250,
        useNativeDriver: false,
      }).start()
    }, 200)
  }

  function completeProgress() {
    if (downloadFakeTimer.current) clearInterval(downloadFakeTimer.current)

    setDownloadPct(100)

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: false,
    }).start()
  }

  // ── Check-in animation when switching to ready ────────────────────────────

  function animateCheckIn() {
    checkScale.setValue(0)

    Animated.spring(checkScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 7,
    }).start()
  }

  // ── Countdown timer in ready state ────────────────────────────────────────

  function startCountdown() {
    setCountdown(15)

    countdownTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownTimer.current!)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  // ── Apply update ──────────────────────────────────────────────────────────

  async function applyUpdate() {
    if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current)

    if (countdownTimer.current) clearInterval(countdownTimer.current)

    setUpdateStatus("applying")

    try {
      await Updates.reloadAsync()
    } catch {
      hideSheet()
    }
  }

  function dismissUpdate() {
    if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current)

    if (countdownTimer.current) clearInterval(countdownTimer.current)

    stopShimmer()

    hideSheet()
  }

  // ── OTA check ─────────────────────────────────────────────────────────────

  async function checkForOTAUpdate() {
    try {
      if (__DEV__) return

      const update = await Updates.checkForUpdateAsync()

      if (!update.isAvailable) return

      setUpdateStatus("downloading")

      showSheet()

      startFakeProgress()

      startShimmer()

      await Updates.fetchUpdateAsync()

      stopShimmer()

      completeProgress()

      // Brief pause so the 100% lands visually before switching state

      setTimeout(() => {
        setUpdateStatus("ready")

        animateCheckIn()

        startCountdown()

        autoApplyTimer.current = setTimeout(() => applyUpdate(), 15_000)
      }, 600)
    } catch {
      stopShimmer()

      if (downloadFakeTimer.current) clearInterval(downloadFakeTimer.current)

      hideSheet()
    }
  }

  // ── Auth + boot effects ───────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)

      if (session?.user) {
        const p = await getProfile(session.user.id)

        setProfile(p)

        getExpoPushToken().then((token) => {
          if (token && session.user)
            registerPushToken(session.user.id, token).catch(() => {})
        })
      }

      setInitialized(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      if (session?.user) {
        const p = await getProfile(session.user.id)

        setProfile(p)

        getExpoPushToken().then((token) => {
          if (token && session?.user)
            registerPushToken(session.user.id, token).catch(() => {})
        })
      } else {
        setProfile(null)
      }

      if (event === "SIGNED_IN") router.replace("/(tabs)")

      if (event === "SIGNED_OUT") router.replace("/(auth)/login")
    })

    const notifTapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content
          .data as Record<string, string | undefined>

        if (data?.type === "sos_alert" && data.sos_id) {
          const params = new URLSearchParams({
            sosId: data.sos_id,

            ...(data.alert_id ? { alertId: data.alert_id } : {}),

            ...(data.patient_name ? { patientName: data.patient_name } : {}),

            ...(data.location_lat ? { lat: data.location_lat } : {}),

            ...(data.location_lon ? { lon: data.location_lon } : {}),
          })

          router.push(`/sos-alert?${params.toString()}`)
        }
      },
    )

    initializeDB().catch(console.error)

    registerNotificationCategories().catch(console.error)

    requestNotificationPermission().catch(console.error)

    Location.requestForegroundPermissionsAsync().catch(() => {})

    checkForOTAUpdate()

    // Dismiss splash after 1.8s (animations complete by then)

    const splashTimer = setTimeout(() => {
      setSplashExiting(true)

      setTimeout(() => setSplashDone(true), 500)
    }, 1800)

    const appStateSub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "background" || state === "inactive") {
          bgStartRef.current = Date.now()
        }

        if (state === "active") {
          checkForOTAUpdate()

          if (bgStartRef.current !== null) {
            const elapsed = Date.now() - bgStartRef.current

            bgStartRef.current = null

            if (elapsed >= 5 * 60 * 1000) {
              LocalAuthentication.hasHardwareAsync().then((has) => {
                if (has) setLocked(true)
              })
            }
          }
        }
      },
    )

    return () => {
      subscription.unsubscribe()

      appStateSub.remove()

      notifTapSub.remove()

      clearTimeout(splashTimer)

      if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current)

      if (countdownTimer.current) clearInterval(countdownTimer.current)

      if (downloadFakeTimer.current) clearInterval(downloadFakeTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!initialized) return

    if (!session) router.replace("/(auth)/login")
  }, [initialized, session])

  if (!initialized) return null

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  })

  return (
    <SafeAreaProvider>
      <I18nProvider>
      <AuthContext.Provider
        value={{ session, profile, isLoading: !initialized }}
      >
        <StatusBar style="light" backgroundColor={colors.bg} />

        {/* Splash overlay — shown until 1.8s, fades out over 500ms */}
        {!splashDone && <SplashOverlay exiting={splashExiting} />}

        {/* Biometric lock — shown after 5-min background */}
        {locked && <BiometricLock onUnlock={() => setLocked(false)} />}

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen
            name="sos"
            options={{ presentation: "fullScreenModal" }}
          />
          <Stack.Screen name="insights" />
          <Stack.Screen
            name="circle-invite"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="sos-alert"
            options={{ presentation: "fullScreenModal" }}
          />
        </Stack>

        {/* ── Applying full-screen overlay ─────────────────────────────── */}
        {updateStatus === "applying" && (
          <View style={styles.applyingOverlay}>
            <View style={styles.applyingCard}>
              <View style={styles.applyingIconRing}>
                <View style={styles.applyingIconInner} />
              </View>
              <Text style={styles.applyingTitle}>Installing update</Text>
              <Text style={styles.applyingSub}>Back in a moment…</Text>
              <View style={styles.applyingDots}>
                {[0, 1, 2].map((i) => (
                  <ApplyingDot key={i} delay={i * 180} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Dim overlay ──────────────────────────────────────────────── */}
        {updateStatus !== "idle" && updateStatus !== "applying" && (
          <Animated.View
            style={[styles.dimOverlay, { opacity: overlayOp }]}
            pointerEvents="none"
          />
        )}

        {/* ── Update bottom sheet ──────────────────────────────────────── */}
        {updateStatus !== "idle" && updateStatus !== "applying" && (
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
          >
            {/* Handle */}
            <View style={styles.handle} />

            {updateStatus === "downloading" && (
              <>
                {/* Icon row */}
                <View style={styles.iconRow}>
                  <View style={styles.downloadIconRing}>
                    <View style={styles.downloadArrow} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>Downloading update</Text>
                    <Text style={styles.sheetSub}>
                      App stays open — no interruption
                    </Text>
                  </View>
                  <Text style={styles.pctLabel}>{downloadPct}%</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[styles.progressFill, { width: progressWidth }]}
                  >
                    {/* Shimmer strip */}
                    <Animated.View
                      style={[
                        styles.shimmer,
                        { transform: [{ translateX: shimmerX }] },
                      ]}
                    />
                  </Animated.View>
                </View>

                {/* Step labels */}
                <View style={styles.stepRow}>
                  <StepLabel done={downloadPct >= 10} label="Checking" />
                  <View style={styles.stepDash} />
                  <StepLabel
                    done={downloadPct >= 50}
                    label="Downloading"
                    active={downloadPct >= 10 && downloadPct < 95}
                  />
                  <View style={styles.stepDash} />
                  <StepLabel done={downloadPct >= 100} label="Ready" />
                </View>
              </>
            )}

            {updateStatus === "ready" && (
              <>
                {/* Check icon */}
                <View style={styles.iconRow}>
                  <Animated.View
                    style={[
                      styles.checkRing,
                      { transform: [{ scale: checkScale }] },
                    ]}
                  >
                    <Text style={styles.checkMark}>✓</Text>
                  </Animated.View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>Update ready</Text>
                    <Text style={styles.sheetSub}>
                      Restart takes about 2 seconds
                    </Text>
                  </View>
                </View>

                {/* Full progress bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: "100%" }]} />
                </View>

                {/* Countdown */}
                <Text style={styles.countdownText}>
                  Auto-installing in{" "}
                  <Text style={{ color: colors.teal, fontWeight: "700" }}>
                    {countdown}s
                  </Text>
                </Text>

                {/* Buttons */}
                <TouchableOpacity
                  style={styles.installBtn}
                  onPress={applyUpdate}
                  activeOpacity={0.85}
                >
                  <Text style={styles.installBtnText}>Install now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.laterBtn}
                  onPress={dismissUpdate}
                  activeOpacity={0.7}
                >
                  <Text style={styles.laterBtnText}>Maybe later</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}
      </AuthContext.Provider>
      </I18nProvider>
    </SafeAreaProvider>
  )
}

// ── Animated dot for applying state ──────────────────────────────────────────

function ApplyingDot({ delay }: { delay: number }) {
  const op = useRef(new Animated.Value(0.2)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),

        Animated.timing(op, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),

        Animated.timing(op, {
          toValue: 0.2,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    )

    anim.start()

    return () => anim.stop()
  }, [])

  return <Animated.View style={[styles.dot, { opacity: op }]} />
}

// ── Step label helper ─────────────────────────────────────────────────────────

function StepLabel({
  label,
  done,
  active,
}: {
  label: string
  done: boolean
  active?: boolean
}) {
  const color = done ? colors.teal : active ? colors.text : colors.textMuted

  return (
    <Text style={[styles.stepLabel, { color }]}>
      {done ? "✓ " : ""}
      {label}
    </Text>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Dim overlay

  dimOverlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(0,0,0,0.45)",

    zIndex: 90,
  },

  // Bottom sheet

  sheet: {
    position: "absolute",

    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor: colors.bgCard,

    borderTopLeftRadius: radius.xxl,

    borderTopRightRadius: radius.xxl,

    borderWidth: 1,

    borderColor: colors.border,

    paddingHorizontal: spacing.xl,

    paddingBottom: 36,

    paddingTop: spacing.md,

    zIndex: 100,

    shadowColor: "#000",

    shadowOffset: { width: 0, height: -8 },

    shadowOpacity: 0.5,

    shadowRadius: 24,

    elevation: 24,
  },

  handle: {
    alignSelf: "center",

    width: 36,
    height: 4,

    borderRadius: 2,

    backgroundColor: colors.borderLight,

    marginBottom: spacing.xl,
  },

  // Icon rows

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,

    marginBottom: spacing.lg,
  },

  downloadIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,

    backgroundColor: colors.tealDim,

    borderWidth: 1.5,
    borderColor: colors.teal,

    alignItems: "center",
    justifyContent: "center",
  },

  downloadArrow: {
    width: 12,
    height: 14,

    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,

    borderColor: colors.teal,

    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  checkRing: {
    width: 44,
    height: 44,
    borderRadius: 22,

    backgroundColor: "rgba(34,200,122,0.15)",

    borderWidth: 1.5,
    borderColor: colors.success,

    alignItems: "center",
    justifyContent: "center",
  },

  checkMark: { color: colors.success, fontSize: fonts.lg, fontWeight: "800" },

  sheetTitle: {
    fontSize: fonts.md,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },

  sheetSub: { fontSize: fonts.sm, color: colors.textSecondary },

  pctLabel: {
    fontSize: fonts.md,
    fontWeight: "800",
    color: colors.teal,
    minWidth: 40,
    textAlign: "right",
  },

  // Progress bar

  progressTrack: {
    height: 6,
    borderRadius: 3,

    backgroundColor: colors.border,

    overflow: "hidden",

    marginBottom: spacing.lg,
  },

  progressFill: {
    height: "100%",

    backgroundColor: colors.teal,

    borderRadius: 3,

    overflow: "hidden",
  },

  shimmer: {
    position: "absolute",

    top: 0,
    bottom: 0,

    width: 80,

    backgroundColor: "rgba(255,255,255,0.22)",

    transform: [{ skewX: "-20deg" }],
  },

  // Step labels

  stepRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: spacing.lg,
  },

  stepLabel: { fontSize: fonts.xs, fontWeight: "600", letterSpacing: 0.3 },

  stepDash: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },

  // Countdown

  countdownText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,

    textAlign: "center",
    marginBottom: spacing.lg,
  },

  // Buttons

  installBtn: {
    backgroundColor: colors.teal,

    borderRadius: radius.xl,

    paddingVertical: spacing.lg,

    alignItems: "center",

    marginBottom: spacing.md,
  },

  installBtnText: { color: "#000", fontWeight: "800", fontSize: fonts.md },

  laterBtn: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },

  laterBtnText: {
    color: colors.textMuted,
    fontSize: fonts.sm,
    fontWeight: "600",
  },

  // Applying overlay

  applyingOverlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: colors.bg,

    alignItems: "center",
    justifyContent: "center",

    zIndex: 999,
  },

  applyingCard: { alignItems: "center", gap: spacing.lg },

  applyingIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,

    backgroundColor: colors.tealDim,

    borderWidth: 2,
    borderColor: colors.teal,

    alignItems: "center",
    justifyContent: "center",
  },

  applyingIconInner: {
    width: 28,
    height: 28,
    borderRadius: 14,

    borderWidth: 3,
    borderColor: colors.teal,

    borderTopColor: "transparent",
  },

  applyingTitle: { fontSize: fonts.xl, fontWeight: "800", color: colors.text },

  applyingSub: { fontSize: fonts.base, color: colors.textSecondary },

  applyingDots: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.teal },
})
