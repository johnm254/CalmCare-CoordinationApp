import { useState } from "react"
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
  Alert,
} from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../lib/theme"
import { supabase } from "../lib/supabase"
import { useAuth } from "./_layout"

const SEIZURE_TYPES = [
  "Tonic-clonic",
  "Absence",
  "Focal",
  "Myoclonic",
  "Unknown",
]

export default function CircleObservationScreen() {
  const { session } = useAuth()
  const { patientId } = useLocalSearchParams<{ patientId: string }>()

  const [duration, setDuration] = useState("")
  const [seizureType, setSeizureType] = useState<string | null>(null)
  const [postictal, setPostictal] = useState<boolean | null>(null)
  const [notes, setNotes] = useState("")
  const [notesFocused, setNotesFocused] = useState(false)
  const [durationFocused, setDurationFocused] = useState(false)
  const [saving, setSaving] = useState(false)

  const canSave = seizureType !== null && postictal !== null

  async function handleSave() {
    if (!canSave || !session?.user || !patientId) return
    setSaving(true)
    try {
      const { error } = await supabase.from("caregiver_observations").insert({
        patient_id: patientId,
        caregiver_id: session.user.id,
        observed_at: new Date().toISOString(),
        duration_sec: duration.trim() ? parseInt(duration.trim(), 10) : null,
        seizure_type: seizureType,
        postictal: postictal,
        notes: notes.trim() || null,
      })
      if (error) throw error
      Alert.alert("Saved", "Observation recorded successfully.", [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch {
      Alert.alert(
        "Error",
        "Could not save observation. Please try again.",
      )
    } finally {
      setSaving(false)
    }
  }

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
          <Text style={styles.heading}>Record observation</Text>
          <Text style={styles.subheading}>
            Log what you observed during the seizure episode.
          </Text>

          {/* Duration */}
          <Text style={styles.fieldLabel}>Duration (seconds)</Text>
          <View
            style={[styles.inputWrapper, durationFocused && styles.inputFocused]}
          >
            <TextInput
              style={styles.input}
              placeholder="e.g. 45"
              placeholderTextColor={colors.textMuted}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              returnKeyType="done"
              onFocus={() => setDurationFocused(true)}
              onBlur={() => setDurationFocused(false)}
            />
          </View>

          {/* Seizure type */}
          <Text style={styles.fieldLabel}>Seizure type</Text>
          <View style={styles.chipGrid}>
            {SEIZURE_TYPES.map((type) => {
              const active = seizureType === type
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSeizureType(type)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Postictal */}
          <Text style={styles.fieldLabel}>Postictal phase observed?</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                postictal === true && styles.toggleBtnActive,
              ]}
              onPress={() => setPostictal(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  postictal === true && styles.toggleBtnTextActive,
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                postictal === false && styles.toggleBtnActive,
              ]}
              onPress={() => setPostictal(false)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  postictal === false && styles.toggleBtnTextActive,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <View
            style={[
              styles.notesWrapper,
              notesFocused && styles.inputFocused,
            ]}
          >
            <TextInput
              style={styles.notesInput}
              placeholder="Describe what you observed..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={(t) => setNotes(t.slice(0, 500))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setNotesFocused(true)}
              onBlur={() => setNotesFocused(false)}
            />
            <Text style={styles.charCount}>{notes.length}/500</Text>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.btnSave,
              (!canSave || saving) && styles.btnDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  styles.btnSaveText,
                  !canSave && styles.btnDisabledText,
                ]}
              >
                Save observation
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.cancelRow}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xxl,
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
    marginBottom: spacing.xl,
  },
  inputFocused: {
    borderColor: colors.teal,
    backgroundColor: "rgba(139,92,246,0.05)",
  },
  input: { color: colors.text, fontSize: fonts.base },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.tealDim,
    borderColor: colors.teal,
  },
  chipText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  chipTextActive: { color: colors.teal, fontWeight: "700" },

  toggleRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: colors.tealDim,
    borderColor: colors.teal,
  },
  toggleBtnText: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  toggleBtnTextActive: { color: colors.teal },

  notesWrapper: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  notesInput: {
    color: colors.text,
    fontSize: fonts.base,
    minHeight: 96,
    lineHeight: 22,
  },
  charCount: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: spacing.xs,
  },

  btnSave: {
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
  btnSaveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },
  btnDisabledText: { color: colors.textMuted },

  cancelRow: { alignItems: "center", paddingVertical: spacing.sm },
  cancelText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: "600" },
})
