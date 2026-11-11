// Medical ID sheet — displays and edits user medical information
// Spec: EPIMOYO_REDESIGN.md §5.7 Medical ID (new)

import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, TextInput } from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { colors, fonts, fontFamilies, radius, spacing, shadows } from "../lib/theme"
import { Card } from "./Card"

export interface MedicalIDSheetProps {
  visible: boolean
  onClose: () => void
  data?: {
    condition: string
    medications: string
    allergies: string
    blood_type: string
    emergency_contacts: string
    clinician: string
  }
  onSave?: (data: any) => Promise<void>
  loading?: boolean
}

export function MedicalIDSheet({
  visible,
  onClose,
  data,
  onSave,
  loading = false,
}: MedicalIDSheetProps) {
  const [condition, setCondition] = useState(data?.condition || "")
  const [medications, setMedications] = useState(data?.medications || "")
  const [allergies, setAllergies] = useState(data?.allergies || "")
  const [bloodType, setBloodType] = useState(data?.blood_type || "")
  const [emergencyContacts, setEmergencyContacts] = useState(data?.emergency_contacts || "")
  const [clinician, setClinician] = useState(data?.clinician || "")

  async function handleSave() {
    if (!onSave) return
    await onSave({
      condition,
      medications,
      allergies,
      blood_type: bloodType,
      emergency_contacts: emergencyContacts,
      clinician,
    })
  }

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
            <Text style={s.title}>Medical ID</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
            {/* Condition */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Condition</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="e.g., Focal onset seizures"
                placeholderTextColor={colors.textMuted}
                value={condition}
                onChangeText={setCondition}
                editable={!loading}
              />
            </View>

            {/* Medications */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Current medications</Text>
              <TextInput
                style={[s.fieldInput, { minHeight: 80 }]}
                placeholder="List your medications and doses"
                placeholderTextColor={colors.textMuted}
                value={medications}
                onChangeText={setMedications}
                multiline
                editable={!loading}
              />
            </View>

            {/* Allergies */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Allergies</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="Medication and other allergies"
                placeholderTextColor={colors.textMuted}
                value={allergies}
                onChangeText={setAllergies}
                editable={!loading}
              />
            </View>

            {/* Blood type */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Blood type</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="e.g., O+"
                placeholderTextColor={colors.textMuted}
                value={bloodType}
                onChangeText={setBloodType}
                editable={!loading}
              />
            </View>

            {/* Emergency contacts */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Emergency contacts</Text>
              <TextInput
                style={[s.fieldInput, { minHeight: 80 }]}
                placeholder="Names and phone numbers"
                placeholderTextColor={colors.textMuted}
                value={emergencyContacts}
                onChangeText={setEmergencyContacts}
                multiline
                editable={!loading}
              />
            </View>

            {/* Clinician */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Linked clinician</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="Name and clinic"
                placeholderTextColor={colors.textMuted}
                value={clinician}
                onChangeText={setClinician}
                editable={!loading}
              />
            </View>

            {/* Info card */}
            <Card variant="default" style={s.infoCard}>
              <Text style={s.infoText}>
                Your Medical ID is visible from the SOS screen and to your care circle if enabled.
              </Text>
            </Card>
          </ScrollView>

          {/* Action buttons */}
          <View style={s.actions}>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, loading && s.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={s.saveBtnText}>{loading ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
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
  infoText: {
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
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: fonts.sm,
    color: "#fff",
    fontWeight: "700",
  },
})
