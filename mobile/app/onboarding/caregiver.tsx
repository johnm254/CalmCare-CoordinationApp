import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from "react-native"
import { router } from "expo-router"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, radius, spacing } from "../../lib/theme"

export default function CaregiverScreen() {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [nameFocused, setNameFocused] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [progress] = useState(0.875) // Step 7 of 8

  function handleInviteSMS() {
    const body = `Hi ${name || "friend"}, I've added you to my Care Circle on epimoyo, an epilepsy care app. You'll be alerted if I need help. Download epimoyo to stay connected.`
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(body)}`
    Linking.openURL(smsUrl)
    router.push("./notifications")
  }

  function handleSkip() {
    router.push("./notifications")
  }

  function handleBack() {
    router.back()
  }

  return (
    <View style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 7 of 8</Text>
        <View style={{ width: 24 }} />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.heading}>Add your first caregiver</Text>
            <Text style={styles.subheading}>
              Someone you trust to be alerted in an emergency. You can add more later.
            </Text>

            {/* Name input */}
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={[styles.inputWrapper, nameFocused && styles.inputFocused]}>
              <TextInput
                style={styles.input}
              placeholder="e.g. Jane Wanjiku"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              returnKeyType="next"
              autoCapitalize="words"
            />
          </View>

          {/* Phone input */}
          <Text style={styles.fieldLabel}>Phone number</Text>
          <View
            style={[styles.inputWrapper, phoneFocused && styles.inputFocused]}
          >
            <TextInput
              style={styles.input}
              placeholder="e.g. +254 712 345 678"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>

          <View style={styles.actions}>
            {/* Invite by SMS */}
            <TouchableOpacity
              style={[
                styles.btnInvite,
                (!name.trim() || !phone.trim()) && styles.btnDisabled,
              ]}
              onPress={handleInviteSMS}
              disabled={!name.trim() || !phone.trim()}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.btnInviteText,
                  (!name.trim() || !phone.trim()) && styles.btnDisabledText,
                ]}
              >
                Invite by SMS
              </Text>
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipRow}
            >
              <Text style={styles.skipText}>
                {"Skip — I'll add caregivers later"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  progressBar: {
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    fontSize: fonts.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },

  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
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
    backgroundColor: "rgba(31,122,114,0.05)",
  },
  input: { color: colors.text, fontSize: fonts.base },

  actions: { marginTop: "auto" },
  btnInvite: {
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
  btnInviteText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.3,
  },
  btnDisabledText: { color: colors.textMuted },
  skipRow: { alignItems: "center", paddingVertical: spacing.sm },
  skipText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: "600" },
})
