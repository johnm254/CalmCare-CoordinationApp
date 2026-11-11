// Hook for detecting if user has enabled reduce motion accessibility setting
// Returns true if animations should be skipped/shortened
// Spec: EPIMOYO_REDESIGN.md §7.2 (Accessibility - Reduce Motion)

import { useEffect, useState } from "react"
import { AccessibilityInfo } from "react-native"

let cachedReduceMotion: boolean | null = null

export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    let alive = true

    async function check() {
      // Use cached value if available to avoid repeated system calls
      if (cachedReduceMotion !== null) {
        if (alive) setReduceMotion(cachedReduceMotion)
        return
      }

      try {
        const shouldReduce = await AccessibilityInfo.boldTextEnabled()
        if (alive) {
          cachedReduceMotion = shouldReduce
          setReduceMotion(shouldReduce)
        }
      } catch {
        // Default to false if check fails
        if (alive) setReduceMotion(false)
      }
    }

    check()

    return () => { alive = false }
  }, [])

  return reduceMotion
}

// Animation duration helpers that respect reduce-motion setting
export const durations = {
  // Standard motion (150-300ms per spec)
  fast: (reduceMotion: boolean) => reduceMotion ? 0 : 150,
  normal: (reduceMotion: boolean) => reduceMotion ? 0 : 250,
  slow: (reduceMotion: boolean) => reduceMotion ? 0 : 300,

  // Approved longer durations
  halo: (reduceMotion: boolean) => reduceMotion ? 0 : 4000, // SOS halo breathing
  pulse: (reduceMotion: boolean) => reduceMotion ? 0 : 600, // Ring fill
  countup: (reduceMotion: boolean) => reduceMotion ? 0 : 400, // Number countup
}
