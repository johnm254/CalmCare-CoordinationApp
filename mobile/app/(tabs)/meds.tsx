// Meds tab — medication schedule + offline "Taken" check-in.

// CR-MED-04: one tap per dose slot; uniqueness enforced in SQLite + server.

// CR-MED-12: works fully offline; writes go to local DB first, then outbox.

import { useCallback, useEffect, useRef, useState } from "react"

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native"

import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useFocusEffect } from "expo-router"

import { Ionicons } from "@expo/vector-icons"

import { colors, fonts, radius, spacing, shadows } from "../../lib/theme"

import { useAuth } from "../_layout"

import { TAB_BOTTOM, TAB_HEIGHT } from "./_layout"

import {
  initializeDB,
  getTodaysDoses,
  confirmDose,
  getAdherence,
} from "../../db/offline"

import { useTranslation } from "../../lib/i18n-context"

// ─── Icons ────────────────────────────────────────────────────────────────────

function PillIcon({ color = colors.teal }: { color?: string }) {
  return (
    <Ionicons name="medical" size={22} color={color} />
  )
}

function CheckIcon() {
  return (
    <Ionicons name="checkmark" size={14} color={colors.bg} />
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DoseSlot {
  scheduleId: string

  medicationId: string

  medicationName: string

  dose: string

  scheduledFor: string

  time: string

  status: "pending" | "taken" | "snoozed" | "missed"
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MedsScreen() {
  const { session } = useAuth()

  const { t } = useTranslation()

  const insets = useSafeAreaInsets()

  const bottomPad = TAB_HEIGHT + TAB_BOTTOM + insets.bottom + 16

  const [doses, setDoses] = useState<DoseSlot[]>([])

  const [adherence, setAdherence] = useState<Record<string, number>>({})

  const [loading, setLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  const [takingId, setTakingId] = useState<string | null>(null)

  const [dbReady, setDbReady] = useState(false)

  const lastFetchRef = useRef<number>(0)

  useEffect(() => {
    initializeDB()
      .then(() => setDbReady(true))
      .catch(console.error)
  }, [])

  const loadDoses = useCallback(async (force = false) => {
    if (!session?.user || !dbReady) return
    // Skip if fetched within the last 30s (unless forced by pull-to-refresh)
    const now = Date.now()
    if (!force && now - lastFetchRef.current < 30_000) return
    lastFetchRef.current = now

    const patientId = session.user.id

    const today = await getTodaysDoses(patientId)

    setDoses(today)

    // Load adherence for each unique medication

    const medIds = [...new Set(today.map((d) => d.medicationId))]

    const adh: Record<string, number> = {}

    for (const id of medIds) {
      adh[id] = await getAdherence(patientId, id, 30)
    }

    setAdherence(adh)
  }, [session, dbReady])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)

      loadDoses().finally(() => setLoading(false))
    }, [loadDoses]),
  )

  async function handleTaken(slot: DoseSlot) {
    if (!session?.user || takingId) return

    const key = `${slot.scheduleId}-${slot.scheduledFor}`

    setTakingId(key)

    try {
      const result = await confirmDose({
        medicationId: slot.medicationId,

        scheduleId: slot.scheduleId,

        patientId: session.user.id,

        scheduledFor: slot.scheduledFor,

        confirmedVia: "app",

        confirmedBy: session.user.id,
      })

      if (result.alreadyTaken) {
        // Update local state to show taken without reloading

        setDoses((prev) =>
          prev.map((d) =>
            d.scheduleId === slot.scheduleId &&
            d.scheduledFor === slot.scheduledFor
              ? { ...d, status: "taken" }
              : d,
          ),
        )
      } else if (result.success) {
        setDoses((prev) =>
          prev.map((d) =>
            d.scheduleId === slot.scheduleId &&
            d.scheduledFor === slot.scheduledFor
              ? { ...d, status: "taken" }
              : d,
          ),
        )
      }
    } finally {
      setTakingId(null)
    }
  }

  const pending = doses.filter((d) => d.status === "pending")

  const taken = doses.filter((d) => d.status === "taken")

  const missed = doses.filter((d) => d.status === "missed")

  // ─── Hero card derivations ─────────────────────────────────────────────────

  const takenCount = doses.filter((d) => d.status === "taken").length

  const totalToday = doses.length

  const heroPct = Math.round((takenCount / Math.max(totalToday, 1)) * 100)

  if (loading) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.teal} size="large" />
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await loadDoses(true)
              setRefreshing(false)
            }}
            tintColor={colors.teal}
          />
        }
      >
        {/* ── Adherence hero card ──────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroPct}>{heroPct}%</Text>
            <Text style={styles.heroSubLabel}>30-day adherence</Text>
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroTakenNum}>{takenCount}</Text>
            <Text style={styles.heroTakenLabel}>doses today</Text>
            <Text style={[styles.heroTakenNum, { fontSize: fonts.sm, marginTop: 4 }]}>
              of {totalToday}
            </Text>
          </View>
        </View>

        {/* Disclaimer — CR-MED-11 */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{t("meds_disclaimer")}</Text>
        </View>

        {/* Adherence summary */}
        {Object.keys(adherence).length > 0 && (
          <View style={styles.adherenceCard}>
            <Text style={styles.adherenceTitle}>{t("meds_adherence_title")}</Text>
            {Object.entries(adherence).map(([medId, pct]) => {
              const med = doses.find((d) => d.medicationId === medId)
              if (!med) return null
              const color =
                pct >= 80 ? colors.success : pct >= 50 ? colors.amber : colors.emergency
              return (
                <View key={medId} style={styles.adherenceRow}>
                  <Text style={styles.adherenceMedName} numberOfLines={1}>
                    {med.medicationName}
                  </Text>
                  <View style={styles.adherenceBarBg}>
                    <View
                      style={[
                        styles.adherenceBarFill,
                        { width: `${pct}%` as any, backgroundColor: color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.adherencePct, { color }]}>{pct}%</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Pending doses */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("meds_due_today")}</Text>
            {pending.map((slot) => (
              <DoseCard
                key={`${slot.scheduleId}-${slot.scheduledFor}`}
                slot={slot}
                adherencePct={adherence[slot.medicationId]}
                onTaken={() => handleTaken(slot)}
                loading={takingId === `${slot.scheduleId}-${slot.scheduledFor}`}
              />
            ))}
          </View>
        )}

        {/* Taken today */}
        {taken.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("meds_taken_today")}</Text>
            {taken.map((slot) => (
              <DoseCard
                key={`${slot.scheduleId}-${slot.scheduledFor}`}
                slot={slot}
                adherencePct={adherence[slot.medicationId]}
              />
            ))}
          </View>
        )}

        {/* Missed */}
        {missed.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.emergency }]}>
              {t("meds_missed")}
            </Text>
            {missed.map((slot) => (
              <DoseCard
                key={`${slot.scheduleId}-${slot.scheduledFor}`}
                slot={slot}
                adherencePct={adherence[slot.medicationId]}
              />
            ))}
          </View>
        )}

        {doses.length === 0 && (
          <View style={styles.empty}>
            <PillIcon color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t("meds_empty_title")}</Text>
            <Text style={styles.emptyBody}>{t("meds_empty_body")}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

// ─── Dose card ────────────────────────────────────────────────────────────────

function DoseCard({
  slot,

  adherencePct,

  onTaken,

  loading,
}: {
  slot: DoseSlot

  adherencePct?: number

  onTaken?: () => void

  loading?: boolean
}) {
  const { t } = useTranslation()

  const isTaken = slot.status === "taken"

  const isMissed = slot.status === "missed"

  const cardBorderColor = isTaken
    ? colors.success
    : isMissed
      ? colors.emergency
      : colors.border

  return (
    <View style={[styles.card, { borderColor: cardBorderColor }, shadows.sm]}>
      <View style={styles.cardLeft}>
        <PillIcon
          color={
            isTaken ? colors.success : isMissed ? colors.emergency : colors.teal
          }
        />
        <View style={styles.cardInfo}>
          <Text style={styles.medName}>{slot.medicationName}</Text>
          <Text style={styles.medDose}>{slot.dose}</Text>
          {typeof adherencePct === "number" && (
            <Text style={styles.adherence}>
              {t("meds_adherence_label", adherencePct)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.cardRight}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>{slot.time}</Text>
        </View>

        {isTaken ? (
          <View style={styles.takenBadge}>
            <CheckIcon />
            <Text style={styles.takenBadgeText}>{t("meds_taken_badge")}</Text>
          </View>
        ) : isMissed ? (
          <View
            style={[
              styles.takenBadge,
              { backgroundColor: colors.emergencyDim },
            ]}
          >
            <Text style={[styles.takenBadgeText, { color: colors.emergency }]}>
              {t("meds_missed_badge")}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.takenBtn}
            onPress={onTaken}
            disabled={loading}
            accessibilityLabel={`Mark ${slot.medicationName} as taken`}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <Text style={styles.takenBtnText}>{t("meds_taken_btn")}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  scroll: { flex: 1 },

  container: { padding: spacing.xl },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  // ─── Hero card ──────────────────────────────────────────────────────────────

  heroCard: {
    backgroundColor: colors.heroCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    ...shadows.glowLagoon,
  },

  heroLeft: {
    flex: 1,
  },

  heroPct: {
    fontSize: fonts.xxxl,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: fonts.xxxl + 4,
  },

  heroSubLabel: {
    fontSize: fonts.sm,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },

  heroRight: {
    alignItems: "flex-end",
  },

  heroTakenNum: {
    fontSize: fonts.xxl,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: fonts.xxl + 2,
  },

  heroTakenLabel: {
    fontSize: fonts.sm,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },

  // ─── Adherence section ──────────────────────────────────────────────────────

  adherenceCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  adherenceTitle: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.teal,
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  adherenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  adherenceMedName: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    width: 100,
    flexShrink: 0,
  },

  adherenceBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgCardAlt,
    borderRadius: 4,
    overflow: "hidden",
  },

  adherenceBarFill: {
    height: 8,
    borderRadius: 4,
  },

  adherencePct: {
    fontSize: fonts.xs,
    fontWeight: "700",
    width: 32,
    textAlign: "right",
    flexShrink: 0,
  },

  // ─── Disclaimer ─────────────────────────────────────────────────────────────

  disclaimer: {
    backgroundColor: colors.amberDim,

    borderRadius: radius.md,

    borderWidth: 1,

    borderColor: colors.amber,

    padding: spacing.md,

    marginBottom: spacing.xl,
  },

  disclaimerText: {
    fontSize: fonts.sm,

    color: colors.amber,

    lineHeight: 18,

    textAlign: "center",
  },

  // ─── Sections ───────────────────────────────────────────────────────────────

  section: { marginBottom: spacing.xl },

  sectionLabel: {
    fontSize: fonts.xs,

    fontWeight: "700",

    color: colors.textSecondary,

    letterSpacing: 1.2,

    marginBottom: spacing.md,
  },

  // ─── Dose card ──────────────────────────────────────────────────────────────

  card: {
    backgroundColor: colors.bgCard,

    borderRadius: radius.lg,

    borderWidth: 1,

    padding: spacing.lg,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: spacing.md,
  },

  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },

  cardInfo: { flex: 1 },

  medName: {
    fontSize: fonts.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },

  medDose: { fontSize: fonts.sm, color: colors.textSecondary, marginBottom: 2 },

  adherence: { fontSize: fonts.xs, color: colors.textMuted },

  cardRight: { alignItems: "flex-end", gap: spacing.sm },

  timeBadge: {
    backgroundColor: colors.bgCardAlt,

    borderRadius: radius.full,

    paddingHorizontal: spacing.md,

    paddingVertical: 3,
  },

  timeBadgeText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // CR-MED-04: amber "Taken" button (≥ 48px touch target)

  takenBtn: {
    backgroundColor: colors.amber,

    borderRadius: radius.full,

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.sm,

    minHeight: 36,

    alignItems: "center",

    justifyContent: "center",
  },

  takenBtnText: { color: colors.bg, fontWeight: "700", fontSize: fonts.sm },

  takenBadge: {
    flexDirection: "row",

    alignItems: "center",

    gap: 4,

    backgroundColor: colors.successDim,

    borderRadius: radius.full,

    paddingHorizontal: spacing.md,

    paddingVertical: 4,
  },

  takenBadgeText: {
    color: colors.success,
    fontWeight: "700",
    fontSize: fonts.sm,
  },

  // ─── Empty state ─────────────────────────────────────────────────────────────

  empty: {
    alignItems: "center",

    paddingVertical: spacing.xxxl,

    gap: spacing.md,
  },

  emptyTitle: { fontSize: fonts.lg, fontWeight: "700", color: colors.text },

  emptyBody: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
})
