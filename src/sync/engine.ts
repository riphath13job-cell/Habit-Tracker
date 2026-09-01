// Pure, side-effect-free sync engine. No react-native / no network imports so it
// can be unit-tested in plain Node.
//
// A "keyed bundle" is an exportBundle where every row carries a stable global key
// (__k) and a last-write timestamp (__u); FK columns are rewritten to the
// referenced row's key. mergeKeyed() produces a canonical keyed bundle
// (newest-edit-wins per key, tombstones applied). serializeKeyed() rebuilds a
// plain bundle with fresh sequential local ids and FK columns restored to them.

export interface KeyedRow {
  [col: string]: unknown;
  __k: string;
  __u: number;
}

export type KeyedBundle = Record<string, KeyedRow[]>;
export type Tombstones = Record<string, number>; // key -> deleted_at(ms)

export type KeyMode = 'int' | 'value' | 'single' | 'composite';

export interface TableSpec {
  bundle: string; // field name in the export bundle
  pk: string; // primary-key column (for 'composite' this is informational)
  fks?: { cols: string[]; ref: string }[];
  keyMode?: KeyMode;
  /** composite tables derive their key from referenced parents (e.g. goal_habits) */
  compositeRefs?: { col: string; ref: string }[];
}

export const TABLE_SPECS: TableSpec[] = [
  { bundle: 'habits', pk: 'id' },
  { bundle: 'completions', pk: 'id', fks: [{ cols: ['habit_id'], ref: 'habits' }] },
  { bundle: 'notes', pk: 'id' },
  { bundle: 'collections', pk: 'id' },
  { bundle: 'todos', pk: 'id', fks: [{ cols: ['collection_id'], ref: 'collections' }] },
  { bundle: 'exercises', pk: 'id' },
  { bundle: 'workouts', pk: 'id' },
  {
    bundle: 'workout_exercises',
    pk: 'id',
    fks: [
      { cols: ['workout_id'], ref: 'workouts' },
      { cols: ['exercise_id'], ref: 'exercises' },
    ],
  },
  { bundle: 'sets', pk: 'id', fks: [{ cols: ['workout_exercise_id'], ref: 'workout_exercises' }] },
  { bundle: 'routines', pk: 'id' },
  {
    bundle: 'routine_items',
    pk: 'id',
    fks: [
      { cols: ['routine_id'], ref: 'routines' },
      { cols: ['exercise_id'], ref: 'exercises' },
    ],
  },
  { bundle: 'body_entries', pk: 'id' },
  { bundle: 'fitness_prefs', pk: 'id', keyMode: 'single' },
  { bundle: 'sleep_entries', pk: 'id' },
  { bundle: 'sleep_prefs', pk: 'id', keyMode: 'single' },
  { bundle: 'dream_entries', pk: 'id' },
  { bundle: 'lucid_prefs', pk: 'id', keyMode: 'single' },
  { bundle: 'game_scores', pk: 'game', keyMode: 'value' },
  { bundle: 'app_prefs', pk: 'key', keyMode: 'value' },
  { bundle: 'daily_routines', pk: 'id' },
  { bundle: 'daily_routine_items', pk: 'id', fks: [{ cols: ['routine_id'], ref: 'daily_routines' }] },
  {
    bundle: 'daily_routine_completions',
    pk: 'id',
    fks: [{ cols: ['item_id'], ref: 'daily_routine_items' }],
  },
  { bundle: 'books', pk: 'id' },
  { bundle: 'book_notes', pk: 'id', fks: [{ cols: ['book_id'], ref: 'books' }] },
  { bundle: 'links', pk: 'id' },
  { bundle: 'water_logs', pk: 'id' },
  { bundle: 'water_prefs', pk: 'id', keyMode: 'single' },
  { bundle: 'goals', pk: 'id' },
  {
    bundle: 'goal_habits',
    pk: 'goal_id',
    keyMode: 'composite',
    compositeRefs: [
      { col: 'goal_id', ref: 'goals' },
      { col: 'habit_id', ref: 'habits' },
    ],
  },
  { bundle: 'focus_sessions', pk: 'id' },
  { bundle: 'focus_prefs', pk: 'id', keyMode: 'single' },
  { bundle: 'mood_entries', pk: 'id' },
  { bundle: 'transactions', pk: 'id' },
  { bundle: 'budget_prefs', pk: 'id', keyMode: 'single' },
];

const SPEC_BY_BUNDLE: Record<string, TableSpec> = Object.fromEntries(
  TABLE_SPECS.map((s) => [s.bundle, s]),
);

/** Keys that live in app_prefs but must never sync (local bookkeeping). */
export const APP_PREFS_SKIP = new Set([
  'sync_last_pull_at',
  'sync_last_push_at',
  'sync_device_id',
  'sync_enabled',
]);

function rowTime(spec: TableSpec, row: Record<string, unknown>): number {
  return (row.updated_at as number) ?? (row.created_at as number) ?? 0;
}

/** Internal: map from per-bundle lineage key -> stable key. */
type Lineage = Record<string, string>;

/**
 * Turn a plain export bundle into a keyed bundle. `lineage` (persistent across
 * syncs on this device) maps "bundle:localPk" -> stable key so a row keeps its
 * key forever. New rows get a freshly minted stable key. `deviceId` prefixes
 * integer-id keys so ids never collide across devices.
 */
export function keyBundle(
  bundle: Record<string, unknown[]>,
  lineage: Lineage,
  deviceId: string,
): { keyed: KeyedBundle; lineage: Lineage } {
  const keyed: KeyedBundle = {};
  const outLineage: Lineage = { ...lineage };

  // Precompute pk->key for every table first, so composite keys and fk rewrite
  // can reference them regardless of TABLE_SPECS order.
  const bundlePkToKey: Record<string, Map<string, string>> = {};
  for (const spec of TABLE_SPECS) {
    const rows = (bundle[spec.bundle] as Record<string, unknown>[]) ?? [];
    const map = new Map<string, string>();
    for (const row of rows) {
      const localPk = String(row[spec.pk]);
      const lineageId = `${spec.bundle}:${localPk}`;
      let key = outLineage[lineageId];
      if (key) {
        map.set(localPk, key);
        continue;
      }
      if (spec.keyMode === 'value') {
        key = `${spec.bundle}:${localPk}`;
      } else if (spec.keyMode === 'single') {
        key = `${spec.bundle}:single`;
      } else {
        key = `${spec.bundle}:${deviceId}-${localPk}`;
      }
      outLineage[lineageId] = key;
      map.set(localPk, key);
    }
    bundlePkToKey[spec.bundle] = map;
  }

  for (const spec of TABLE_SPECS) {
    const rows = (bundle[spec.bundle] as Record<string, unknown>[]) ?? [];
    const out: KeyedRow[] = [];

    for (const row of rows) {
      const pkMap = bundlePkToKey[spec.bundle]!;
      let key: string;
      if (spec.keyMode === 'composite') {
        // key from referenced parents' stable keys -> identical across devices
        const parts = (spec.compositeRefs ?? []).map((c) => {
          const v = String(row[c.col]);
          return bundlePkToKey[c.ref]?.get(v) ?? `${c.ref}:missing:${v}`;
        });
        key = `${spec.bundle}:${parts.join(':')}`;
      } else {
        key = pkMap.get(String(row[spec.pk]))!;
      }

      // strip app_prefs bookkeeping keys
      if (spec.bundle === 'app_prefs' && APP_PREFS_SKIP.has(String(row['key']))) continue;

      const fkR = { ...row };
      // rewrite FK columns to referenced keys
      if (spec.fks) {
        for (const fk of spec.fks) {
          const parentMap = bundlePkToKey[fk.ref];
          if (!parentMap) continue;
          for (const col of fk.cols) {
            const v = fkR[col];
            if (v != null) fkR[col] = parentMap.get(String(v)) ?? fkR[col];
          }
        }
      }

      out.push({
        ...fkR,
        __k: key,
        __u: rowTime(spec, row),
      });
    }
    keyed[spec.bundle] = out;
  }

  return { keyed, lineage: outLineage };
}

/**
 * Merge a local keyed bundle with a remote keyed bundle + tombstones.
 * Newest-edit-wins per key. Returns canonical keyed bundle + merged tombstones.
 */
export function mergeKeyed(
  local: KeyedBundle,
  remote: KeyedBundle,
  tombstones: Tombstones,
): { canonical: KeyedBundle; tombstones: Tombstones } {
  const canonical: KeyedBundle = {};
  const outTomb: Tombstones = { ...tombstones };

  for (const spec of TABLE_SPECS) {
    const map = new Map<string, KeyedRow>();
    for (const r of local[spec.bundle] ?? []) map.set(r.__k, r);
    for (const r of remote[spec.bundle] ?? []) {
      const existing = map.get(r.__k);
      if (!existing || (r.__u ?? 0) >= (existing.__u ?? 0)) map.set(r.__k, r);
    }
    const rows: KeyedRow[] = [];
    for (const [k, row] of map) {
      const deletedAt = outTomb[k];
      if (deletedAt !== undefined && deletedAt >= (row.__u ?? 0)) continue;
      rows.push(row);
    }
    canonical[spec.bundle] = rows;
  }

  for (const spec of TABLE_SPECS) {
    for (const r of canonical[spec.bundle] ?? []) {
      const d = outTomb[r.__k];
      if (d !== undefined && d < (r.__u ?? 0)) delete outTomb[r.__k];
    }
  }

  return { canonical, tombstones: outTomb };
}

/**
 * Serialize a canonical keyed bundle into a plain export bundle with fresh
 * sequential local ids and FK columns restored to those ids. Returns the bundle
 * plus a lineage mapping "bundle:newLocalPk" -> stable key.
 */
export function serializeKeyed(
  canonical: KeyedBundle,
): { bundle: Record<string, unknown[]>; lineage: Lineage } {
  const bundle: Record<string, unknown[]> = {};
  const lineage: Lineage = {};
  const keyToId: Record<string, Map<string, number>> = {} as Record<string, Map<string, number>>;

  for (const spec of TABLE_SPECS) {
    const keyMap = new Map<string, number>();
    const rows: unknown[] = [];
    let next = 1;
    for (const r of canonical[spec.bundle] ?? []) {
      const key = r.__k as string;
      const row: Record<string, unknown> = { ...r };
      delete row.__k;
      delete row.__u;
      delete row.__d;

      if (spec.keyMode !== 'composite') {
        const newId = next++;
        row[spec.pk] = newId;
        keyMap.set(key, newId);
        lineage[`${spec.bundle}:${String(newId)}`] = key;
      } else {
        // composite rows get no synthetic id; their fk columns are remapped below
      }
      rows.push(row);
    }
    keyToId[spec.bundle] = keyMap;
    bundle[spec.bundle] = rows;
  }

  // restore FK columns: value is a key -> referenced bundle's new id
  for (const spec of TABLE_SPECS) {
    if (!spec.fks) continue;
    for (const row of bundle[spec.bundle] as Record<string, unknown>[]) {
      for (const fk of spec.fks) {
        const refMap = keyToId[fk.ref] ?? new Map<string, number>();
        for (const col of fk.cols) {
          const v = row[col];
          if (typeof v === 'string') row[col] = refMap.get(v) ?? null;
        }
      }
    }
  }

  return { bundle, lineage };
}
