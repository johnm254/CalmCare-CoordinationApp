// Onboarding step 3 — Name and photo
// Spec: EPIMOYO_REDESIGN.md §5.8

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image } from "react-native"
import { useState } from "react"
import { router } from "expo-router"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { colors, fonts, radius, spacing } from "../../lib/theme"

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const [fullName, setFullName] = useState("")
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0.375) // Step 3 of 8

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
    }
  }

  function handleNext() {
    if (!fullName.trim()) return
    // Store fullName in context/session for later
    router.push("./role")
  }

  function handleBack() {
    router.back()
  }

  const canContinue = fullName.trim().length > 0

  return (
    <View style={s.safe}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Progress bar */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.stepLabel}>Step 3 of 8</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>Let's set up your profile</Text>
          <Text style={s.subtitle}>You can update your photo and name anytime.</Text>

          {/* Photo picker */}
          <TouchableOpacity
            style={s.photoPicker}
            onPress={pickPhoto}
            activeOpacity={0.8}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={s.photoImage}
              />
            ) : (
              <View style={s.photoPlaceholder}>
                <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
                <Text style={s.photoPlaceholderText}>Add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {photoUri && (
            <TouchableOpacity
              style={s.removePhotoBtn}
              onPress={() => setPhotoUri(null)}
              activeOpacity={0.8}
            >
              <Text style={s.removePhotoBtnText}>Remove photo</Text>
            </TouchableOpacity>
          )}

          {/* Name input */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Full name</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
          </View>

          {/* Hint */}
          <Text style={s.hint}>
            Your name will be shown to your care circle and clinician.
          </Text>
        </ScrollView>

        {/* Actions */}
        <View style={[s.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
          <TouchableOpacity
            style={[s.nextBtn, !canContinue && s.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canContinue || loading}
            activeOpacity={0.85}
          >
            <Text style={s.nextBtnText}>Continue</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
  scroll: { flex: 1 },
  container: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.lg },
  title: {
    fontSize: fonts.xl,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  photoPicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
    alignSelf: "center",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    fontSize: fonts.xs,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  removePhotoBtn: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  removePhotoBtnText: {
    fontSize: fonts.xs,
    color: colors.danger,
    fontWeight: "600",
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.sm,
    color: colors.text,
  },
  hint: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fonts.base,
  },
})
