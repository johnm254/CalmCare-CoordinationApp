// Offline DB stub — SQLite not included in this build
export async function initializeDB() {}
export async function insert(table: string, data: Record<string, unknown>) { return data; }
export async function update(table: string, id: string, data: Record<string, unknown>) { return data; }
export async function deleteRecord(_table: string, _id: string) {}
export async function queryOne(_table: string, _where?: Record<string, unknown>) { return null; }
export async function queryAll(_table: string, _where?: Record<string, unknown>) { return []; }
export async function getUnsyncedEntries() { return []; }
export async function markSynced(_id: string) {}
export async function getSyncState(_deviceId: string) { return null; }
export async function updateSyncState(_deviceId: string, _token?: string, _lastSync?: string) {}
export async function closeDB() {}
