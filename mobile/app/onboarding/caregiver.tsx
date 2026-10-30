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
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../../lib/theme"

export default function CaregiverScreen() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [nameFocused, setNameFocused] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)

  function handleInviteSMS() {
    const body = `Hi ${name || "there"}, I've added you to my Care Circle on Mojo, an epilepsy care app. You'll be alerted if I need help. Download Mojo to stay connected.`
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(body)}`
    Linking.openURL(smsUrl)
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
          <Text style={styles.heading}>Add your first caregiver</Text>
          <Text style={styles.subheading}>
            Someone you trust to be alerted in an emergency.
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
              onPress={() => router.push("./notifications")}
              style={styles.skipRow}
            >
              <Text style={styles.skipText}>
                {"Skip — I'll add caregivers later"}
              </Text>
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
