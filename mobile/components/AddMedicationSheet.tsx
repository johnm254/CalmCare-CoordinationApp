// Add self-reported medication sheet
// Spec: EPIMOYO_REDESIGN.md §5.4 (Meds screen)

import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, TextInput } from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, fontFamilies, radius, spacing } from "../lib/theme"
import { Card, Button } from "./index"

export interface AddMedicationData {
  name: string
  dose: string
  frequency: string
  notes: string
}

export interface AddMedicationSheetProps {
  visible: boolean
  onClose: () => void
  onAdd?: (data: AddMedicationData) => Promise<void>
  loading?: boolean
}

export function AddMedicationSheet({
  visible,
  onClose,
  onAdd,
  loading = false,
}: AddMedicationSheetProps) {
  const [name, setName] = useState("")
  const [dose, setDose] = useState("")
  const [frequency, setFrequency] = useState("")
  const [notes, setNotes] = useState("")

  async function handleAdd() {
    if (!name.trim() || !dose.trim() || !frequency.trim()) return
    if (!onAdd) return

    await onAdd({
      name: name.trim(),
      dose: dose.trim(),
      frequency: frequency.trim(),
      notes: notes.trim(),
    })

    // Reset form
    setName("")
    setDose("")
    setFrequency("")
    setNotes("")
  }

  function handleClose() {
    setName("")
    setDose("")
    setFrequency("")
    setNotes("")
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Add medication</Text>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
            <Text style={s.subtitle}>
              Add medications you're taking that aren't on your clinician's schedule.
            </Text>

            {/* Name */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Medication name *</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="e.g., Keppra"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            {/* Dose */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Dose *</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="e.g., 500mg"
                placeholderTextColor={colors.textMuted}
                value={dose}
                onChangeText={setDose}
                editable={!loading}
              />
            </View>

            {/* Frequency */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Frequency *</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="e.g., Twice daily"
                placeholderTextColor={colors.textMuted}
                value={frequency}
                onChangeText={setFrequency}
                editable={!loading}
              />
            </View>

            {/* Notes */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[s.fieldInput, { minHeight: 80 }]}
                placeholder="Take with food, side effects, etc."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                editable={!loading}
              />
            </View>

            {/* Info card */}
            <Card variant="default" style={s.infoCard}>
              <View style={s.infoContent}>
                <Ionicons name="information-circle-outline" size={16} color={colors.text} />
                <Text style={s.infoText}>
                  Self-reported medications will be labelled as such and can be updated or removed anytime.
                </Text>
              </View>
            </Card>
          </ScrollView>

          {/* Actions */}
          <View style={s.actions}>
            <Button
              label="Cancel"
              variant="secondary"
              onPress={handleClose}
              disabled={loading}
            />
            <Button
              label={loading ? "Adding..." : "Add"}
              variant="primary"
              onPress={handleAdd}
              disabled={loading || !name.trim() || !dose.trim() || !frequency.trim()}
            />
          </View>
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
  subtitle: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.sm,
    color: colors.text,
    fontFamily: fontFamilies.body,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoContent: {
    flexDirection: "row",
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: fonts.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
