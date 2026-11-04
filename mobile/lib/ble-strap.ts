// BLE strap stub — hardware not yet available.
// All functions are no-ops. Replace this file with the full implementation
// (see git history) once react-native-ble-plx is installed and the strap
// hardware UUIDs are confirmed.

export const STRAP_SERVICE_UUID      = "0000EE00-0000-1000-8000-00805F9B34FB"
export const STRAP_EVENT_CHAR_UUID   = "0000EE01-0000-1000-8000-00805F9B34FB"
export const STRAP_COMMAND_CHAR_UUID = "0000EE02-0000-1000-8000-00805F9B34FB"
export const STRAP_ECG_CHAR_UUID     = "0000EE03-0000-1000-8000-00805F9B34FB"

export const STRAP_EVENT = {
  SOS_BUTTON:    0x01,
  FALL_DETECTED: 0x02,
  MED_CONFIRMED: 0x03,
  ECG_START:     0x04,
  ECG_STOP:      0x05,
  BATTERY_LOW:   0x06,
} as const

export const STRAP_CMD = {
  MED_REMINDER:   0x01,
  ECG_RECORD_ON:  0x02,
  ECG_RECORD_OFF: 0x03,
  CELEBRATE:      0x04,
  CANCEL_ALERT:   0x05,
} as const

export type StrapEvent = keyof typeof STRAP_EVENT
export type StrapEventHandler = (event: StrapEvent, rawValue: number) => void
export type EcgSampleHandler = (sample: number) => void

export type ScanResult = { id: string; name: string | null; rssi: number | null }

export async function scanForStraps(_onFound: (r: ScanResult) => void): Promise<void> {}
export function stopScan(): void {}
export async function connectToStrap(_id: string, _onEvent: StrapEventHandler, _onEcg?: EcgSampleHandler): Promise<boolean> { return false }
export async function disconnectStrap(): Promise<void> {}
export async function sendStrapCommand(_cmd: number): Promise<void> {}
export function isStrapConnected(): boolean { return false }
export async function getStrapBatteryLevel(): Promise<number | null> { return null }
export function destroyBleManager(): void {}
