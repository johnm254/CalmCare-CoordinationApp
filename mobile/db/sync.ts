/**
 * Offline-first sync engine
 * Orchestrates outbox push and pull of remote changes
 */

import { supabase } from '../lib/supabase';
import {
  getUnsyncedEntries,
  markSynced,
  updateSyncState,
  getSyncState,
  queryAll,
  insert,
  update,
} from './offline';
import { v4 as uuidv4 } from 'uuid';

export interface SyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  errors: Array<{ entry: string; error: string }>;
  lastSync: string;
}

const SYNC_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

// Main sync function
export async function syncData(deviceId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    pushedCount: 0,
    pulledCount: 0,
    errors: [],
    lastSync: new Date().toISOString(),
  };

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Step 1: Push outbox entries
    const pushResult = await pushOutbox(user.id);
    result.pushedCount = pushResult.successful;
    result.errors.push(...pushResult.errors);

    // Step 2: Pull remote changes
    const pullResult = await pullChanges(user.id, deviceId);
    result.pulledCount = pullResult.count;
    result.errors.push(...pullResult.errors);

    // Step 3: Update sync state
    const newSyncToken = new Date().toISOString();
    await updateSyncState(deviceId, newSyncToken, result.lastSync);

    return result;
  } catch (error) {
    console.error('Sync error:', error);
    return {
      ...result,
      success: false,
      errors: [{ entry: 'sync', error: String(error) }],
    };
  }
}

// Push outbox to server
async function pushOutbox(userId: string) {
  const successful = [];
  const errors: Array<{ entry: string; error: string }> = [];

  try {
    const entries = await getUnsyncedEntries();

    for (const entry of entries) {
      try {
        await pushEntry(userId, entry);
        await markSynced(entry.id);
        successful.push(entry.id);
      } catch (error) {
        console.error(`Failed to sync outbox entry ${entry.id}:`, error);
        errors.push({
          entry: entry.id,
          error: String(error),
        });
      }
    }
  } catch (error) {
    console.error('Error getting unsynced entries:', error);
    errors.push({
      entry: 'outbox',
      error: String(error),
    });
  }

  return { successful: successful.length, errors };
}

// Push single outbox entry
async function pushEntry(userId: string, entry: any) {
  switch (entry.operation) {
    case 'insert':
      await pushInsert(userId, entry);
      break;
    case 'update':
      await pushUpdate(userId, entry);
      break;
    case 'delete':
      await pushDelete(userId, entry);
      break;
  }
}

async function pushInsert(userId: string, entry: any) {
  const { table_name, data } = entry;

  const { error } = await supabase
    .from(table_name)
    .insert([data])
    .select();

  if (error) {
    throw error;
  }
}

async function pushUpdate(userId: string, entry: any) {
  const { table_name, data } = entry;
  const { id, ...updateData } = data;

  const { error } = await supabase
    .from(table_name)
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) {
    throw error;
  }
}

async function pushDelete(userId: string, entry: any) {
  const { table_name, data } = entry;

  const { error } = await supabase
    .from(table_name)
    .delete()
    .eq('id', data.id);

  if (error) {
    throw error;
  }
}

// Pull remote changes
async function pullChanges(userId: string, deviceId: string) {
  const count = [];
  const errors: Array<{ entry: string; error: string }> = [];

  try {
    // Get last sync token
    const syncState = await getSyncState(deviceId);
    const lastSync = syncState?.last_sync;

    // Pull medications
    await pullTable('medications', { patient_id: userId }, lastSync);
    count.push('medications');

    // Pull medication logs
    await pullTable('medication_logs', { patient_id: userId }, lastSync);
    count.push('medication_logs');

    // Pull events
    await pullTable('events', { patient_id: userId }, lastSync);
    count.push('events');

    // Pull observations (if caregiver)
    await pullTable('observations', { patient_id: userId }, lastSync);
    count.push('observations');

    // Pull care circle
    await pullTable('care_circle', { patient_id: userId }, lastSync);
    count.push('care_circle');

    // Pull grants (for managing own access)
    const { data: grants } = await supabase
      .from('grants')
      .select('*')
      .or(`patient_id.eq.${userId},grantee_id.eq.${userId}`)
      .gte('updated_at', lastSync || '1970-01-01');

    if (grants) {
      for (const grant of grants) {
        await insert('grants', grant);
      }
    }
    count.push('grants');

    // Pull follow-ups
    await pullTable('followups', { patient_id: userId }, lastSync);
    count.push('followups');

    // Pull care circle members (for emergency alerts)
    const { data: circle } = await supabase
      .from('care_circle')
      .select('*')
      .eq('patient_id', userId);

    if (circle) {
      for (const member of circle) {
        await update('care_circle', member.id, member);
      }
    }

  } catch (error) {
    console.error('Error pulling changes:', error);
    errors.push({
      entry: 'pull',
      error: String(error),
    });
  }

  return { count: count.length, errors };
}

// Pull a single table
async function pullTable(
  table: string,
  where: Record<string, any> = {},
  lastSync?: string
) {
  let query = supabase.from(table).select('*');

  // Add where clauses
  for (const [key, value] of Object.entries(where)) {
    query = query.eq(key, value);
  }

  // Add timestamp filter if sync tracking exists
  if (lastSync && table !== 'care_circle') {
    query = query.gte('updated_at', lastSync);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  if (data) {
    for (const record of data) {
      // Upsert (insert or update)
      const existing = await queryAll(table, { id: record.id });
      if (existing.length > 0) {
        await update(table, record.id, record);
      } else {
        await insert(table, record);
      }
    }
  }
}

// Subscribe to real-time changes (for emergency alerts, grant revocations)
export function subscribeToRealtime(
  userId: string,
  onAlert: (data: any) => void,
  onGrantChange: (data: any) => void
) {
  // Subscribe to SOS events (emergency alerts)
  const sosChannel = supabase
    .channel(`sos:patient:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sos_events',
        filter: `recipients->>'0'=eq.${userId}`,
      },
      (payload) => {
        console.log('New SOS alert:', payload);
        onAlert(payload.new);
      }
    )
    .subscribe();

  // Subscribe to grant changes
  const grantsChannel = supabase
    .channel(`grants:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'grants',
        filter: `grantee_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Grant changed:', payload);
        onGrantChange(payload.new || payload.old);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(sosChannel);
    supabase.removeChannel(grantsChannel);
  };
}

// Detect network status and sync on reconnect
export function setupNetworkSync(deviceId: string) {
  // This would typically use react-native-netinfo
  // For now, we'll assume a manual trigger or periodic check

  // Could be called from app.tsx
  return async () => {
    try {
      const result = await syncData(deviceId);
      console.log('Sync completed:', result);
      return result;
    } catch (error) {
      console.error('Network sync failed:', error);
      throw error;
    }
  };
}

