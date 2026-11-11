import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from "react-native"
import { useState, useEffect } from "react"
import { colors, fonts, fontFamilies, radius, spacing, shadows } from "../lib/theme"
import { Ionicons } from "@expo/vector-icons"
import { useHaptics } from "../lib/use-haptics"
import { Card } from "./Card"

export interface MoodSheetProps {
  visible: boolean
  onClose: () => void
  onSelect: (score: 1 | 2 | 3 | 4 | 5) => void
  loading?: boolean
}

const MOOD_OPTIONS = [
  { score: 1, emoji: "😔", label: "Very low" },
  { score: 2, emoji: "😕", label: "Low" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😊", label: "Great" },
]

export function MoodSheet({
  visible,
  onClose,
  onSelect,
  loading = false,
}: MoodSheetProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const haptics = useHaptics()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>How are you feeling today?</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={s.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Mood options */}
            <View style={s.moodGrid}>
              {MOOD_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.score}
                  style={[
                    s.moodBtn,
                    selected === opt.score && s.moodBtnSelected,
                  ]}
                  onPress={() => {
                    haptics.medium()
                    setSelected(opt.score)
                    onSelect(opt.score as 1 | 2 | 3 | 4 | 5)
                  }}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={s.emoji}>{opt.emoji}</Text>
                  <Text style={s.label}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Privacy statement */}
            <Card variant="default" style={s.privacyCard}>
              <Text style={s.privacyText}>
                Mood data is private by default — only you and your clinician can see it. Caregivers cannot access mood logs.
              </Text>
            </Card>

            {/* Crisis resource (if Very low selected) */}
            {selected === 1 && (
              <Card variant="default" style={s.crisisCard}>
                <View style={s.crisisHeader}>
                  <Ionicons name="alert-circle" size={20} color={colors.danger} />
                  <Text style={s.crisisTitle}>Support is available</Text>
                </View>
                <Text style={s.crisisOrg}>Befrienders Kenya</Text>
                <Text style={s.crisisPhone}>0800 723 253 · Free · 24/7</Text>
                <TouchableOpacity
                  style={s.crisisBtn}
                  onPress={() => {
                    haptics.strong()
                    // Implement calling
                    onClose()
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.crisisBtnText}>Call now</Text>
                </TouchableOpacity>
              </Card>
            )}

            {/* History placeholder */}
            <View style={s.historySection}>
              <Text style={s.sectionLabel}>Last 7 days</Text>
              <Card variant="default">
                <Text style={s.historyEmpty}>No mood logs yet</Text>
              </Card>
            </View>
          </ScrollView>

          {/* Close button at bottom */}
          <TouchableOpacity
            style={s.bottomCloseBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={s.bottomCloseBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
    fontFamily: fontFamilies.bodySemiBold,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  moodGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  moodBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  emoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
  },
  privacyCard: {
    marginBottom: spacing.lg,
  },
  privacyText: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: "center",
  },
  crisisCard: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    marginBottom: spacing.lg,
  },
  crisisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  crisisTitle: {
    fontSize: fonts.base,
    fontWeight: "700",
    color: colors.danger,
    fontFamily: fontFamilies.bodySemiBold,
  },
  crisisOrg: {
    fontSize: fonts.md,
    fontWeight: "700",
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
    marginBottom: spacing.xs,
  },
  crisisPhone: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  crisisBtn: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  crisisBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: fonts.sm,
    fontFamily: fontFamilies.bodyBold,
  },
  historySection: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },
  historyEmpty: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  bottomCloseBtn: {
    margin: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomCloseBtnText: {
    fontSize: fonts.md,
    color: colors.primary,
    fontWeight: "700",
    fontFamily: fontFamilies.bodyBold,
  },
})
