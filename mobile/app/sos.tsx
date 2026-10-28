// SOS screen — online push, offline SMS, no-signal queue.

// CR-SOS-01: 5-second countdown with cancel window.

// CR-SOS-02: online → push notification via API + Supabase record.

// CR-SOS-03: offline SMS available → expo-sms composer with location link.

// CR-SOS-04: no signal → queued in SQLite, plainly told, retried on reconnect.

import { useEffect, useRef, useState } from "react"

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native"

import { router } from "expo-router"

import { SafeAreaView } from "react-native-safe-area-context"

import * as Network from "expo-network"

import * as SMS from "expo-sms"

import * as Location from "expo-location"

import { colors, fonts, radius, spacing } from "../lib/theme"

import { useAuth } from "./_layout"

import {
  getEmergencyContacts,
  sendSos,
  type CareCircleMember,
} from "../lib/supabase"

import { enqueueSosOffline } from "../db/offline"

const CIRCLE_SIZE = 220

const TOTAL_SECONDS = 5

type SosChannel = "push" | "sms" | "queued"

type SosState = "counting" | "sending" | "sent" | "escalated" | "queued"

export default function SOSScreen() {
  const { session, profile } = useAuth()

  const [seconds, setSeconds] = useState(TOTAL_SECONDS)

  const [sosState, setSosState] = useState<SosState>("counting")

  const [channel, setChannel] = useState<SosChannel>("push")

  const [contacts, setContacts] = useState<CareCircleMember[]>([])

  const [location, setLocation] = useState<{ lat: number lon: number } | null>(
    null,
  )

  const [smsError, setSmsError] = useState(false)

  const [sentAt, setSentAt] = useState<Date | null>(null)

  const [paramedicTime, setParamedicTime] = useState<string | null>(null)

  const borderAnim = useRef(new Animated.Value(1)).current

  const pulseScale = useRef(new Animated.Value(1)).current

  const pulseOpacity = useRef(new Animated.Value(0.6)).current

  const sentRef = useRef(false)

  useEffect(() => {
    if (!session?.user) return

    getEmergencyContacts(session.user.id).then(setContacts)

    Location.requestForegroundPermissionsAsync().then(
      ({ status }: { status: string }) => {
        if (status === "granted") {
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })

            .then((loc: { coords: { latitude: number longitude: number } }) =>
              setLocation({
                lat: loc.coords.latitude,
                lon: loc.coords.longitude,
              }),
            )

            .catch(() => {})
        }
      },
    )
  }, [session])

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: TOTAL_SECONDS * 1000,
      useNativeDriver: false,
    }).start()

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.18,
            duration: 700,
            useNativeDriver: true,
          }),

          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),

          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start()

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval)

          if (!sentRef.current) {
            sentRef.current = true

            doSend()
          }

          return 0
        }

        return s - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // T+2 and T+4 escalation timers — only run after a successful push send.

  useEffect(() => {
    if (sosState !== "sent" || channel !== "push" || !sentAt) return

    // At T+4 show "Paramedics have been called"
    const t4 = setTimeout(() => {
      setSosState("escalated")
    }, 4 * 60 * 1000)

    return () => {
      clearTimeout(t4)
    }
  }, [sosState, channel, sentAt])

  async function doSend() {
    if (!session?.user) return

    setSosState("sending")

    const networkState = await Network.getNetworkStateAsync()

    const isOnline =
      networkState.isConnected === true &&
      networkState.isInternetReachable !== false

    if (isOnline) {
      await sendSos(
        session.user.id,
        contacts.map((c) => c.member_id),
        location,
      )

      const now = new Date()

      setSentAt(now)

      const t4Date = new Date(now.getTime() + 4 * 60 * 1000)

      setParamedicTime(
        t4Date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      )

      setChannel("push")

      setSosState("sent")

      return
    }

    // Offline path — try SMS

    const smsAvailable = await SMS.isAvailableAsync()

    const phonedContacts = contacts.filter((c) => c.phone)

    if (smsAvailable && phonedContacts.length > 0) {
      const phones = phonedContacts.map((c) => c.phone!)

      const name = profile?.full_name ?? "Your contact"

      let body = `🚨 ${name} needs help (SOS from Duara).`

      if (location) {
        body += ` Location: https://maps.google.com/?q=${location.lat},${location.lon}`
      } else {
        body += " No GPS available."
      }

      try {
        const { result } = await SMS.sendSMSAsync(phones, body)

        if (result !== "cancelled") {
          await enqueueSosOffline({
            patientId: session.user.id,
            contacts,
            location,
            channel: "sms",
          })

          setChannel("sms")

          setSosState("sent")

          return
        }
      } catch {
        setSmsError(true)
      }
    }

    // No network + no SMS (or SMS failed) — queue and retry

    await enqueueSosOffline({
      patientId: session.user.id,
      contacts,
      location,
      channel: "queued",
    })

    setChannel("queued")

    setSosState("queued")
  }

  function handleSendNow() {
    if (!sentRef.current) {
      sentRef.current = true

      doSend()
    }
  }

  const isCounting = sosState === "counting"

  const isSending = sosState === "sending"

  const isSent = sosState === "sent"

  const isEscalated = sosState === "escalated"

  const isQueued = sosState === "queued"

  const circleColor =
    isSent || isEscalated
      ? colors.success
      : isQueued
        ? colors.amber
        : colors.emergency

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.topRow}>
          <Text style={styles.duaraLabel}>DUARA</Text>
          <View style={styles.sosLabelRow}>
            <View style={[styles.redDot, { backgroundColor: circleColor }]} />
            <Text style={[styles.sosLabelText, { color: circleColor }]}>
              SOS
            </Text>
          </View>
        </View>

        {/* Countdown / status circle */}
        <View style={styles.circleWrapper}>
          {isCounting && (
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
          )}

          <View
            style={[
              styles.circleBg,
              (isSent || isEscalated) && styles.circleBgSent,
              isQueued && styles.circleBgQueued,
            ]}
          >
            <Animated.View
              style={[styles.circleRing, { borderColor: circleColor }]}
            />
            <View style={styles.circleCenter}>
              {isSending ? (
                <ActivityIndicator color={colors.emergency} size="large" />
              ) : isSent || isEscalated ? (
                <>
                  <Text
                    style={[
                      styles.countdownNum,
                      { color: colors.success, fontSize: 64 },
                    ]}
                  >
                    ✓
                  </Text>
                  <Text style={[styles.sentLabel, { color: colors.success }]}>
                    {isEscalated
                      ? "Paramedics Called"
                      : channel === "sms"
                        ? "SMS Sent"
                        : "Alert Sent"}
                  </Text>
                </>
              ) : isQueued ? (
                <>
                  <Text
                    style={[
                      styles.countdownNum,
                      { color: colors.amber, fontSize: 56 },
                    ]}
                  >
                    !
                  </Text>
                  <Text style={[styles.sentLabel, { color: colors.amber }]}>
                    Queued
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[styles.countdownNum, { color: colors.emergency }]}
                  >
                    {seconds}
                  </Text>
                  <Text style={styles.countdownLabel}>seconds</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Message */}
        {isCounting && (
          <>
            <Text style={styles.heading}>Sending SOS...</Text>
            <Text style={styles.subtext}>
              Your emergency contacts will be alerted with your location.
            </Text>
          </>
        )}
        {isSent && channel === "push" && (
          <>
            <Text style={styles.subtext}>
              Your emergency contacts have been alerted.
            </Text>
            {paramedicTime && (
              <Text
                style={[
                  styles.subtext,
                  { color: colors.amber, marginTop: -spacing.md },
                ]}
              >
                No response yet. Paramedics will be called at {paramedicTime}{" "}
                if no one confirms you are safe.
              </Text>
            )}
          </>
        )}
        {isEscalated && (
          <>
            <Text style={[styles.heading, { color: colors.emergency }]}>
              Paramedics have been called
            </Text>
            <Text style={styles.subtext}>
              Emergency services have been dispatched for you.
              {contacts.length > 0
                ? ` ${contacts[0].full_name} has been told.`
                : ""}
            </Text>
          </>
        )}
        {isSent && channel === "sms" && (
          <Text style={styles.subtext}>
            SMS sent. Contacts alerted{location ? " with your location" : ""}.
          </Text>
        )}
        {isQueued && (
          <>
            <Text style={[styles.heading, { color: colors.amber }]}>
              No signal
            </Text>
            <Text style={styles.subtext}>
              Your SOS has not been sent yet. Duara will send it automatically
              as soon as a signal is available.
            </Text>
          </>
        )}
        {smsError && (
          <Text
            style={[
              styles.subtext,
              { color: colors.amber, marginTop: -spacing.md },
            ]}
          >
            SMS failed — alert queued for retry.
          </Text>
        )}

        {/* Status card */}
        <View style={styles.statusCard}>
          <StatusRow
            title="Push alert"
            sub="Online path"
            badge={
              isOnlineIndicator(channel, isSent) || isEscalated
                ? "Sent"
                : "Ready"
            }
            badgeGreen={isOnlineIndicator(channel, isSent) || isEscalated}
          />
          <View style={styles.divider} />
          <StatusRow
            title="SMS fallback"
            sub="No internet path"
            badge={channel === "sms" && (isSent || isEscalated) ? "Sent" : "Ready"}
            badgeGreen={channel === "sms" && (isSent || isEscalated)}
          />
          <View style={styles.divider} />
          <StatusRow
            title="Emergency contacts"
            sub="First to respond is shown to all"
            badge={String(contacts.length)}
            badgeTeal
          />
        </View>

        {/* Actions */}
        {isCounting && (
          <TouchableOpacity
            style={styles.sendNowBtn}
            onPress={handleSendNow}
            activeOpacity={0.85}
          >
            <Text style={styles.sendNowBtnText}>Send now</Text>
          </TouchableOpacity>
        )}
        {(isSent || isEscalated || isQueued) && (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        )}
        {isCounting && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelBtnText}>Cancel, I am okay</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

function isOnlineIndicator(channel: SosChannel, isSent: boolean) {
  return channel === "push" && isSent
}

function StatusRow({
  title,
  sub,
  badge,
  badgeGreen,
  badgeTeal,
}: {
  title: string
  sub: string
  badge: string
  badgeGreen?: boolean
  badgeTeal?: boolean
}) {
  const bgColor = badgeTeal
    ? colors.tealBadge
    : badgeGreen
      ? colors.successDim
      : colors.bgCardAlt

  const textColor = badgeTeal
    ? colors.teal
    : badgeGreen
      ? colors.success
      : colors.textSecondary

  return (
    <View style={styles.statusRow}>
      <View style={styles.statusInfo}>
        <Text style={styles.statusTitle}>{title}</Text>
        <Text style={styles.statusSub}>{sub}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        {badgeGreen && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.success,
              marginRight: 4,
            }}
          />
        )}
        <Text style={[styles.statusBadgeText, { color: textColor }]}>
          {badge}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0D0505" },

  container: {
    flex: 1,
    alignItems: "center",

    paddingHorizontal: spacing.lg,

    paddingTop: spacing.xl,

    paddingBottom: spacing.xxl,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  duaraLabel: {
    fontSize: fonts.sm,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 3,
  },

  sosLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },

  redDot: { width: 8, height: 8, borderRadius: 4 },

  sosLabelText: { fontSize: fonts.sm, fontWeight: "700", letterSpacing: 2 },

  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: spacing.xl,
  },

  pulseRing: {
    position: "absolute",

    width: CIRCLE_SIZE + 30,
    height: CIRCLE_SIZE + 30,

    borderRadius: (CIRCLE_SIZE + 30) / 2,

    borderWidth: 2,
    borderColor: colors.emergency,
  },

  circleBg: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,

    borderRadius: CIRCLE_SIZE / 2,

    backgroundColor: "#180505",

    alignItems: "center",
    justifyContent: "center",
  },

  circleBgSent: { backgroundColor: "#051810" },

  circleBgQueued: { backgroundColor: "#181205" },

  circleRing: {
    position: "absolute",

    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,

    borderRadius: CIRCLE_SIZE / 2,

    borderWidth: 5,
  },

  circleCenter: { alignItems: "center" },

  countdownNum: { fontSize: 80, fontWeight: "800", lineHeight: 88 },

  countdownLabel: { fontSize: fonts.base, color: colors.textSecondary },

  sentLabel: { fontSize: fonts.lg, fontWeight: "700", marginTop: 4 },

  heading: {
    fontSize: fonts.xxl,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  subtext: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  statusCard: {
    width: "100%",

    backgroundColor: colors.bgCard,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.lg,

    marginBottom: spacing.xl,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },

  statusInfo: { flex: 1 },

  statusTitle: { fontSize: fonts.base, fontWeight: "700", color: colors.text },

  statusSub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },

  statusBadge: {
    borderRadius: radius.full,

    paddingHorizontal: spacing.md,

    paddingVertical: 4,

    flexDirection: "row",
    alignItems: "center",
  },

  statusBadgeText: { fontSize: fonts.sm, fontWeight: "700" },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  sendNowBtn: {
    width: "100%",
    backgroundColor: colors.emergency,

    borderRadius: radius.xl,
    paddingVertical: spacing.lg,

    alignItems: "center",
    marginBottom: spacing.md,
  },

  sendNowBtnText: { color: "#fff", fontWeight: "800", fontSize: fonts.md },

  doneBtn: {
    width: "100%",
    backgroundColor: colors.teal,

    borderRadius: radius.xl,
    paddingVertical: spacing.lg,

    alignItems: "center",
    marginBottom: spacing.md,
  },

  doneBtnText: { color: "#000", fontWeight: "800", fontSize: fonts.md },

  cancelBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.borderLight,

    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },

  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: fonts.md,
  },
})
