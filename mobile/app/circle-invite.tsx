// Care Circle invite screen — add a contact by email (app user) or phone (SMS only).

// Supports two modes: link existing Mojo user, or add SMS-only contact.

import { useState } from "react"

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"

import { SafeAreaView } from "react-native-safe-area-context"

import { router } from "expo-router"

import { colors, fonts, radius, spacing } from "../lib/theme"

import { useAuth } from "./_layout"

import { addCareCircleMember, findProfileByEmail } from "../lib/supabase"

type Mode = "email" | "sms"

const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Caregiver",
  "Other",
]

export default function CircleInviteScreen() {
  const { session } = useAuth()

  const [mode, setMode] = useState<Mode>("email")

  const [email, setEmail] = useState("")

  const [phone, setPhone] = useState("")

  const [displayName, setDisplayName] = useState("")

  const [relationship, setRelationship] = useState("")

  const [isEmergency, setIsEmergency] = useState(false)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!session?.user) return

    setError("")

    if (!displayName.trim()) {
      setError("Name is required.")
      return
    }

    if (!relationship) {
      setError("Please choose a relationship.")
      return
    }

    if (mode === "email" && !email.trim()) {
      setError("Email is required.")
      return
    }

    if (mode === "sms" && !phone.trim()) {
      setError("Phone number is required.")
      return
    }

    setLoading(true)

    try {
      let memberId: string | undefined

      if (mode === "email") {
        const existing = await findProfileByEmail(email.trim())

        if (!existing) {
          setError(
            "No Mojo account found for that email. Ask them to sign up first, or use the SMS option.",
          )

          setLoading(false)

          return
        }

        memberId = existing.id
      }

      await addCareCircleMember(session.user.id, {
        displayName: displayName.trim(),

        phone: phone.trim() || "",

        relationship: relationship.toLowerCase(),

        isEmergency,

        memberId,

        smsOnly: mode === "sms",
      })

      router.back()
    } catch (e: unknown) {
      setError("Could not add contact. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              style={styles.backBtn}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderLeftWidth: 2,
                  borderTopWidth: 2,
                  borderColor: colors.text,
                  transform: [{ rotate: "-45deg" }],
                }}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Add to Circle</Text>
            <View style={{ width: 32 }} />
          </View>

          <Text style={styles.description}>
            Choose how to add them. They only see what you grant access to.
          </Text>

          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "email" && styles.modeBtnActive]}
              onPress={() => {
                setMode("email")
                setError("")
              }}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.modeBtnText,
                  mode === "email" && styles.modeBtnTextActive,
                ]}
              >
                Mojo app user
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "sms" && styles.modeBtnActive]}
              onPress={() => {
                setMode("sms")
                setError("")
              }}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.modeBtnText,
                  mode === "sms" && styles.modeBtnTextActive,
                ]}
              >
                SMS only
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modeHint}>
            {mode === "email"
              ? "They must already have a Mojo account. They will see alerts and updates in the app."
              : "They receive SOS alerts by SMS only. They do not need the app."}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <FormField
              label="Name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Full name"
            />
            {mode === "email" && (
              <FormField
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="their@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
            <FormField
              label="Phone (for SOS SMS)"
              value={phone}
              onChange={setPhone}
              placeholder="+254 7XX XXX XXX"
              keyboardType="phone-pad"
            />

            {/* Relationship picker */}
            <Text style={styles.fieldLabel}>Relationship</Text>
            <View style={styles.chipRow}>
              {RELATIONSHIPS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.chip,
                    relationship === r.toLowerCase() && styles.chipActive,
                  ]}
                  onPress={() => setRelationship(r.toLowerCase())}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.chipText,
                      relationship === r.toLowerCase() && styles.chipTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Emergency toggle */}
            <TouchableOpacity
              style={styles.emergencyRow}
              onPress={() => setIsEmergency((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isEmergency }}
            >
              <View style={styles.emergencyCheck}>
                {isEmergency && <View style={styles.emergencyCheckInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyLabel}>Emergency contact</Text>
                <Text style={styles.emergencySub}>
                  They receive SOS alerts immediately
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Add to my Circle</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string
  value: string
  onChange: (v: string) => void

  placeholder?: string
  keyboardType?: any
  autoCapitalize?: any
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        autoCorrect={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  scroll: { flex: 1 },

  container: { padding: spacing.xl, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: fonts.lg,
    fontWeight: "800",
    color: colors.text,
  },

  description: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },

  modeToggle: {
    flexDirection: "row",

    backgroundColor: colors.bgCard,

    borderRadius: radius.lg,

    borderWidth: 1,
    borderColor: colors.border,

    padding: 4,

    marginBottom: spacing.md,
  },

  modeBtn: {
    flex: 1,
    paddingVertical: spacing.md,

    borderRadius: radius.md,
    alignItems: "center",
  },

  modeBtnActive: { backgroundColor: colors.teal },

  modeBtnText: {
    fontSize: fonts.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  modeBtnTextActive: { color: "#000" },

  modeHint: {
    fontSize: fonts.xs,
    color: colors.textMuted,

    lineHeight: 16,
    marginBottom: spacing.xl,
  },

  form: { gap: spacing.lg },

  fieldWrap: { gap: spacing.xs },

  fieldLabel: {
    fontSize: fonts.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },

  input: {
    backgroundColor: colors.bgCard,

    borderRadius: radius.md,

    borderWidth: 1,
    borderColor: colors.border,

    paddingVertical: spacing.md,

    paddingHorizontal: spacing.lg,

    color: colors.text,

    fontSize: fonts.base,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },

  chip: {
    borderRadius: radius.full,

    borderWidth: 1,
    borderColor: colors.border,

    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,

    backgroundColor: colors.bgCard,
  },

  chipActive: { backgroundColor: colors.tealBadge, borderColor: colors.teal },

  chipText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  chipTextActive: { color: colors.teal, fontWeight: "700" },

  emergencyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,

    backgroundColor: colors.bgCard,
    borderRadius: radius.md,

    borderWidth: 1,
    borderColor: colors.border,

    padding: spacing.lg,
  },

  emergencyCheck: {
    width: 20,
    height: 20,
    borderRadius: 4,

    borderWidth: 2,
    borderColor: colors.teal,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 2,
  },

  emergencyCheckInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.teal,
  },

  emergencyLabel: {
    fontSize: fonts.base,
    fontWeight: "600",
    color: colors.text,
  },

  emergencySub: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  errorText: {
    color: colors.emergency,

    fontSize: fonts.sm,

    textAlign: "center",

    marginTop: spacing.md,

    marginBottom: spacing.sm,
  },

  submitBtn: {
    backgroundColor: colors.teal,

    borderRadius: radius.xl,

    paddingVertical: spacing.lg,

    alignItems: "center",

    marginTop: spacing.xl,
  },

  submitBtnText: { color: "#000", fontWeight: "800", fontSize: fonts.md },
})
