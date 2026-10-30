import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../lib/theme"
import { supabase } from "../lib/supabase"
import { useAuth } from "./_layout"

type Appointment = {
  id: string
  scheduled_at: string
  clinician_name: string | null
  status: "confirmed" | "pending" | "cancelled"
  notes: string | null
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: colors.success,
  pending: colors.amber,
  cancelled: colors.emergency,
}

const STATUS_BG: Record<string, string> = {
  confirmed: colors.successDim,
  pending: colors.amberDim,
  cancelled: colors.emergencyDim,
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  return { date, time }
}

export default function AppointmentsScreen() {
  const { session } = useAuth()
  const userId = session?.user?.id

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Request form state
  const [reqDate, setReqDate] = useState("")
  const [reqTime, setReqTime] = useState("")
  const [reqReason, setReqReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [dateFocused, setDateFocused] = useState(false)
  const [timeFocused, setTimeFocused] = useState(false)
  const [reasonFocused, setReasonFocused] = useState(false)

  const fetchAppointments = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from("appointments")
        .select("id, scheduled_at, clinician_name, status, notes")
        .eq("patient_id", userId)
        .order("scheduled_at", { ascending: true })
      setAppointments((data as Appointment[]) ?? [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  async function handleSubmitRequest() {
    if (!userId || !reqDate.trim()) return
    setSubmitting(true)
    try {
      // Combine date + time into an ISO string as best-effort
      const combined = reqTime.trim()
        ? `${reqDate.trim()} ${reqTime.trim()}`
        : reqDate.trim()
      const { error } = await supabase.from("appointments").insert({
        patient_id: userId,
        scheduled_at: new Date(combined).toISOString(),
        clinician_name: null,
        status: "pending",
        notes: reqReason.trim() || null,
      })
      if (error) throw error
      setShowModal(false)
      setReqDate("")
      setReqTime("")
      setReqReason("")
      await fetchAppointments()
    } catch {
      Alert.alert(
        "Error",
        "Could not submit appointment request. Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  function resetModal() {
    setShowModal(false)
    setReqDate("")
    setReqTime("")
    setReqReason("")
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Appointments</Text>
        <TouchableOpacity
          style={styles.requestBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.requestBtnText}>+ Request</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.teal}
          style={{ marginTop: spacing.xxxl }}
        />
      ) : appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <View style={styles.emptyCalCircle} />
            <View style={styles.emptyCalLine} />
            <View style={[styles.emptyCalLine, { width: 28, marginTop: 4 }]} />
          </View>
          <Text style={styles.emptyTitle}>No appointments scheduled</Text>
          <Text style={styles.emptyDesc}>
            {"Tap 'Request' to ask your clinician for a time."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {appointments.map((appt) => {
            const { date, time } = formatDateTime(appt.scheduled_at)
            const statusColor = STATUS_COLORS[appt.status] ?? colors.textMuted
            const statusBg = STATUS_BG[appt.status] ?? colors.bgCardAlt
            return (
              <View key={appt.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardDate}>{date}</Text>
                  <Text style={styles.cardTime}>{time}</Text>
                  {appt.clinician_name ? (
                    <Text style={styles.cardClinic}>{appt.clinician_name}</Text>
                  ) : null}
                  {appt.notes ? (
                    <Text style={styles.cardNote} numberOfLines={2}>
                      {appt.notes}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* Request appointment modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={resetModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Request appointment</Text>
              <Text style={styles.modalSub}>
                Your clinician will confirm a time.
              </Text>

              <Text style={styles.fieldLabel}>Preferred date</Text>
              <View
                style={[
                  styles.inputWrapper,
                  dateFocused && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15 Nov 2026"
                  placeholderTextColor={colors.textMuted}
                  value={reqDate}
                  onChangeText={setReqDate}
                  onFocus={() => setDateFocused(true)}
                  onBlur={() => setDateFocused(false)}
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.fieldLabel}>Preferred time</Text>
              <View
                style={[
                  styles.inputWrapper,
                  timeFocused && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10:00 AM"
                  placeholderTextColor={colors.textMuted}
                  value={reqTime}
                  onChangeText={setReqTime}
                  onFocus={() => setTimeFocused(true)}
                  onBlur={() => setTimeFocused(false)}
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.fieldLabel}>Reason for appointment</Text>
              <View
                style={[
                  styles.inputWrapper,
                  reasonFocused && styles.inputFocused,
                  { height: 80, alignItems: "flex-start", paddingVertical: spacing.md },
                ]}
              >
                <TextInput
                  style={[styles.input, { width: "100%" }]}
                  placeholder="Briefly describe the reason..."
                  placeholderTextColor={colors.textMuted}
                  value={reqReason}
                  onChangeText={setReqReason}
                  onFocus={() => setReasonFocused(true)}
                  onBlur={() => setReasonFocused(false)}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.btnSubmit,
                  (!reqDate.trim() || submitting) && styles.btnDisabled,
                ]}
                onPress={handleSubmitRequest}
                disabled={!reqDate.trim() || submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.btnSubmitText,
                      !reqDate.trim() && styles.btnDisabledText,
                    ]}
                  >
                    Submit request
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={resetModal}
                style={styles.cancelRow}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fonts.xl,
    fontWeight: "800",
    color: colors.text,
  },
  requestBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  requestBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.sm,
    letterSpacing: 0.3,
  },

  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardLeft: { flex: 1 },
  cardDate: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  cardTime: {
    fontSize: fonts.sm,
    color: colors.teal,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  cardClinic: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cardNote: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  statusText: { fontSize: fonts.sm, fontWeight: "700" },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  emptyCalCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  emptyCalLine: {
    width: 36,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  emptyTitle: {
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: fonts.xl,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSub: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  fieldLabel: {
    fontSize: fonts.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
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

  btnSubmit: {
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
  btnSubmitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },
  btnDisabledText: { color: colors.textMuted },

  cancelRow: { alignItems: "center", paddingVertical: spacing.sm },
  cancelText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: "600" },
})
