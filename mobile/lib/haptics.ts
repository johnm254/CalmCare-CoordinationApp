// Haptic feedback patterns for epimoyo
// Spec: EPIMOYO_REDESIGN.md §5.4 (Haptics)
// Light (select), medium (confirm), strong (SOS/5-min alert)

import * as Haptics from "expo-haptics"

export const HAPTIC_PATTERNS = {
  // Light tap — select, press, focus
  light: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {}
  },

  // Medium impact — confirm, toggle, pill selection
  medium: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } catch {}
  },

  // Strong impact — SOS send, 5-min alert, critical event
  strong: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } catch {}
  },

  // Success notification — seizure event logged, mood saved
  success: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {}
  },

  // Warning notification — SOS cancel, medication missed
  warning: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } catch {}
  },

  // Error notification — action failed, network error
  error: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } catch {}
  },
}

export type HapticPattern = keyof typeof HAPTIC_PATTERNS

// Usage in components:
// const { light, medium, strong } = useHaptics()
// <TouchableOpacity onPress={() => { light(); handlePress() }} />
