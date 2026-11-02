// BLE manager for the Mojo Strap wearable.
// Gated behind the ble_strap feature flag.
// Placeholder UUIDs — swap for real hardware specs when strap ships.
// All public functions are safe to call before pairing (they return early / null).

import { BleManager, Device, State, Characteristic, BleError } from "react-native-ble-plx"
import { Platform, PermissionsAndroid } from "react-native"
import { supabase } from "./supabase"

// ── Placeholder UUIDs (replace when hardware datasheet arrives) ───────────────
export const STRAP_SERVICE_UUID         = "0000EE00-0000-1000-8000-00805F9B34FB"
export const STRAP_EVENT_CHAR_UUID      = "0000EE01-0000-1000-8000-00805F9B34FB" // notify: events from strap
export const STRAP_COMMAND_CHAR_UUID    = "0000EE02-0000-1000-8000-00805F9B34FB" // write: commands to strap
export const STRAP_ECG_CHAR_UUID        = "0000EE03-0000-1000-8000-00805F9B34FB" // notify: ECG stream

// ── Event byte codes received from strap ─────────────────────────────────────
export const STRAP_EVENT = {
  SOS_BUTTON:      0x01,
  FALL_DETECTED:   0x02,
  MED_CONFIRMED:   0x03,
  ECG_START:       0x04,
  ECG_STOP:        0x05,
  BATTERY_LOW:     0x06,
} as const

// ── Command byte codes sent to strap ─────────────────────────────────────────
export const STRAP_CMD = {
  MED_REMINDER:    0x01,  // trigger vibration pattern for medication
  ECG_RECORD_ON:   0x02,
  ECG_RECORD_OFF:  0x03,
  CELEBRATE:       0x04,  // streak milestone LED pattern
  CANCEL_ALERT:    0x05,  // stop flashing after SOS resolved
} as const

export type StrapEvent = keyof typeof STRAP_EVENT
export type StrapEventHandler = (event: StrapEvent, rawValue: number) => void
export type EcgSampleHandler = (sample: number) => void

// ── Singleton manager ─────────────────────────────────────────────────────────

let manager: BleManager | null = null
let connectedDevice: Device | null = null
let eventSubscription: ReturnType<typeof connectedDevice.monitorCharacteristicForService> | null = null
let ecgSubscription: ReturnType<typeof connectedDevice.monitorCharacteristicForService> | null = null
let stateSubscription: ReturnType<typeof manager.onStateChange> | null = null
let onEventCallback: StrapEventHandler | null = null
let onEcgCallback: EcgSampleHandler | null = null

function getManager(): BleManager {
  if (!manager) {
    manager = new BleManager()
  }
  return manager
}

// ── Feature flag check ────────────────────────────────────────────────────────

async function isStrapEnabled(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", "ble_strap")
      .maybeSingle()
    return data?.enabled === true
  } catch {
    return false
  }
}

// ── Permissions ───────────────────────────────────────────────────────────────

async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    if (Platform.Version >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ])
      return Object.values(results).every((r) => r === PermissionsAndroid.RESULTS.GRANTED)
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      )
      return result === PermissionsAndroid.RESULTS.GRANTED
    }
  }
  return true // iOS permissions are handled at system level
}

// ── Wait for BLE to be powered on ────────────────────────────────────────────

function waitForBleReady(timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const m = getManager()
    const timeout = setTimeout(() => resolve(false), timeoutMs)
    stateSubscription = m.onStateChange((state) => {
      if (state === State.PoweredOn) {
        clearTimeout(timeout)
        stateSubscription?.remove()
        stateSubscription = null
        resolve(true)
      } else if (state === State.PoweredOff || state === State.Unauthorized) {
        clearTimeout(timeout)
        stateSubscription?.remove()
        stateSubscription = null
        resolve(false)
      }
    }, true)
  })
}

// ── Scan ──────────────────────────────────────────────────────────────────────

export type ScanResult = { id: string; name: string | null; rssi: number | null }

export async function scanForStraps(
  onFound: (result: ScanResult) => void,
  timeoutMs = 15000,
): Promise<void> {
  if (!(await isStrapEnabled())) return
  const granted = await requestBlePermissions()
  if (!granted) return
  const ready = await waitForBleReady()
  if (!ready) return

  const m = getManager()
  m.startDeviceScan([STRAP_SERVICE_UUID], { allowDuplicates: false }, (error: BleError | null, device: Device | null) => {
    if (error || !device) return
    onFound({ id: device.id, name: device.name, rssi: device.rssi })
  })

  setTimeout(() => m.stopDeviceScan(), timeoutMs)
}

export function stopScan() {
  getManager().stopDeviceScan()
}

// ── Connect ───────────────────────────────────────────────────────────────────

export async function connectToStrap(
  deviceId: string,
  onEvent: StrapEventHandler,
  onEcg?: EcgSampleHandler,
): Promise<boolean> {
  if (!(await isStrapEnabled())) return false
  try {
    const m = getManager()
    const device = await m.connectToDevice(deviceId, { autoConnect: true })
    await device.discoverAllServicesAndCharacteristics()
    connectedDevice = device
    onEventCallback = onEvent
    onEcgCallback = onEcg ?? null

    // Subscribe to strap event notifications
    eventSubscription = device.monitorCharacteristicForService(
      STRAP_SERVICE_UUID,
      STRAP_EVENT_CHAR_UUID,
      (err: BleError | null, char: Characteristic | null) => {
        if (err || !char?.value) return
        const bytes = Buffer.from(char.value, "base64")
        const code = bytes[0]
        const eventName = (Object.entries(STRAP_EVENT).find(([, v]) => v === code)?.[0] ?? null) as StrapEvent | null
        if (eventName && onEventCallback) onEventCallback(eventName, code)
      },
    )

    // Subscribe to ECG stream if callback provided
    if (onEcg) {
      ecgSubscription = device.monitorCharacteristicForService(
        STRAP_SERVICE_UUID,
        STRAP_ECG_CHAR_UUID,
        (err: BleError | null, char: Characteristic | null) => {
          if (err || !char?.value) return
          const bytes = Buffer.from(char.value, "base64")
          // ECG packet: 2-byte little-endian signed int per sample
          for (let i = 0; i + 1 < bytes.length; i += 2) {
            const sample = bytes.readInt16LE(i)
            onEcgCallback?.(sample)
          }
        },
      )
    }

    return true
  } catch (e) {
    console.warn("ble-strap: connect failed", e)
    connectedDevice = null
    return false
  }
}

// ── Disconnect ────────────────────────────────────────────────────────────────

export async function disconnectStrap(): Promise<void> {
  eventSubscription?.remove()
  ecgSubscription?.remove()
  eventSubscription = null
  ecgSubscription = null
  if (connectedDevice) {
    await connectedDevice.cancelConnection().catch(() => {})
    connectedDevice = null
  }
}

// ── Send command ──────────────────────────────────────────────────────────────

export async function sendStrapCommand(cmd: number): Promise<void> {
  if (!connectedDevice) return
  try {
    const buf = Buffer.alloc(1)
    buf[0] = cmd
    await connectedDevice.writeCharacteristicWithResponseForService(
      STRAP_SERVICE_UUID,
      STRAP_COMMAND_CHAR_UUID,
      buf.toString("base64"),
    )
  } catch (e) {
    console.warn("ble-strap: write failed", e)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isStrapConnected(): boolean {
  return connectedDevice !== null
}

export async function getStrapBatteryLevel(): Promise<number | null> {
  if (!connectedDevice) return null
  try {
    // Standard BLE Battery Service
    const char = await connectedDevice.readCharacteristicForService(
      "0000180F-0000-1000-8000-00805F9B34FB",
      "00002A19-0000-1000-8000-00805F9B34FB",
    )
    if (!char?.value) return null
    return Buffer.from(char.value, "base64")[0]
  } catch {
    return null
  }
}

export function destroyBleManager(): void {
  stateSubscription?.remove()
  eventSubscription?.remove()
  ecgSubscription?.remove()
  manager?.destroy()
  manager = null
  connectedDevice = null
}
