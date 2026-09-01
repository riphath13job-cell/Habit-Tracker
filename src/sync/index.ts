import { exportBundle, importBundle, getSyncLineage, setSyncLineage, getSyncMeta, setSyncMeta } from '../db';
import { keyBundle, mergeKeyed, serializeKeyed, TABLE_SPECS, KeyedBundle, Tombstones, APP_PREFS_SKIP } from './engine';
import { pullRemote, pushRemote, registerDevice, setDeviceId, getDeviceId, getRemoteUpdatedAt } from './supabase';
import { SYNC_CONFIG } from './config';

let syncEnabled = false;

export function setSyncEnabled(v: boolean) { syncEnabled = v; }
export function isSyncEnabled() { return syncEnabled; }

async function generateDeviceId(): Promise<string> {
  let id = await getSyncMeta('device_id');
  if (!id) {
    id = `dev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    await setSyncMeta('device_id', id);
  }
  return id;
}

/** Full two-way sync. Returns { pulled, pushed, conflicts } stats. */
export async function syncNow(): Promise<{ pulled: boolean; pushed: boolean; updated: number }> {
  if (!syncEnabled) return { pulled: false, pushed: false, updated: 0 };

  const deviceId = await generateDeviceId();
  setDeviceId(deviceId);
  await registerDevice();

  const localLineage = await getSyncLineage();
  const localBundle = await exportBundle();
  const { keyed: localKeyed, lineage: updatedLineage } = keyBundle(localBundle as unknown as Record<string, unknown[]>, localLineage, deviceId);

  const remote = await pullRemote();
  if (!remote) {
    // first time — just push our bundle as canonical
    await pushRemote(localKeyed, updatedLineage, {});
    await setSyncLineage(updatedLineage);
    await setSyncMeta('last_push_at', new Date().toISOString());
    return { pulled: false, pushed: true, updated: 0 };
  }

  const { canonical, tombstones } = mergeKeyed(localKeyed, remote.doc, remote.tombstones);

  // serialize canonical -> fresh local bundle + lineage
  const { bundle: mergedBundle, lineage: newLineage } = serializeKeyed(canonical);

  // import into local DB (replaces all data)
  await importBundle(mergedBundle as unknown as import('../types').ExportBundle);

  // push merged state back
  await pushRemote(canonical, newLineage, tombstones);
  await setSyncLineage(newLineage);
  const now = new Date().toISOString();
  await setSyncMeta('last_pull_at', now);
  await setSyncMeta('last_push_at', now);

  // count changes: rows in canonical that differ from remote (rough heuristic)
  let updated = 0;
  for (const spec of TABLE_SPECS) {
    const canonicalKeys = new Set((canonical[spec.bundle] ?? []).map((r) => r.__k));
    const remoteKeys = new Set((remote.doc[spec.bundle] ?? []).map((r) => r.__k));
    for (const k of canonicalKeys) if (!remoteKeys.has(k)) updated++;
  }

  return { pulled: true, pushed: true, updated };
}

/** Quick check if remote has newer data. */
export async function hasRemoteChanges(): Promise<boolean> {
  if (!syncEnabled) return false;
  const deviceId = await generateDeviceId();
  setDeviceId(deviceId);
  const remoteAt = await getRemoteUpdatedAt();
  if (!remoteAt) return false;
  const localAt = await getSyncMeta('last_pull_at');
  return !localAt || remoteAt > localAt;
}

/** Initialize sync on app start: read stored enabled flag, device id. */
export async function initSync(): Promise<void> {
  const enabled = await getSyncMeta('sync_enabled');
  syncEnabled = enabled === '1';
  if (syncEnabled) {
    await generateDeviceId();
  }
}