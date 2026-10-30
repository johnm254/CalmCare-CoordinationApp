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
} from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../../lib/theme"

const SEIZURE_TYPES = [
  "Tonic-clonic",
  "Absence",
  "Focal",
  "Myoclonic",
  "Unknown / Other",
]

export default function ConditionsScreen() {
  const [selected, setSelected] = useState<string[]>([])
  const [trigger, setTrigger] = useState("")
  const [triggerFocused, setTriggerFocused] = useState(false)

  function toggleType(type: string) {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
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
          <Text style={styles.heading}>Tell us about your condition</Text>
          <Text style={styles.subheading}>
            This helps Mojo personalise your tracking. You can update this later.
          </Text>

          {/* Seizure type chips */}
          <Text style={styles.sectionLabel}>Seizure types</Text>
          <View style={styles.chipGrid}>
            {SEIZURE_TYPES.map((type) => {
              const active = selected.includes(type)
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleType(type)}
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

          {/* Trigger input */}
          <Text style={styles.sectionLabel}>Main trigger (optional)</Text>
          <View
            style={[
              styles.inputWrapper,
              triggerFocused && styles.inputFocused,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="What usually triggers your seizures?"
              placeholderTextColor={colors.textMuted}
              value={trigger}
              onChangeText={setTrigger}
              onFocus={() => setTriggerFocused(true)}
              onBlur={() => setTriggerFocused(false)}
              returnKeyType="done"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnNext}
              onPress={() => router.push("./caregiver")}
              activeOpacity={0.85}
            >
              <Text style={styles.btnNextText}>Next</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("./caregiver")}
              style={styles.skipRow}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
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

  sectionLabel: {
    fontSize: fonts.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
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
  chipTextActive: {
    color: colors.teal,
    fontWeight: "700",
  },

  inputWrapper: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.lg,
    height: 54,
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  inputFocused: {
    borderColor: colors.teal,
    backgroundColor: "rgba(139,92,246,0.05)",
  },
  input: {
    color: colors.text,
    fontSize: fonts.base,
  },

  actions: {
    marginTop: "auto",
  },
  btnNext: {
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
  btnNextText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },
  skipRow: { alignItems: "center", paddingVertical: spacing.sm },
  skipText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: "600" },
})
