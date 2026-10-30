// Caregiver SOS alert screen — shown when an emergency contact taps the push notification.
// CR-SOS-05: first responder is broadcast to all other contacts via Realtime.
// CR-SOS-06: "I'm on my way" records response in sos_responses.

import { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, router } from "expo-router"
import { colors, fonts, radius, spacing } from "../lib/theme"
import { useAuth } from "./_layout"
import {
  respondToSos,
  getSosDetails,
  getSosResponders,
  supabase,
} from "../lib/supabase"

function timeSince(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins === 1) return "1 minute ago"
  if (mins < 60) return `${mins} minutes ago`
  const hrs = Math.floor(mins / 60)
  return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`
}

export default function SosAlertScreen() {
  const { session, profile } = useAuth()
  const {
    sosId,
    alertId,
    patientName: paramName,
    lat,
    lon,
  } = useLocalSearchParams<{
    sosId: string
    alertId?: string
    patientName: string
    lat: string
    lon: string
  }>()

  const [sosDetails, setSosDetails] = useState<{
    patient_name: string
    sent_at: string
    location: string | null
  } | null>(null)
  const [responders, setResponders] = useState<Array<{
    responder_id: string
    full_name: string
    responded_at: string
  }>>([])
  const [myResponse, setMyResponse] = useState(false)
  const [responding, setResponding] = useState(false)
  const [tick, setTick] = useState(0)
  const [nearestHospital, setNearestHospital] = useState<{
    name: string
    phone: string | null
  } | null>(null)

  const patientName = sosDetails?.patient_name ?? paramName ?? "Your contact"
  const sentAt = sosDetails?.sent_at

  // Re-render elapsed time every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!sosId) return
    getSosDetails(sosId).then(setSosDetails)
    getSosResponders(sosId).then((r) => {
      setResponders(r)
      if (session?.user)
        setMyResponse(r.some((x) => x.responder_id === session.user!.id))
    })
  }, [sosId, session])

  // Query nearest ER facility using the patient's location from the SOS event
  useEffect(() => {
    async function fetchHospital() {
      const latNum = parseFloat(lat ?? "")
      const lonNum = parseFloat(lon ?? "")
      if (isNaN(latNum) || isNaN(lonNum)) return
      try {
        const { data } = await supabase.rpc("nearest_er_facility", {
          lat: latNum,
          lon: lonNum,
        })
        const row = data as { name: string; phone: string | null } | null
        if (row?.name) setNearestHospital({ name: row.name, phone: row.phone ?? null })
      } catch {}
    }
    fetchHospital()
  }, [lat, lon])

  // Realtime — update responder list as others respond
  useEffect(() => {
    if (!sosId) return
    const channel = supabase
      .channel(`sos-responses:${sosId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sos_responses",
          filter: `sos_event_id=eq.${sosId}`,
        },
        () => {
          getSosResponders(sosId).then((r) => {
            setResponders(r)
            if (session?.user)
              setMyResponse(r.some((x) => x.responder_id === session.user!.id))
          })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [sosId, session])

  async function handleRespond() {
    if (!session?.user || !sosId || responding || myResponse) return
    setResponding(true)
    try {
      await respondToSos(sosId, session.user.id, "I'm on my way")
      // Immediately stop escalation-tick from dispatching ambulance
      if (alertId) {
        await supabase
          .from("alerts")
          .update({ state: "responded" })
          .eq("id", alertId)
      }
      setMyResponse(true)
    } catch {
      // ignore — Realtime will update anyway
    } finally {
      setResponding(false)
    }
  }

  function openDirections() {
    const latVal =
      lat ||
      (sosDetails?.location ? tryParseLocation(sosDetails.location)?.lat : null)
    const lonVal =
      lon ||
      (sosDetails?.location ? tryParseLocation(sosDetails.location)?.lon : null)
    if (latVal && lonVal) {
      // daddr opens turn-by-turn navigation from current location
      Linking.openURL(`https://maps.google.com/maps?daddr=${latVal},${lonVal}`)
    }
  }

  const hasLocation =
    !!(lat && lon) ||
    !!(sosDetails?.location && tryParseLocation(sosDetails.location))

  const firstResponder = responders[0]
  const otherResponders = responders.slice(1)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.sosTag}>
            <View style={styles.sosDot} />
            <Text style={styles.sosTagText}>SOS ALERT</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Patient card */}
        <View style={styles.patientCard}>
          <View style={styles.avatarRed}>
            <Text style={styles.avatarText}>
              {patientName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientSub}>
              {sentAt ? timeSince(sentAt) : "Just now"} · needs immediate help
            </Text>
          </View>
        </View>

        {/* Location */}
        {hasLocation ? (
          <TouchableOpacity
            style={styles.locationCard}
            onPress={openDirections}
            activeOpacity={0.85}
          >
            <View style={styles.locationIcon}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.emergency,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationTitle}>Location shared</Text>
              <Text style={styles.locationSub}>Tap for turn-by-turn directions</Text>
            </View>
            <View style={[styles.chip, { borderColor: colors.emergency }]}>
              <Text style={[styles.chipText, { color: colors.emergency }]}>
                Get Directions
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.textMuted,
                }}
              />
            </View>
            <Text style={styles.locationTitle}>No location available</Text>
          </View>
        )}

        {/* Nearest hospital */}
        <View style={styles.hospitalCard}>
          <View style={styles.hospitalIconWrap}>
            <View style={styles.hospitalIconDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hospitalLabel}>Nearest hospital</Text>
            <Text style={styles.hospitalName}>
              {nearestHospital?.name ?? "Kenyatta National Hospital"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.callHospBtn}
            onPress={() =>
              Linking.openURL(
                nearestHospital?.phone
                  ? `tel:${nearestHospital.phone}`
                  : "tel:+254202726300",
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Call nearest hospital"
          >
            <Text style={styles.callHospBtnText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* First responder badge */}
        {firstResponder && (
          <View style={styles.responderBanner}>
            <View style={styles.responderBannerDot} />
            <Text style={styles.responderBannerText}>
              <Text style={{ fontWeight: "800" }}>
                {firstResponder.full_name}
              </Text>{" "}
              is on their way · {timeSince(firstResponder.responded_at)}
            </Text>
          </View>
        )}

        {/* Other responders */}
        {otherResponders.length > 0 && (
          <View style={styles.otherResponders}>
            {otherResponders.map((r) => (
              <Text key={r.responder_id} style={styles.otherResponderText}>
                {r.full_name} also responded
              </Text>
            ))}
          </View>
        )}

        {/* My response */}
        <View style={styles.actionBlock}>
          {myResponse ? (
            <View style={styles.respondedBadge}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.success,
                  marginRight: spacing.sm,
                }}
              />
              <Text style={styles.respondedText}>
                You responded — {profile?.full_name ?? "You"} is on the way
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.respondBtn, responding && { opacity: 0.6 }]}
              onPress={handleRespond}
              disabled={responding}
              accessibilityRole="button"
            >
              {responding ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.respondBtnText}>I'm on my way</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.callEmergencyBtn}
            onPress={() => Linking.openURL("tel:999")}
            accessibilityRole="button"
            accessibilityLabel="Call 999 or 112 for emergency services"
          >
            <Text style={styles.callEmergencyText}>
              Call 999 / 112 — Ambulance
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Your response is shown to {patientName} and all their emergency
          contacts immediately.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function tryParseLocation(
  raw: string | null,
): { lat: number; lon: number } | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    if (p?.lat && p?.lon) return p
  } catch {}
  return null
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0D0505" },
  container: { padding: spacing.xl, paddingBottom: 40 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  sosTag: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  sosDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emergency,
  },
  sosTagText: {
    fontSize: fonts.sm,
    fontWeight: "800",
    color: colors.emergency,
    letterSpacing: 2,
  },
  closeText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.emergency,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatarRed: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3a0808",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.emergency,
  },
  avatarText: {
    color: colors.emergency,
    fontWeight: "800",
    fontSize: fonts.xl,
  },
  patientName: {
    fontSize: fonts.xl,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  patientSub: { fontSize: fonts.sm, color: colors.textSecondary },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2a0808",
    alignItems: "center",
    justifyContent: "center",
  },
  locationTitle: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
  },
  locationSub: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  chipText: { fontSize: fonts.sm, fontWeight: "700" },

  responderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  responderBannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    flexShrink: 0,
  },
  responderBannerText: {
    fontSize: fonts.base,
    color: colors.success,
    flex: 1,
    lineHeight: 20,
  },

  otherResponders: { marginBottom: spacing.lg },
  otherResponderText: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    paddingVertical: 2,
    paddingLeft: spacing.md,
  },

  actionBlock: { gap: spacing.md, marginTop: spacing.md },

  respondBtn: {
    backgroundColor: colors.emergency,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  respondBtnText: { color: "#fff", fontWeight: "800", fontSize: fonts.lg },

  respondedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successDim,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.lg,
    justifyContent: "center",
  },
  respondedText: {
    fontSize: fonts.base,
    color: colors.success,
    fontWeight: "700",
  },

  callEmergencyBtn: {
    backgroundColor: "#3a0808",
    borderWidth: 1.5,
    borderColor: colors.emergency,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  callEmergencyText: {
    fontSize: fonts.base,
    color: colors.emergency,
    fontWeight: "800",
  },

  hospitalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  hospitalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a0808",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  hospitalIconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.emergency,
    opacity: 0.7,
  },
  hospitalLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  hospitalName: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
  },
  callHospBtn: {
    backgroundColor: colors.emergency,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexShrink: 0,
  },
  callHospBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.sm,
  },

  disclaimer: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    marginTop: spacing.xl,
  },
})
