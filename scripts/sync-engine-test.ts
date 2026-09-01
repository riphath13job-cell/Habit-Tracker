import { keyBundle, mergeKeyed, serializeKeyed, TABLE_SPECS } from '../src/sync/engine.ts';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    pass++;
    console.log('ok -', name);
  } else {
    fail++;
    console.error('FAIL -', name, detail === undefined ? '' : JSON.stringify(detail));
  }
}

// ---- Scenario 1: two devices create disjoint data, merge, FK remap ----
const aHabit = { id: 1, name: 'Read', emoji: '📖', color: '#000', schedule: 'daily', created_at: 1000 };
const bHabit = { id: 1, name: 'Run', emoji: '🏃', color: '#111', schedule: 'daily', created_at: 2000 };
const aComp = { id: 1, habit_id: 1, day: '2026-01-01' };

// Device A keys
const ka = keyBundle(
  { habits: [aHabit], completions: [aComp] },
  {},
  'devA',
).keyed;

// Device B keys
const kb = keyBundle({ habits: [bHabit] }, {}, 'devB').keyed;

const canon = mergeKeyed(ka, kb, {});
check('merge keeps both habits', canon.canonical.habits.length === 2, canon.canonical.habits);

const ser = serializeKeyed(canon.canonical);
check('serialize produces 2 habits', ser.bundle.habits.length === 2);

// The completion's FK should point at the habit whose stable key is habits:devA-1
const completionKey = ka.completions[0].__k;
const habitByKey = new Map(ser.bundle.habits.map((h: any) => [ser.lineage[`habits:${h.id}`], h.id]));
const resolvedHabitId = habitByKey.get('habits:devA-1');
check('completion kept', ser.bundle.completions.length === 1);
check('completion FK resolved to number', typeof ser.bundle.completions[0].habit_id === 'number', ser.bundle.completions[0]);
check('completion FK points at correct habit (habits:devA-1)', (ser.bundle.completions[0] as any).habit_id === resolvedHabitId, {
  fk: (ser.bundle.completions[0] as any).habit_id,
  resolvedHabitId,
});

// ---- Scenario 2: newest-edit-wins on same key ----
const oldRow = keyBundle({ habits: [{ id: 5, name: 'Old', created_at: 100 }] }, {}, 'devA').keyed;
const newRow = keyBundle({ habits: [{ id: 5, name: 'New', created_at: 9000 }] }, {}, 'devA').keyed;
const sameDevice = mergeKeyed(oldRow, newRow, {});
check('newest habit name wins', sameDevice.canonical.habits.length === 1 && sameDevice.canonical.habits[0].name === 'New');

// ---- Scenario 3: tombstone delete ----
const toDelete = keyBundle({ habits: [{ id: 9, name: 'Gone', created_at: 5000 }] }, {}, 'devA').keyed;
const keyToKill = toDelete.habits[0].__k;
const tomb: Record<string, number> = {};
tomb[keyToKill] = 6000; // deleted at 6000 after created 5000
const afterTomb = mergeKeyed(toDelete, { habits: [] }, tomb);
check('tombstoned row removed', afterTomb.canonical.habits.length === 0);

// ---- Scenario 4: goal_habits composite key aligns when parents share lineage ----
// Device A creates a goal + habit + join row.
const aGoalBundle = {
  goals: [{ id: 1, title: 'G', target_day: '2026-12-31', created_at: 100 }],
  habits: [{ id: 1, name: 'H', created_at: 100 }],
  goal_habits: [{ goal_id: 1, habit_id: 1 }],
};
const ka4 = keyBundle(aGoalBundle, {}, 'devA');
// Device B has already synced once (adopted A's lineage), so it reuses the same keys
// when it independently creates the same goal+habit+join.
const kb4 = keyBundle(aGoalBundle, ka4.lineage, 'devB');
const ghCanon = mergeKeyed(ka4.keyed, kb4.keyed, {});
check('goal_habits deduped to 1 row when shared lineage', ghCanon.canonical.goal_habits.length === 1, ghCanon.canonical.goal_habits);
const ghSer = serializeKeyed(ghCanon.canonical);
const ghRow = ghSer.bundle.goal_habits[0] as any;
check('goal_habits remaps goal_id+habit_id', typeof ghRow.goal_id === 'number' && typeof ghRow.habit_id === 'number', ghRow);
check('goal_habits goal_id points to real goal', ghSer.bundle.goals.some((g: any) => g.id === ghRow.goal_id));
check('goal_habits habit_id points to real habit', ghSer.bundle.habits.some((h: any) => h.id === ghRow.habit_id));

// Distinct lineages produce distinct join rows (genuinely different entities).
const aGhost = keyBundle(aGoalBundle, {}, 'devC');
const ghDistinct = mergeKeyed(aGhost.keyed, ka4.keyed, {});
check('distinct lineages keep separate goal_habits rows', ghDistinct.canonical.goal_habits.length === 2, ghDistinct.canonical.goal_habits);

// ---- Scenario 5: all bundle fields present in serialize ----
for (const spec of TABLE_SPECS) {
  check(`serialize has field ${spec.bundle}`, spec.bundle in ser.bundle);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
