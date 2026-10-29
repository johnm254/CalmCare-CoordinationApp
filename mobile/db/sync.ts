// Sync engine — outbox push + remote pull.
// CR-OFF-01: local SQLite is source of truth; sync on reconnect.
// CR-OFF-02: outbox with client UUID + timestamp for every write.
// CR-OFF-05: stale-version server conflicts cause a re-pull.

import { supabase } from "../lib/supabase"
import {
  getUnsyncedEntries,
  markSynced,
  markOutboxError,
  updateSyncState,
  getSyncState,
  queryAll,
  insert,
  update,
  rawQuery,
  getPendingSosQueue,
  markSosQueueSynced,
} from "./offline"
import { syncNotificationsFromSchedules } from "../lib/notifications"

export interface SyncResult {
  success: boolean
  pushedCount: number
  pulledCount: number
  errors: Array<{ entry: string; error: string }>
  lastSync: string
}

export async function syncData(deviceId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    pushedCount: 0,
    pulledCount: 0,
    errors: [],
    lastSync: new Date().toISOString(),
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const push = await pushOutbox()
    result.pushedCount = push.successful
    result.errors.push(...push.errors)

    const pull = await pullChanges(user.id, deviceId)
    result.pulledCount = pull.count
    result.errors.push(...pull.errors)

    await updateSyncState(deviceId, new Date().toISOString(), result.lastSync)

    // Retry any SOS events that were queued offline
    await retrySosQueue(user.id)

    // Reschedule local notifications after every sync
    await rescheduleNotifications(user.id)

    return result
  } catch (error) {
    return {
      ...result,
      success: false,
      errors: [{ entry: "sync", error: String(error) }],
    }
  }
}

// ── Outbox push ───────────────────────────────────────────────────────────────

async function pushOutbox() {
  const successful: string[] = []
  const errors: Array<{ entry: string; error: string }> = []

  const entries = await getUnsyncedEntries()
  for (const entry of entries) {
    try {
      await pushEntry(entry)
      await markSynced(entry.id)
      successful.push(entry.id)
    } catch (err) {
      await markOutboxError(entry.id, String(err))
      errors.push({ entry: entry.id, error: String(err) })
    }
  }
  return { successful: successful.length, errors }
}

async function pushEntry(entry: {
  table_name: string
  operation: string
  data: Record<string, unknown>
}) {
  const { table_name: table, operation, data } = entry

  if (operation === "insert") {
    const { error } = await supabase.from(table).insert([data])
    if (error) {
      // Ignore duplicate (already synced via another path)
      if (error.code !== "23505") throw error
    }
  } else if (operation === "update") {
    const { id, ...rest } = data
    const { error } = await supabase.from(table).update(rest).eq("id", id)
    if (error) throw error
  } else if (operation === "delete") {
    const { error } = await supabase.from(table).delete().eq("id", data.id)
    if (error) throw error
  }
}

// ── Remote pull ───────────────────────────────────────────────────────────────

async function pullChanges(userId: string, deviceId: string) {
  const count: string[] = []
  const errors: Array<{ entry: string; error: string }> = []

  const syncState = await getSyncState(deviceId)
  const lastSync = syncState?.last_sync

  const tables: Array<{ name: string; filter: Record<string, string> }> = [
    { name: "medications", filter: { patient_id: userId } },
    { name: "medication_schedules", filter: {} },
    { name: "dose_events", filter: { patient_id: userId } },
    { name: "events", filter: { patient_id: userId } },
    { name: "observations", filter: { patient_id: userId } },
    { name: "care_circle", filter: { patient_id: userId } },
    { name: "followups", filter: { patient_id: userId } },
    { name: "conditions", filter: { patient_id: userId } },
  ]

  for (const t of tables) {
    try {
      await pullTable(t.name, t.filter, lastSync)
      count.push(t.name)
    } catch (err) {
      errors.push({ entry: t.name, error: String(err) })
    }
  }

  // Grants: pull rows where user is patient or grantee
  try {
    let q = supabase
      .from("grants")
      .select("*")
      .or(`patient_id.eq.${userId},grantee_id.eq.${userId}`)
    if (lastSync) q = q.gte("updated_at", lastSync)
    const { data, error } = await q
    if (error) throw error
    if (data) for (const row of data) await insert("grants", row)
    count.push("grants")
  } catch (err) {
    errors.push({ entry: "grants", error: String(err) })
  }

  // medication_schedules: pull schedules for user's medications
  try {
    const meds = await queryAll<{ id: string }>("medications", {
      patient_id: userId,
    })
    if (meds.length > 0) {
      const medIds = meds.map((m) => m.id)
      const { data, error } = await supabase
        .from("medication_schedules")
        .select("*")
        .in("medication_id", medIds)
      if (error) throw error
      if (data)
        for (const row of data)
          await insert("medication_schedules", {
            ...row,
            times: JSON.stringify(row.times),
            days_of_week: JSON.stringify(row.days_of_week),
          })
    }
    count.push("medication_schedules")
  } catch (err) {
    errors.push({ entry: "medication_schedules", error: String(err) })
  }

  return { count: count.length, errors }
}

async function pullTable(
  table: string,
  where: Record<string, string>,
  lastSync?: string,
) {
  let query = supabase.from(table).select("*")
  for (const [k, v] of Object.entries(where)) {
    query = query.eq(k, v)
  }
  if (lastSync) query = query.gte("updated_at", lastSync)
  const { data, error } = await query
  if (error) throw error
  if (data) for (const row of data) await insert(table, row)
}

// ── SOS queue retry ───────────────────────────────────────────────────────────

async function retrySosQueue(userId: string) {
  try {
    const queue = await getPendingSosQueue()
    for (const item of queue) {
      if (item.patient_id !== userId) continue
      const location =
        item.location_lat != null && item.location_lon != null
          ? { lat: item.location_lat, lon: item.location_lon }
          : null
      const { error } = await supabase.from("sos_events").insert({
        id: item.id,
        patient_id: item.patient_id,
        sent_at: item.created_at,
        channel: item.channel,
        location: location ? JSON.stringify(location) : null,
        recipients: JSON.stringify(
          item.contacts.map((c) => c.member_id ?? c.phone).filter(Boolean),
        ),
        status: "queued_synced",
      })
      if (!error || error.code === "23505") {
        await markSosQueueSynced(item.id)
      }
    }
  } catch {
    // Non-fatal — next sync will retry
  }
}

// ── Notifications after sync ──────────────────────────────────────────────────

async function rescheduleNotifications(userId: string) {
  try {
    const meds = await queryAll<{ id: string; name: string }>("medications", {
      patient_id: userId,
    })
    const medMap = Object.fromEntries(meds.map((m) => [m.id, m.name]))

    const schedules = await rawQuery<{
      id: string
      medication_id: string
      times: string
      days_of_week: string
      active: number
    }>("SELECT * FROM medication_schedules WHERE active = 1")

    const formatted = schedules.map((s) => ({
      id: s.id,
      medicationName: medMap[s.medication_id] ?? "Medication",
      times: JSON.parse(s.times) as string[],
      days_of_week: JSON.parse(s.days_of_week) as number[],
      active: s.active === 1,
    }))

    await syncNotificationsFromSchedules(formatted)
  } catch {
    // Non-critical; next sync will retry
  }
}

// ── Realtime subscriptions ────────────────────────────────────────────────────

export function subscribeToRealtime(
  userId: string,
  onAlert: (data: unknown) => void,
  onGrantChange: (data: unknown) => void,
) {
  const alertsChannel = supabase
    .channel(`alerts:patient:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alerts",
        filter: `patient_id=eq.${userId}`,
      },
      (payload) => onAlert(payload.new),
    )
    .subscribe()

  const grantsChannel = supabase
    .channel(`grants:user:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "grants",
        filter: `grantee_id=eq.${userId}`,
      },
      (payload) => onGrantChange(payload.new ?? payload.old),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(alertsChannel)
    supabase.removeChannel(grantsChannel)
  }
}

export function setupNetworkSync(deviceId: string) {
  return async () => {
    const result = await syncData(deviceId)
    console.log("[sync]", result)
    return result
  }
}
