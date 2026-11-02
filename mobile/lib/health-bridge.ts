// Health data bridge — Apple HealthKit (iOS) and Google Fit (Android).
// Gated behind the health_sync feature flag.
// Real sync is not yet implemented; this stub defines the interface.

import { Platform } from "react-native"
import { supabase } from "./supabase"

export type HealthSample = {
  type: "steps" | "heart_rate" | "sleep_hours" | "blood_oxygen"
  value: number
  unit: string
  recorded_at: string
}

async function isHealthSyncEnabled(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", "health_sync")
      .maybeSingle()
    return data?.enabled === true
  } catch {
    return false
  }
}

export async function requestHealthPermissions(): Promise<boolean> {
  if (!(await isHealthSyncEnabled())) return false
  // TODO: call expo-health or react-native-health when available
  console.warn("health-bridge: requestHealthPermissions not yet implemented on", Platform.OS)
  return false
}

export async function fetchRecentHealthSamples(): Promise<HealthSample[]> {
  if (!(await isHealthSyncEnabled())) return []
  // TODO: read from HealthKit / Health Connect
  console.warn("health-bridge: fetchRecentHealthSamples not yet implemented on", Platform.OS)
  return []
}

export async function syncHealthSamplesToSupabase(patientId: string): Promise<void> {
  if (!(await isHealthSyncEnabled())) return
  const samples = await fetchRecentHealthSamples()
  if (samples.length === 0) return
  // TODO: upsert into health_samples table once schema is confirmed
  console.warn("health-bridge: syncHealthSamplesToSupabase — no samples to sync", patientId)
}
