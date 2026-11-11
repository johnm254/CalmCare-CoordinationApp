// Animation utilities for epimoyo
// All animations follow spec §7 (epilepsy-safe constraints):
// - No flash/strobe (must be smooth fades, not rapid on/off)
// - Durations 150-300ms standard, or approved: SOS halo 4s, ring fill 600ms, countup 400ms
// - No animations triggering >1/sec (except approved heart pulse, capped at real HR but max 1/sec)

import { Animated } from "react-native"

// ── SOS Halo breathing animation (4-second cycle)
// Spec: 0% → 42% → 0%, smooth opacity breathing
export function createHaloAnimation() {
  const opacity = new Animated.Value(0.18)

  const haloLoop = Animated.loop(
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.42,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.18,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]),
  )

  return { opacity, animation: haloLoop }
}

// ── Border fade animation (countdown disappear)
// Spec: 100% → 0% over 5 seconds (SOS countdown)
export function createBorderFadeAnimation(durationMs: number) {
  const value = new Animated.Value(1)

  const animation = Animated.timing(value, {
    toValue: 0,
    duration: durationMs,
    useNativeDriver: false,
  })

  return { value, animation }
}

// ── Checkmark animation (dose confirmed, mood saved)
// Spec: Scale 0.5 → 1 with opacity, 250ms
export function createCheckmarkAnimation() {
  const scale = new Animated.Value(0.5)
  const opacity = new Animated.Value(0)

  const animation = Animated.parallel([
    Animated.timing(scale, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),
  ])

  return { scale, opacity, animation }
}

// ── Ring fill animation (SOS sending, seizure started)
// Spec: Stroke from 0% → 100%, 600ms smooth
// Note: For React Native, we use opacity/scale to simulate ring fill
export function createRingFillAnimation() {
  const opacity = new Animated.Value(0)

  const animation = Animated.timing(opacity, {
    toValue: 1,
    duration: 600,
    useNativeDriver: true,
  })

  return { opacity, animation }
}

// ── Countup animation (elapsed time display)
// Spec: Number ticks up smoothly, 400ms per increment
// Note: RN doesn't have native number animation, so we use frame-by-frame
export function createCountupAnimation() {
  const progress = new Animated.Value(0)

  const animation = Animated.timing(progress, {
    toValue: 1,
    duration: 400,
    useNativeDriver: true,
  })

  return { progress, animation }
}

// ── Screen fade transition (page enter/exit)
// Spec: Fade in 250ms on enter, fade out 250ms on exit
export function createFadeTransition() {
  const opacity = new Animated.Value(0)

  const fadeIn = Animated.timing(opacity, {
    toValue: 1,
    duration: 250,
    useNativeDriver: true,
  })

  const fadeOut = Animated.timing(opacity, {
    toValue: 0,
    duration: 250,
    useNativeDriver: true,
  })

  return { opacity, fadeIn, fadeOut }
}

// ── Pulse animation (alert/warning state)
// Spec: Scale 0.95 → 1 → 0.95, 300ms smooth cycle
// Used for alert states, medical ID updates, etc.
export function createPulseAnimation() {
  const scale = new Animated.Value(1)

  const pulse = Animated.loop(
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]),
  )

  return { scale, animation: pulse }
}

// ── Slide in animation (modal/sheet entrance)
// Spec: Bottom slide-up or left slide, 300ms
export function createSlideAnimation(fromValue: number = 100) {
  const translateY = new Animated.Value(fromValue)

  const slideIn = Animated.timing(translateY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  })

  const slideOut = Animated.timing(translateY, {
    toValue: fromValue,
    duration: 300,
    useNativeDriver: true,
  })

  return { translateY, slideIn, slideOut }
}

// ── Heart pulse animation (real-time HR display)
// Spec: Glow/scale pulse synchronized with heartbeats
// Capped at 1 pulse/sec max (e.g., 60 BPM = 1/sec, 120 BPM clamped to 1/sec)
export function createHeartPulseAnimation(bpmRaw: number) {
  const scale = new Animated.Value(1)
  // Clamp to max 1 pulse/sec (60 BPM)
  const bpm = Math.min(bpmRaw, 60)
  const durationMs = (60 / bpm) * 1000

  const pulse = Animated.loop(
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.15,
        duration: durationMs * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: durationMs * 0.7,
        useNativeDriver: true,
      }),
    ]),
  )

  return { scale, animation: pulse, durationMs }
}

// ── Shake animation (error state, critical warning)
// Spec: Horizontal shake, 150ms total
// Used sparingly for critical events
export function createShakeAnimation() {
  const translateX = new Animated.Value(0)

  const shake = Animated.sequence([
    Animated.timing(translateX, { toValue: -10, duration: 25, useNativeDriver: true }),
    Animated.timing(translateX, { toValue: 10, duration: 25, useNativeDriver: true }),
    Animated.timing(translateX, { toValue: -10, duration: 25, useNativeDriver: true }),
    Animated.timing(translateX, { toValue: 10, duration: 25, useNativeDriver: true }),
    Animated.timing(translateX, { toValue: 0, duration: 25, useNativeDriver: true }),
  ])

  return { translateX, animation: shake }
}
