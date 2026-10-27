/* STUB: Replace with react-native-ble-plx or Expo BLE SDK. Mojo Strap service UUID: 00001800-0000-1000-8000-00805f9b34fb (placeholder) */

// BLE is not available in the web preview. On a real device with the BLE SDK,

// replace mock data with actual characteristic reads from the Mojo Strap service.

import { useState, useEffect, useCallback } from "react"

export const BLE_AVAILABLE = false

export type BleVitals = {
  heartRate: number // bpm

  spo2: number // %

  tempC: number // °C

  hrv: number // ms

  steps: number

  batteryPct: number // 0-100

  quality: number // 0-100 (CR-STRAP-09)

  connected: boolean

  lastSeen: string // ISO timestamp
}

export type MotionEvent = {
  id: string

  type: "fall" | "seizure" | "tremor" | "inactivity"

  detectedAt: string

  confidence: number // 0-1

  strapModel: "mojo_strap_a" | "mojo_strap_b"
}

const INITIAL_VITALS: BleVitals = {
  heartRate: 72,

  spo2: 98,

  tempC: 36.8,

  hrv: 42,

  steps: 3412,

  batteryPct: 72,

  quality: 94,

  connected: true,

  lastSeen: new Date().toISOString(),
}

const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

const INITIAL_MOTION_EVENTS: MotionEvent[] = [
  {
    id: "demo-fall-001",

    type: "fall",

    detectedAt: twoHoursAgo,

    confidence: 0.87,

    strapModel: "mojo_strap_a",
  },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function useBle(): {
  vitals: BleVitals

  motionEvents: MotionEvent[]

  scanning: boolean

  scan: () => void

  disconnect: () => void
} {
  const [vitals, setVitals] = useState<BleVitals>(INITIAL_VITALS)

  const [motionEvents] = useState<MotionEvent[]>(INITIAL_MOTION_EVENTS)

  const [scanning, setScanning] = useState(false)

  // Simulate real-time updates every 5 seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setVitals((prev) => ({
        ...prev,

        heartRate: clamp(
          Math.round(prev.heartRate + (Math.random() * 6 - 3)),

          40,

          200,
        ),

        spo2: clamp(
          Math.round(prev.spo2 + (Math.random() * 2 - 1)),

          85,

          100,
        ),

        steps: prev.steps + Math.round(Math.random() * 40 + 10),

        lastSeen: new Date().toISOString(),
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const scan = useCallback(() => {
    setScanning(true)

    setTimeout(() => setScanning(false), 3000)
  }, [])

  const disconnect = useCallback(() => {
    setVitals((prev) => ({ ...prev, connected: false }))
  }, [])

  return { vitals, motionEvents, scanning, scan, disconnect }
}

export function formatVital(key: keyof BleVitals, value: number): string {
  switch (key) {
    case "heartRate":
      return `${value} bpm`

    case "spo2":
      return `${value}%`

    case "tempC":
      return `${value.toFixed(1)}°C`

    case "hrv":
      return `${value} ms`

    case "steps":
      return value.toLocaleString()

    case "batteryPct":
      return `${value}%`

    case "quality":
      return `${value}%`

    default:
      return String(value)
  }
}
