// Hook for using haptic feedback patterns
// Automatically disables on platforms that don't support it

import { useCallback } from "react"
import { HAPTIC_PATTERNS, type HapticPattern } from "./haptics"

export function useHaptics() {
  const trigger = useCallback(async (pattern: HapticPattern) => {
    const fn = HAPTIC_PATTERNS[pattern]
    if (fn) await fn()
  }, [])

  return {
    light: () => trigger("light"),
    medium: () => trigger("medium"),
    strong: () => trigger("strong"),
    success: () => trigger("success"),
    warning: () => trigger("warning"),
    error: () => trigger("error"),
    trigger,
  }
}
