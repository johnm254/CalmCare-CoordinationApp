// Offline SQLite layer using expo-sqlite v14 async API.
// CR-OFF-02: local DB is source of truth; every write goes here first.
// CR-OFF-06: encryption key stored in Keychain/Keystore via expo-secure-store.
//            SQLCipher requires a custom dev-client build; until then the DB
//            opens unencrypted and the key is reserved for the upgrade.

import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { CREATE_TABLES_SQL } from './schema';

const DB_NAME = 'duara.db';
const KEY_STORE_KEY = 'duara_db_key';

let _db: SQLite.SQLiteDatabase | null = null;

async function getOrCreateDbKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_STORE_KEY);
  if (!key) {
    key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Crypto.randomUUID(),
    );
    await SecureStore.setItemAsync(KEY_STORE_KEY, key);
  }
  return key;
}

export async function initializeDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  // Reserve the key for when SQLCipher is wired up (expo-sqlite/next + dev client).
  await getOrCreateDbKey();

  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync(CREATE_TABLES_SQL);
  return _db;
}

async function db(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  return initializeDB();
}

// ── Generic helpers ───────────────────────────────────────────────────────────

export async function insert(
  table: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const d = await db();
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map((k) => serializeValue(data[k]));
  await d.runAsync(
    `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
    values,
  );
  return data;
}

export async function update(
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const d = await db();
  const { id: _removed, ...rest } = data as Record<string, unknown>;
  const keys = Object.keys(rest);
  const setClauses = keys.map((k) => `${k} = ?`).join(', ');
  const values = [...keys.map((k) => serializeValue(rest[k])), id];
  await d.runAsync(`UPDATE ${table} SET ${setClauses} WHERE id = ?`, values);
  return data;
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const d = await db();
  await d.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

export async function queryOne<T = Record<string, unknown>>(
  table: string,
  where: Record<string, unknown> = {},
): Promise<T | null> {
  const d = await db();
  const keys = Object.keys(where);
  if (keys.length === 0) {
    return d.getFirstAsync<T>(`SELECT * FROM ${table} LIMIT 1`);
  }
  const clauses = keys.map((k) => `${k} = ?`).join(' AND ');
  const values = keys.map((k) => serializeValue(where[k]));
  return d.getFirstAsync<T>(`SELECT * FROM ${table} WHERE ${clauses} LIMIT 1`, values);
}

export async function queryAll<T = Record<string, unknown>>(
  table: string,
  where: Record<string, unknown> = {},
  orderBy?: string,
): Promise<T[]> {
  const d = await db();
  const keys = Object.keys(where);
  let sql = `SELECT * FROM ${table}`;
  const values: (string | number | null)[] = [];
  if (keys.length > 0) {
    sql += ` WHERE ${keys.map((k) => `${k} = ?`).join(' AND ')}`;
    values.push(...keys.map((k) => serializeValue(where[k])));
  }
  if (orderBy) sql += ` ORDER BY ${orderBy}`;
  return d.getAllAsync<T>(sql, values);
}

export async function rawQuery<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T[]> {
  const d = await db();
  return d.getAllAsync<T>(sql, params);
}

// ── Outbox ────────────────────────────────────────────────────────────────────

export async function enqueue(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: Record<string, unknown>,
): Promise<void> {
  const entry = {
    id: Crypto.randomUUID(),
    table_name: table,
    operation,
    data: JSON.stringify(data),
    synced: 0,
    created_at: new Date().toISOString(),
  };
  const d = await db();
  await d.runAsync(
    `INSERT INTO outbox (id, table_name, operation, data, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.table_name, entry.operation, entry.data, entry.synced, entry.created_at],
  );
}

export async function getUnsyncedEntries(): Promise<Array<{
  id: string; table_name: string; operation: string; data: Record<string, unknown>; created_at: string;
}>> {
  const d = await db();
  const rows = await d.getAllAsync<{ id: string; table_name: string; operation: string; data: string; created_at: string }>(
    `SELECT * FROM outbox WHERE synced = 0 ORDER BY created_at ASC LIMIT 100`,
  );
  return rows.map((r) => ({ ...r, data: JSON.parse(r.data) }));
}

export async function markSynced(id: string): Promise<void> {
  const d = await db();
  await d.runAsync(
    `UPDATE outbox SET synced = 1, synced_at = ? WHERE id = ?`,
    [new Date().toISOString(), id],
  );
}

export async function markOutboxError(id: string, error: string): Promise<void> {
  const d = await db();
  await d.runAsync(`UPDATE outbox SET error = ? WHERE id = ?`, [error, id]);
}

// ── Sync state ────────────────────────────────────────────────────────────────

export async function getSyncState(
  deviceId: string,
): Promise<{ last_sync?: string; sync_token?: string } | null> {
  const d = await db();
  return d.getFirstAsync(
    `SELECT last_sync, sync_token FROM sync_state WHERE device_id = ?`,
    [deviceId],
  );
}

export async function updateSyncState(
  deviceId: string,
  token?: string,
  lastSync?: string,
): Promise<void> {
  const d = await db();
  await d.runAsync(
    `INSERT INTO sync_state (id, device_id, last_sync, sync_token, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(device_id) DO UPDATE SET last_sync = excluded.last_sync, sync_token = excluded.sync_token`,
    [Crypto.randomUUID(), deviceId, lastSync ?? new Date().toISOString(), token ?? null, new Date().toISOString()],
  );
}

// ── Dose events (CR-MED-04) ───────────────────────────────────────────────────

export async function confirmDose(params: {
  medicationId: string;
  scheduleId: string | null;
  patientId: string;
  scheduledFor: string;
  confirmedVia: 'app' | 'strap' | 'caregiver';
  confirmedBy?: string;
}): Promise<{ success: boolean; alreadyTaken: boolean }> {
  const d = await db();

  // Check uniqueness before insert (mirrors the UNIQUE DB constraint)
  const existing = await d.getFirstAsync<{ id: string }>(
    `SELECT id FROM dose_events WHERE schedule_id IS ? AND scheduled_for = ? AND status = 'taken'`,
    [params.scheduleId, params.scheduledFor],
  );
  if (existing) return { success: false, alreadyTaken: true };

  const now = new Date().toISOString();
  const id = Crypto.randomUUID();
  try {
    await d.runAsync(
      `INSERT INTO dose_events
         (id, medication_id, schedule_id, patient_id, scheduled_for, status, confirmed_at, confirmed_via, confirmed_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'taken', ?, ?, ?, ?)`,
      [id, params.medicationId, params.scheduleId, params.patientId,
       params.scheduledFor, now, params.confirmedVia, params.confirmedBy ?? null, now],
    );
  } catch (e: unknown) {
    // UNIQUE constraint violation = already taken from another path
    if (String(e).includes('UNIQUE')) return { success: false, alreadyTaken: true };
    throw e;
  }

  await enqueue('dose_events', 'insert', {
    id, medication_id: params.medicationId, schedule_id: params.scheduleId,
    patient_id: params.patientId, scheduled_for: params.scheduledFor,
    status: 'taken', confirmed_at: now, confirmed_via: params.confirmedVia,
    confirmed_by: params.confirmedBy ?? null, created_at: now,
  });

  return { success: true, alreadyTaken: false };
}

// Returns today's pending dose slots by expanding schedules for the current day.
export async function getTodaysDoses(patientId: string): Promise<Array<{
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  scheduledFor: string;   // ISO datetime
  time: string;           // "HH:MM"
  status: 'pending' | 'taken' | 'snoozed' | 'missed';
}>> {
  const d = await db();
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const dateStr = today.toISOString().split('T')[0];

  const schedules = await d.getAllAsync<{
    schedule_id: string; medication_id: string; name: string; dose: string;
    times: string; days_of_week: string;
  }>(
    `SELECT ms.id as schedule_id, ms.medication_id, ms.times, ms.days_of_week,
            m.name, m.dose
     FROM medication_schedules ms
     JOIN medications m ON m.id = ms.medication_id
     WHERE m.patient_id = ? AND ms.active = 1 AND m.active = 1`,
    [patientId],
  );

  const results: Array<{
    scheduleId: string; medicationId: string; medicationName: string; dose: string;
    scheduledFor: string; time: string; status: 'pending' | 'taken' | 'snoozed' | 'missed';
  }> = [];

  for (const s of schedules) {
    const days: number[] = JSON.parse(s.days_of_week);
    if (!days.includes(dayOfWeek)) continue;

    const times: string[] = JSON.parse(s.times);
    for (const t of times) {
      const scheduledFor = `${dateStr}T${t}:00.000Z`;
      const event = await d.getFirstAsync<{ status: string }>(
        `SELECT status FROM dose_events WHERE schedule_id = ? AND scheduled_for = ? LIMIT 1`,
        [s.schedule_id, scheduledFor],
      );
      results.push({
        scheduleId: s.schedule_id,
        medicationId: s.medication_id,
        medicationName: s.name,
        dose: s.dose,
        scheduledFor,
        time: t,
        status: (event?.status as 'taken' | 'snoozed' | 'missed') ?? 'pending',
      });
    }
  }

  return results.sort((a, b) => a.time.localeCompare(b.time));
}

// Adherence % for a medication over the last N days.
export async function getAdherence(
  patientId: string,
  medicationId: string,
  days = 30,
): Promise<number> {
  const d = await db();
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const row = await d.getFirstAsync<{ total: number; taken: number }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken
     FROM dose_events
     WHERE patient_id = ? AND medication_id = ? AND scheduled_for >= ?`,
    [patientId, medicationId, since],
  );
  if (!row || row.total === 0) return 0;
  return Math.round((row.taken / row.total) * 100);
}

// ── SOS offline queue (CR-SOS-04) ────────────────────────────────────────────

export async function enqueueSosOffline(params: {
  patientId: string;
  contacts: Array<{ id: string; member_id: string | undefined; phone: string | null; full_name: string }>;
  location: { lat: number; lon: number } | null;
  channel: 'sms' | 'queued';
}): Promise<string> {
  const id = Crypto.randomUUID();
  const d = await db();
  await d.runAsync(
    `INSERT INTO sos_queue (id, patient_id, contacts, location_lat, location_lon, channel, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, params.patientId, JSON.stringify(params.contacts),
     params.location?.lat ?? null, params.location?.lon ?? null,
     params.channel, new Date().toISOString()],
  );
  // Also log to sos_events for the server to know about when online
  await d.runAsync(
    `INSERT OR IGNORE INTO sos_events (id, patient_id, sent_at, channel, location, recipients, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)`,
    [id, params.patientId, new Date().toISOString(), params.channel,
     params.location ? JSON.stringify(params.location) : null,
     JSON.stringify(params.contacts.map((c) => c.member_id ?? c.phone).filter(Boolean)),
     new Date().toISOString()],
  );
  await enqueue('sos_events', 'insert', {
    id, patient_id: params.patientId, sent_at: new Date().toISOString(),
    channel: params.channel,
    location: params.location ? JSON.stringify(params.location) : null,
    recipients: JSON.stringify(params.contacts.map((c) => c.member_id ?? c.phone).filter(Boolean)),
    status: 'queued', created_at: new Date().toISOString(),
  });
  return id;
}

export async function getPendingSosQueue(): Promise<Array<{
  id: string; patient_id: string;
  contacts: Array<{ id: string; member_id: string | undefined; phone: string | null; full_name: string }>;
  location_lat: number | null; location_lon: number | null;
  channel: string; created_at: string;
}>> {
  const d = await db();
  const rows = await d.getAllAsync<{
    id: string; patient_id: string; contacts: string;
    location_lat: number | null; location_lon: number | null;
    channel: string; created_at: string;
  }>(`SELECT * FROM sos_queue WHERE synced = 0 ORDER BY created_at ASC`);
  return rows.map((r) => ({ ...r, contacts: JSON.parse(r.contacts) }));
}

export async function markSosQueueSynced(id: string): Promise<void> {
  const d = await db();
  await d.runAsync(`UPDATE sos_queue SET synced = 1, synced_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function serializeValue(v: unknown): string | number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return JSON.stringify(v);
  return v as string | number;
}

export async function closeDB(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}
