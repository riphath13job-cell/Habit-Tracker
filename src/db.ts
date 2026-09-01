import * as SQLite from 'expo-sqlite';
import type {
  AiMessage,
  AppPref,
  Book,
  BookNote,
  BookStatus,
  BodyEntry,
  Completion,
  DailyRoutine,
  DailyRoutineCompletion,
  DailyRoutineItem,
  Exercise,
  ExportBundle,
  FitnessPrefs,
  Goal,
  GoalHabit,
  Habit,
  Note,
  Routine,
  RoutineItem,
  SetEntry,
  SleepEntry,
  SleepPrefs,
  DreamEntry,
  LucidPrefs,
  GameScore,
  LinkCategory,
  LinkItem,
  Todo,
  TodoCollection,
  WaterLog,
  WaterPrefs,
  Workout,
  WorkoutExercise,
  FocusSession,
  FocusPrefs,
  MoodEntry,
  Transaction,
  BudgetPrefs,
  Product,
  Customer,
  Sale,
  SaleStatus,
} from './types';
import { EXERCISE_LIBRARY } from './fitness/exercise-library';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('habits.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS habits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          emoji TEXT NOT NULL DEFAULT '✅',
          color TEXT NOT NULL DEFAULT '#4F46E5',
          schedule TEXT NOT NULL DEFAULT 'daily',
          reminder_minutes INTEGER,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS completions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          habit_id INTEGER NOT NULL,
          day TEXT NOT NULL,
          UNIQUE (habit_id, day)
        );
        CREATE INDEX IF NOT EXISTS idx_completions_day ON completions (day);
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL DEFAULT '',
          body TEXT NOT NULL DEFAULT '',
          favorite INTEGER NOT NULL DEFAULT 0,
          deleted_at INTEGER,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS todo_collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          emoji TEXT NOT NULL DEFAULT '📋',
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS todos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          collection_id INTEGER,
          title TEXT NOT NULL,
          done INTEGER NOT NULL DEFAULT 0,
          due_at INTEGER,
          remind_at INTEGER,
          notification_id TEXT,
          created_at INTEGER NOT NULL,
          completed_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE,
          name TEXT NOT NULL,
          muscle TEXT NOT NULL,
          tip TEXT NOT NULL DEFAULT '',
          is_custom INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS workouts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT '',
          started_at INTEGER NOT NULL,
          ended_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS workout_exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workout_id INTEGER NOT NULL,
          exercise_id INTEGER NOT NULL,
          exercise_name TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workout_exercise_id INTEGER NOT NULL,
          position INTEGER NOT NULL,
          reps INTEGER,
          weight REAL,
          done INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS routines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS routine_exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          routine_id INTEGER NOT NULL,
          exercise_id INTEGER NOT NULL,
          exercise_name TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL,
          target_sets INTEGER NOT NULL DEFAULT 3,
          target_reps INTEGER NOT NULL DEFAULT 10
        );
        CREATE TABLE IF NOT EXISTS body_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric TEXT NOT NULL,
          value REAL NOT NULL,
          day TEXT NOT NULL,
          UNIQUE (metric, day)
        );
        CREATE TABLE IF NOT EXISTS fitness_prefs (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          reminder_minutes INTEGER,
          days TEXT NOT NULL DEFAULT '1,3,5',
          notification_id TEXT
        );
        CREATE TABLE IF NOT EXISTS sleep_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          day TEXT NOT NULL UNIQUE,
          bed_minutes INTEGER NOT NULL,
          wake_minutes INTEGER NOT NULL,
          quality INTEGER
        );
        CREATE TABLE IF NOT EXISTS sleep_prefs (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          goal_minutes INTEGER NOT NULL DEFAULT 480,
          reminder_minutes INTEGER,
          notification_id TEXT
        );
        CREATE TABLE IF NOT EXISTS dream_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          day TEXT NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          body TEXT NOT NULL DEFAULT '',
          lucid INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_dream_entries_day ON dream_entries (day);
        CREATE TABLE IF NOT EXISTS lucid_prefs (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          rc_per_day INTEGER NOT NULL DEFAULT 0,
          notification_id TEXT
        );
        CREATE TABLE IF NOT EXISTS game_scores (
          game TEXT PRIMARY KEY NOT NULL,
          best INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS app_prefs (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS daily_routines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          emoji TEXT NOT NULL DEFAULT '🔁',
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS daily_routine_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          routine_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          position INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS daily_routine_completions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          day TEXT NOT NULL,
          UNIQUE (item_id, day)
        );
        CREATE INDEX IF NOT EXISTS idx_drc_day ON daily_routine_completions (day);
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'wishlist',
          cover_uri TEXT,
          total_pages INTEGER,
          pages_read INTEGER NOT NULL DEFAULT 0,
          buy_url TEXT,
          rating INTEGER,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          finished_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_books_status ON books (status);
        CREATE TABLE IF NOT EXISTS book_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          body TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_book_notes_book ON book_notes (book_id);
        CREATE TABLE IF NOT EXISTS links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          category TEXT NOT NULL DEFAULT 'other',
          note TEXT NOT NULL DEFAULT '',
          favorite INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_links_category ON links (category);
        CREATE TABLE IF NOT EXISTS water_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          day TEXT NOT NULL,
          ml INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_water_logs_day ON water_logs (day);
        CREATE TABLE IF NOT EXISTS water_prefs (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          target_ml INTEGER NOT NULL DEFAULT 2500,
          reminder_start INTEGER,
          reminder_end INTEGER,
          reminder_interval INTEGER,
          notification_id TEXT
        );
        CREATE TABLE IF NOT EXISTS goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          target_day TEXT NOT NULL,
          sphere TEXT NOT NULL DEFAULT 'body',
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS goal_habits (
          goal_id INTEGER NOT NULL,
          habit_id INTEGER NOT NULL,
          PRIMARY KEY (goal_id, habit_id)
        );
        CREATE TABLE IF NOT EXISTS ai_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ai_usage (
          day TEXT PRIMARY KEY,
          prompt_tokens INTEGER NOT NULL DEFAULT 0,
          completion_tokens INTEGER NOT NULL DEFAULT 0,
          requests INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS focus_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          started_at INTEGER NOT NULL,
          ended_at INTEGER NOT NULL,
          target_minutes INTEGER NOT NULL DEFAULT 25,
          focus_minutes INTEGER NOT NULL DEFAULT 0,
          tag TEXT NOT NULL DEFAULT '',
          completed INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_focus_sessions_started ON focus_sessions (started_at);
        CREATE TABLE IF NOT EXISTS focus_prefs (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          work_minutes INTEGER NOT NULL DEFAULT 25,
          short_break INTEGER NOT NULL DEFAULT 5,
          long_break INTEGER NOT NULL DEFAULT 15,
          sessions_before_long INTEGER NOT NULL DEFAULT 4,
          notify_on_end INTEGER NOT NULL DEFAULT 1,
          notification_id TEXT
        );
        CREATE TABLE IF NOT EXISTS mood_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          day TEXT NOT NULL UNIQUE,
          mood INTEGER NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount_cents INTEGER NOT NULL,
          category TEXT NOT NULL DEFAULT 'other',
          note TEXT NOT NULL DEFAULT '',
          day TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_transactions_day ON transactions (day);
        CREATE TABLE IF NOT EXISTS budget_prefs (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          monthly_budget_cents INTEGER
        );
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          cost_per_unit_cents INTEGER NOT NULL DEFAULT 0,
          sell_per_unit_cents INTEGER NOT NULL DEFAULT 0,
          quantity_on_hand INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          contact TEXT NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          product_id INTEGER,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price_cents INTEGER NOT NULL DEFAULT 0,
          total_cents INTEGER NOT NULL DEFAULT 0,
          day TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'unpaid',
          paid_cents INTEGER NOT NULL DEFAULT 0,
          reorder_when_quantity INTEGER,
          notes TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales (customer_id);
        CREATE INDEX IF NOT EXISTS idx_sales_day ON sales (day);
        CREATE TABLE IF NOT EXISTS sync_lineage (
          lookup TEXT PRIMARY KEY,
          key TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sync_meta (
          name TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      // Columns added after the first release — safe to re-run (errors ignored).
      try {
        await db.execAsync('ALTER TABLE notes ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0');
      } catch { /* column exists */ }
      try {
        await db.execAsync('ALTER TABLE notes ADD COLUMN deleted_at INTEGER');
      } catch { /* column exists */ }
      try {
        await db.execAsync('ALTER TABLE habits ADD COLUMN notification_id TEXT');
      } catch { /* column exists */ }
      try {
        await db.execAsync('ALTER TABLE habits ADD COLUMN sphere TEXT');
      } catch { /* column exists */ }
      for (const ex of EXERCISE_LIBRARY) {
        await db.runAsync(
          `INSERT OR IGNORE INTO exercises (key, name, muscle, tip, is_custom, created_at)
           VALUES (?, ?, ?, ?, 0, ?)`,
          [ex.key, ex.name, ex.muscle, ex.tip, Date.now()],
        );
      }
      return db;
    })();
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export async function listHabits(): Promise<Habit[]> {
  const db = await getDb();
  return db.getAllAsync<Habit>('SELECT * FROM habits ORDER BY created_at ASC');
}

export async function createHabit(input: Omit<Habit, 'id'>): Promise<Habit> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO habits (name, emoji, color, schedule, reminder_minutes, created_at, sphere)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.name, input.emoji, input.color, input.schedule, input.reminder_minutes, input.created_at, input.sphere ?? null],
  );
  return { ...input, id: Number(result.lastInsertRowId) };
}

export async function updateHabit(habit: Habit): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE habits SET name = ?, emoji = ?, color = ?, schedule = ?, reminder_minutes = ?, sphere = ?
     WHERE id = ?`,
    [habit.name, habit.emoji, habit.color, habit.schedule, habit.reminder_minutes, habit.sphere ?? null, habit.id],
  );
}

export async function setHabitNotificationId(id: number, notificationId: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE habits SET notification_id = ? WHERE id = ?', [notificationId, id]);
}

export async function deleteHabit(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM goal_habits WHERE habit_id = ?', [id]);
  await db.runAsync('DELETE FROM completions WHERE habit_id = ?', [id]);
  await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
}

export async function completionsFor(habitId: number): Promise<Completion[]> {
  const db = await getDb();
  return db.getAllAsync<Completion>('SELECT * FROM completions WHERE habit_id = ?', [habitId]);
}

export async function completionsBetween(fromDay: string, toDay: string): Promise<Completion[]> {
  const db = await getDb();
  return db.getAllAsync<Completion>(
    'SELECT * FROM completions WHERE day >= ? AND day <= ?',
    [fromDay, toDay],
  );
}

export async function allCompletions(): Promise<Completion[]> {
  const db = await getDb();
  return db.getAllAsync<Completion>('SELECT * FROM completions');
}

/** Complete today if not yet done, otherwise undo today's completion. */
export async function toggleCompletion(habitId: number, day: string): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM completions WHERE habit_id = ? AND day = ?',
    [habitId, day],
  );
  if (existing) {
    await db.runAsync('DELETE FROM completions WHERE id = ?', [existing.id]);
  } else {
    await db.runAsync('INSERT INTO completions (habit_id, day) VALUES (?, ?)', [habitId, day]);
  }
}

export async function exportBundle(): Promise<ExportBundle> {
  const db = await getDb();
  const [
    habits,
    completions,
    notes,
    collections,
    todos,
    exercises,
    workouts,
    workoutExercises,
    sets,
    routines,
    routineItems,
    bodyEntries,
    fitnessPrefs,
    sleepEntries,
    sleepPrefs,
    dreamEntries,
    lucidPrefs,
    gameScores,
    appPrefs,
    dailyRoutines,
    dailyRoutineItems,
    dailyRoutineCompletions,
    books,
    bookNotes,
    links,
    waterLogs,
    waterPrefs,
    goals,
    goalHabits,
    focusSessions,
    focusPrefs,
    moodEntries,
    allTransactions,
    budgetPrefs,
    products,
    customers,
    sales,
  ] = await Promise.all([
    listHabits(),
    allCompletions(),
    db.getAllAsync<Note>('SELECT * FROM notes'),
    listCollections(),
    listAllTodos(),
    db.getAllAsync<Exercise>('SELECT * FROM exercises'),
    db.getAllAsync<Workout>('SELECT * FROM workouts'),
    db.getAllAsync<WorkoutExercise>('SELECT * FROM workout_exercises'),
    db.getAllAsync<SetEntry>('SELECT * FROM sets'),
    db.getAllAsync<Routine>('SELECT * FROM routines'),
    db.getAllAsync<RoutineItem>('SELECT * FROM routine_exercises'),
    db.getAllAsync<BodyEntry>('SELECT * FROM body_entries'),
    db.getAllAsync<FitnessPrefs>('SELECT * FROM fitness_prefs'),
    db.getAllAsync<SleepEntry>('SELECT * FROM sleep_entries'),
    db.getAllAsync<SleepPrefs>('SELECT * FROM sleep_prefs'),
    db.getAllAsync<DreamEntry>('SELECT * FROM dream_entries'),
    db.getAllAsync<LucidPrefs>('SELECT * FROM lucid_prefs'),
    db.getAllAsync<GameScore>('SELECT * FROM game_scores'),
    db.getAllAsync<AppPref>('SELECT * FROM app_prefs'),
    db.getAllAsync<DailyRoutine>('SELECT * FROM daily_routines'),
    db.getAllAsync<DailyRoutineItem>('SELECT * FROM daily_routine_items'),
    db.getAllAsync<DailyRoutineCompletion>('SELECT * FROM daily_routine_completions'),
    db.getAllAsync<Book>('SELECT * FROM books'),
    db.getAllAsync<BookNote>('SELECT * FROM book_notes'),
    db.getAllAsync<LinkItem>('SELECT * FROM links'),
    db.getAllAsync<WaterLog>('SELECT * FROM water_logs'),
    db.getAllAsync<WaterPrefs>('SELECT * FROM water_prefs'),
    db.getAllAsync<Goal>('SELECT * FROM goals'),
    db.getAllAsync<GoalHabit>('SELECT * FROM goal_habits'),
    listFocusSessions(99999),
    db.getAllAsync<FocusPrefs>('SELECT * FROM focus_prefs'),
    db.getAllAsync<MoodEntry>('SELECT * FROM mood_entries'),
    db.getAllAsync<Transaction>('SELECT * FROM transactions'),
    db.getAllAsync<BudgetPrefs>('SELECT * FROM budget_prefs'),
    db.getAllAsync<Product>('SELECT * FROM products'),
    db.getAllAsync<Customer>('SELECT * FROM customers'),
    db.getAllAsync<Sale>('SELECT * FROM sales'),
  ]);
  return {
    format: 'habit-tracker-backup',
    version: 17,
    exported_at: new Date().toISOString(),
    habits,
    completions,
    notes,
    collections,
    todos,
    exercises,
    workouts,
    workout_exercises: workoutExercises,
    sets,
    routines,
    routine_items: routineItems,
    body_entries: bodyEntries,
    fitness_prefs: fitnessPrefs,
    sleep_entries: sleepEntries,
    sleep_prefs: sleepPrefs,
    dream_entries: dreamEntries,
    lucid_prefs: lucidPrefs,
    game_scores: gameScores,
    app_prefs: appPrefs,
    daily_routines: dailyRoutines,
    daily_routine_items: dailyRoutineItems,
    daily_routine_completions: dailyRoutineCompletions,
    books,
    book_notes: bookNotes,
    links,
    water_logs: waterLogs,
    water_prefs: waterPrefs,
    goals,
    goal_habits: goalHabits,
    focus_sessions: focusSessions,
    focus_prefs: focusPrefs,
    mood_entries: moodEntries,
    transactions: allTransactions,
    budget_prefs: budgetPrefs,
    products,
    customers,
    sales,
  };
}

/** Replaces everything in the database with the bundle's contents. */
export async function importBundle(bundle: ExportBundle): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('DELETE FROM completions');
    await tx.runAsync('DELETE FROM habits');
    await tx.runAsync('DELETE FROM notes');
    await tx.runAsync('DELETE FROM todos');
    await tx.runAsync('DELETE FROM todo_collections');
    await tx.runAsync('DELETE FROM sets');
    await tx.runAsync('DELETE FROM workout_exercises');
    await tx.runAsync('DELETE FROM workouts');
    await tx.runAsync('DELETE FROM routine_exercises');
    await tx.runAsync('DELETE FROM routines');
    await tx.runAsync('DELETE FROM exercises');
    await tx.runAsync('DELETE FROM body_entries');
    await tx.runAsync('DELETE FROM fitness_prefs');
    await tx.runAsync('DELETE FROM sleep_entries');
    await tx.runAsync('DELETE FROM sleep_prefs');
    await tx.runAsync('DELETE FROM dream_entries');
    await tx.runAsync('DELETE FROM lucid_prefs');
    await tx.runAsync('DELETE FROM game_scores');
    await tx.runAsync('DELETE FROM app_prefs');
    await tx.runAsync('DELETE FROM daily_routine_completions');
    await tx.runAsync('DELETE FROM daily_routine_items');
    await tx.runAsync('DELETE FROM daily_routines');
    await tx.runAsync('DELETE FROM book_notes');
    await tx.runAsync('DELETE FROM books');
    await tx.runAsync('DELETE FROM links');
    await tx.runAsync('DELETE FROM water_logs');
    await tx.runAsync('DELETE FROM water_prefs');
    await tx.runAsync('DELETE FROM goal_habits');
    await tx.runAsync('DELETE FROM goals');
    await tx.runAsync('DELETE FROM focus_sessions');
    await tx.runAsync('DELETE FROM focus_prefs');
    await tx.runAsync('DELETE FROM mood_entries');
    await tx.runAsync('DELETE FROM transactions');
    await tx.runAsync('DELETE FROM budget_prefs');
    await tx.runAsync('DELETE FROM products');
    await tx.runAsync('DELETE FROM customers');
    await tx.runAsync('DELETE FROM sales');
    for (const h of bundle.habits) {
      await tx.runAsync(
        `INSERT INTO habits (id, name, emoji, color, schedule, reminder_minutes, created_at, sphere)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [h.id, h.name, h.emoji ?? '✅', h.color ?? '#4F46E5', h.schedule ?? 'daily', h.reminder_minutes ?? null, h.created_at ?? Date.now(), (h as { sphere?: string }).sphere ?? null],
      );
    }
    for (const c of bundle.completions) {
      await tx.runAsync(
        'INSERT OR IGNORE INTO completions (habit_id, day) VALUES (?, ?)',
        [c.habit_id, c.day],
      );
    }
    for (const n of bundle.notes ?? []) {
      await tx.runAsync(
        `INSERT INTO notes (id, title, body, favorite, deleted_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [n.id, n.title ?? '', n.body ?? '', n.favorite ?? 0, n.deleted_at ?? null, n.created_at ?? Date.now(), n.updated_at ?? Date.now()],
      );
    }
    for (const col of bundle.collections ?? []) {
      await tx.runAsync(
        'INSERT INTO todo_collections (id, name, emoji, created_at) VALUES (?, ?, ?, ?)',
        [col.id, col.name, col.emoji ?? '📋', col.created_at ?? Date.now()],
      );
    }
    for (const t of bundle.todos ?? []) {
      await tx.runAsync(
        `INSERT INTO todos (id, collection_id, title, done, due_at, remind_at, notification_id, created_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.collection_id ?? null, t.title, t.done ?? 0, t.due_at ?? null, t.remind_at ?? null, null, t.created_at ?? Date.now(), t.completed_at ?? null],
      );
    }
    for (const e of bundle.exercises ?? []) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO exercises (id, key, name, muscle, tip, is_custom, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [e.id, e.key ?? null, e.name, e.muscle, e.tip ?? '', e.is_custom ?? 0, e.created_at ?? Date.now()],
      );
    }
    for (const w of bundle.workouts ?? []) {
      await tx.runAsync(
        'INSERT INTO workouts (id, name, notes, started_at, ended_at) VALUES (?, ?, ?, ?, ?)',
        [w.id, w.name ?? '', w.notes ?? '', w.started_at, w.ended_at ?? null],
      );
    }
    for (const we of bundle.workout_exercises ?? []) {
      await tx.runAsync(
        `INSERT INTO workout_exercises (id, workout_id, exercise_id, exercise_name, position)
         VALUES (?, ?, ?, ?, ?)`,
        [we.id, we.workout_id, we.exercise_id, we.exercise_name ?? '', we.position],
      );
    }
    for (const s of bundle.sets ?? []) {
      await tx.runAsync(
        `INSERT INTO sets (id, workout_exercise_id, position, reps, weight, done)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [s.id, s.workout_exercise_id, s.position, s.reps ?? null, s.weight ?? null, s.done ?? 0],
      );
    }
    for (const r of bundle.routines ?? []) {
      await tx.runAsync(
        'INSERT INTO routines (id, name, created_at) VALUES (?, ?, ?)',
        [r.id, r.name, r.created_at ?? Date.now()],
      );
    }
    for (const ri of bundle.routine_items ?? []) {
      await tx.runAsync(
        `INSERT INTO routine_exercises (id, routine_id, exercise_id, exercise_name, position, target_sets, target_reps)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ri.id, ri.routine_id, ri.exercise_id, ri.exercise_name ?? '', ri.position, ri.target_sets ?? 3, ri.target_reps ?? 10],
      );
    }
    for (const b of bundle.body_entries ?? []) {
      await tx.runAsync(
        'INSERT OR IGNORE INTO body_entries (id, metric, value, day) VALUES (?, ?, ?, ?)',
        [b.id, b.metric, b.value, b.day],
      );
    }
    for (const p of bundle.fitness_prefs ?? []) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO fitness_prefs (id, reminder_minutes, days, notification_id)
         VALUES (1, ?, ?, ?)`,
        [p.reminder_minutes ?? null, p.days ?? '1,3,5', null],
      );
    }
    for (const s of bundle.sleep_entries ?? []) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO sleep_entries (id, day, bed_minutes, wake_minutes, quality)
         VALUES (?, ?, ?, ?, ?)`,
        [s.id, s.day, s.bed_minutes, s.wake_minutes, s.quality ?? null],
      );
    }
    for (const p of bundle.sleep_prefs ?? []) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO sleep_prefs (id, goal_minutes, reminder_minutes, notification_id)
         VALUES (1, ?, ?, ?)`,
        [p.goal_minutes ?? 480, p.reminder_minutes ?? null, null],
      );
    }
    for (const d of bundle.dream_entries ?? []) {
      await tx.runAsync(
        `INSERT INTO dream_entries (id, day, title, body, lucid, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [d.id, d.day, d.title ?? '', d.body ?? '', d.lucid ?? 0, d.created_at ?? Date.now()],
      );
    }
    for (const p of bundle.lucid_prefs ?? []) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO lucid_prefs (id, rc_per_day, notification_id)
         VALUES (1, ?, ?)`,
        [p.rc_per_day ?? 0, null],
      );
    }
    for (const s of bundle.game_scores ?? []) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO game_scores (game, best) VALUES (?, ?)`,
        [s.game, s.best ?? 0],
      );
    }
    for (const p of bundle.app_prefs ?? []) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO app_prefs (key, value) VALUES (?, ?)`,
        [p.key, p.value],
      );
    }
    for (const r of bundle.daily_routines ?? []) {
      await tx.runAsync(
        'INSERT INTO daily_routines (id, name, emoji, created_at) VALUES (?, ?, ?, ?)',
        [r.id, r.name, r.emoji ?? '🔁', r.created_at ?? Date.now()],
      );
    }
    for (const it of bundle.daily_routine_items ?? []) {
      await tx.runAsync(
        `INSERT INTO daily_routine_items (id, routine_id, title, position, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [it.id, it.routine_id, it.title, it.position ?? 0, it.created_at ?? Date.now()],
      );
    }
    for (const c of bundle.daily_routine_completions ?? []) {
      await tx.runAsync(
        'INSERT OR IGNORE INTO daily_routine_completions (id, item_id, day) VALUES (?, ?, ?)',
        [c.id, c.item_id, c.day],
      );
    }
    for (const b of bundle.books ?? []) {
      await tx.runAsync(
        `INSERT INTO books (id, title, author, status, cover_uri, total_pages, pages_read, buy_url, rating, created_at, updated_at, finished_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.id,
          b.title ?? '',
          b.author ?? '',
          b.status ?? 'wishlist',
          b.cover_uri ?? null,
          b.total_pages ?? null,
          b.pages_read ?? 0,
          b.buy_url ?? null,
          b.rating ?? null,
          b.created_at ?? Date.now(),
          b.updated_at ?? Date.now(),
          b.finished_at ?? null,
        ],
      );
    }
    for (const n of bundle.book_notes ?? []) {
      await tx.runAsync(
        `INSERT INTO book_notes (id, book_id, title, body, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [n.id, n.book_id, n.title ?? '', n.body ?? '', n.created_at ?? Date.now(), n.updated_at ?? Date.now()],
      );
    }
    for (const l of bundle.links ?? []) {
      await tx.runAsync(
        `INSERT INTO links (id, url, title, category, note, favorite, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [l.id, l.url, l.title ?? '', l.category ?? 'other', l.note ?? '', l.favorite ?? 0, l.created_at ?? Date.now(), l.updated_at ?? Date.now()],
      );
    }
    for (const w of bundle.water_logs ?? []) {
      await tx.runAsync(
        `INSERT INTO water_logs (id, day, ml, created_at)
         VALUES (?, ?, ?, ?)`,
        [w.id, w.day, w.ml, w.created_at ?? Date.now()],
      );
    }
    for (const w of bundle.water_prefs ?? []) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO water_prefs (id, target_ml, reminder_start, reminder_end, reminder_interval, notification_id)
         VALUES (1, ?, ?, ?, ?, null)`,
        [w.target_ml ?? 2500, w.reminder_start ?? null, w.reminder_end ?? null, w.reminder_interval ?? null],
      );
    }
    for (const g of bundle.goals ?? []) {
      await tx.runAsync(
        `INSERT INTO goals (id, title, target_day, sphere, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [g.id, g.title, g.target_day, g.sphere ?? 'body', g.created_at ?? Date.now()],
      );
    }
    for (const gh of bundle.goal_habits ?? []) {
      await tx.runAsync(
        'INSERT OR IGNORE INTO goal_habits (goal_id, habit_id) VALUES (?, ?)',
        [gh.goal_id, gh.habit_id],
      );
    }
    for (const f of bundle.focus_sessions ?? []) {
      await tx.runAsync(
        `INSERT INTO focus_sessions (id, started_at, ended_at, target_minutes, focus_minutes, tag, completed)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [f.id, f.started_at, f.ended_at, f.target_minutes ?? 25, f.focus_minutes ?? 0, f.tag ?? '', f.completed ?? 0],
      );
    }
    for (const p of bundle.focus_prefs ?? []) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO focus_prefs (id, work_minutes, short_break, long_break, sessions_before_long, notify_on_end, notification_id)
         VALUES (1, ?, ?, ?, ?, ?, null)`,
        [p.work_minutes ?? 25, p.short_break ?? 5, p.long_break ?? 15, p.sessions_before_long ?? 4, p.notify_on_end ?? 1],
      );
    }
    for (const m of bundle.mood_entries ?? []) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO mood_entries (id, day, mood, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [m.id, m.day, m.mood, m.note ?? '', m.created_at ?? Date.now(), m.updated_at ?? Date.now()],
      );
    }
    for (const t of bundle.transactions ?? []) {
      await tx.runAsync(
        `INSERT INTO transactions (id, amount_cents, category, note, day, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.amount_cents, t.category ?? 'other', t.note ?? '', t.day, t.created_at ?? Date.now()],
      );
    }
    for (const b of bundle.budget_prefs ?? []) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO budget_prefs (id, monthly_budget_cents) VALUES (1, ?)`,
        [b.monthly_budget_cents ?? null],
      );
}
    for (const p of bundle.products ?? []) {
      await tx.runAsync(
        `INSERT INTO products (id, name, cost_per_unit_cents, sell_per_unit_cents, quantity_on_hand, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.id, p.name, p.cost_per_unit_cents ?? 0, p.sell_per_unit_cents ?? 0, p.quantity_on_hand ?? 0, p.created_at ?? Date.now()],
      );
    }
    for (const c of bundle.customers ?? []) {
      await tx.runAsync(
        `INSERT INTO customers (id, name, contact, notes, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [c.id, c.name, c.contact ?? '', c.notes ?? '', c.created_at ?? Date.now()],
      );
    }
    for (const s of bundle.sales ?? []) {
      await tx.runAsync(
        `INSERT INTO sales (id, customer_id, product_id, quantity, unit_price_cents, total_cents, day, status, paid_cents, reorder_when_quantity, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.customer_id, s.product_id ?? null, s.quantity ?? 1, s.unit_price_cents ?? 0, s.total_cents ?? 0, s.day, s.status ?? 'unpaid', s.paid_cents ?? 0, s.reorder_when_quantity ?? null, s.notes ?? '', s.created_at ?? Date.now()],
      );
    }
  });
}

export async function getSyncLineage(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ lookup: string; key: string }>(
    'SELECT lookup, key FROM sync_lineage',
  );
  const out: Record<string, string> = {};
  for (const r of rows) out[r.lookup] = r.key;
  return out;
}

export async function setSyncLineage(lineage: Record<string, string>): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('DELETE FROM sync_lineage');
    for (const [lookup, key] of Object.entries(lineage)) {
      await tx.runAsync('INSERT INTO sync_lineage (lookup, key) VALUES (?, ?)', [lookup, key]);
    }
  });
}

export async function getSyncMeta(name: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE name = ?',
    [name],
  );
  return row?.value ?? null;
}

export async function setSyncMeta(name: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO sync_meta (name, value) VALUES (?, ?)', [name, value]);
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>(
    'SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY favorite DESC, updated_at DESC',
  );
}

export async function listFavoriteNotes(): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>(
    'SELECT * FROM notes WHERE deleted_at IS NULL AND favorite = 1 ORDER BY updated_at DESC',
  );
}

export async function listTrashedNotes(): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>(
    'SELECT * FROM notes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC',
  );
}

export async function getNote(id: number): Promise<Note | null> {
  const db = await getDb();
  return db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?', [id]);
}

export async function createNote(input: { title: string; body: string }): Promise<Note> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO notes (title, body, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [input.title, input.body, now, now],
  );
  return {
    id: Number(result.lastInsertRowId),
    title: input.title,
    body: input.body,
    favorite: 0,
    deleted_at: null,
    created_at: now,
    updated_at: now,
  };
}

export async function updateNote(id: number, input: { title: string; body: string }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE notes SET title = ?, body = ?, updated_at = ? WHERE id = ?',
    [input.title, input.body, Date.now(), id],
  );
}

export async function setNoteFavorite(id: number, favorite: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE notes SET favorite = ? WHERE id = ?', [favorite ? 1 : 0, id]);
}

export async function trashNote(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE notes SET deleted_at = ? WHERE id = ?', [Date.now(), id]);
}

export async function restoreNote(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE notes SET deleted_at = NULL WHERE id = ?', [id]);
}

export async function emptyTrash(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE deleted_at IS NOT NULL');
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// To-dos & collections
// ---------------------------------------------------------------------------

export async function listCollections(): Promise<TodoCollection[]> {
  const db = await getDb();
  return db.getAllAsync<TodoCollection>('SELECT * FROM todo_collections ORDER BY created_at ASC');
}

export async function getCollection(id: number): Promise<TodoCollection | null> {
  const db = await getDb();
  return db.getFirstAsync<TodoCollection>('SELECT * FROM todo_collections WHERE id = ?', [id]);
}

export async function createCollection(input: { name: string; emoji: string }): Promise<TodoCollection> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO todo_collections (name, emoji, created_at) VALUES (?, ?, ?)',
    [input.name, input.emoji, now],
  );
  return { id: Number(result.lastInsertRowId), name: input.name, emoji: input.emoji, created_at: now };
}

export async function renameCollection(id: number, input: { name: string; emoji: string }): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE todo_collections SET name = ?, emoji = ? WHERE id = ?', [
    input.name,
    input.emoji,
    id,
  ]);
}

export async function deleteCollection(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM todos WHERE collection_id = ?', [id]);
  await db.runAsync('DELETE FROM todo_collections WHERE id = ?', [id]);
}

export async function listAllTodos(): Promise<Todo[]> {
  const db = await getDb();
  return db.getAllAsync<Todo>('SELECT * FROM todos ORDER BY created_at ASC');
}

export async function listQuickTodos(): Promise<Todo[]> {
  const db = await getDb();
  return db.getAllAsync<Todo>(
    'SELECT * FROM todos WHERE collection_id IS NULL AND due_at IS NULL ORDER BY created_at ASC',
  );
}

export async function todosInCollection(collectionId: number): Promise<Todo[]> {
  const db = await getDb();
  return db.getAllAsync<Todo>(
    'SELECT * FROM todos WHERE collection_id = ? ORDER BY created_at ASC',
    [collectionId],
  );
}

export async function scheduledTodos(): Promise<Todo[]> {
  const db = await getDb();
  return db.getAllAsync<Todo>(
    'SELECT * FROM todos WHERE due_at IS NOT NULL ORDER BY due_at ASC',
  );
}

export async function createTodo(input: {
  collection_id: number | null;
  title: string;
  due_at?: number | null;
}): Promise<Todo> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO todos (collection_id, title, due_at, created_at)
     VALUES (?, ?, ?, ?)`,
    [input.collection_id, input.title, input.due_at ?? null, now],
  );
  return {
    id: Number(result.lastInsertRowId),
    collection_id: input.collection_id,
    title: input.title,
    done: 0,
    due_at: input.due_at ?? null,
    remind_at: null,
    notification_id: null,
    created_at: now,
    completed_at: null,
  };
}

export async function setTodoDone(id: number, done: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE todos SET done = ?, completed_at = ? WHERE id = ?', [
    done ? 1 : 0,
    done ? Date.now() : null,
    id,
  ]);
}

export async function setTodoNotificationId(id: number, notificationId: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE todos SET notification_id = ? WHERE id = ?', [notificationId, id]);
}

export async function setTodoReminder(id: number, remindAt: number | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE todos SET remind_at = ? WHERE id = ?', [remindAt, id]);
}

export async function updateTodoContent(
  id: number,
  input: { title: string; due_at: number | null },
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE todos SET title = ?, due_at = ? WHERE id = ?', [
    input.title,
    input.due_at,
    id,
  ]);
}

export async function deleteTodo(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
}

export async function clearDoneQuickTodos(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM todos WHERE collection_id IS NULL AND due_at IS NULL AND done = 1');
}

// ---------------------------------------------------------------------------
// Fitness: exercises
// ---------------------------------------------------------------------------

export async function listExercises(): Promise<Exercise[]> {
  const db = await getDb();
  return db.getAllAsync<Exercise>(
    'SELECT * FROM exercises ORDER BY is_custom ASC, name COLLATE NOCASE ASC',
  );
}

export async function getExercise(id: number): Promise<Exercise | null> {
  const db = await getDb();
  return db.getFirstAsync<Exercise>('SELECT * FROM exercises WHERE id = ?', [id]);
}

export async function exercisesForMuscle(muscle: string): Promise<Exercise[]> {
  const db = await getDb();
  return db.getAllAsync<Exercise>(
    'SELECT * FROM exercises WHERE muscle = ? ORDER BY is_custom ASC, name COLLATE NOCASE ASC',
    [muscle],
  );
}

export async function createCustomExercise(input: { name: string; muscle: string }): Promise<Exercise> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO exercises (key, name, muscle, tip, is_custom, created_at)
     VALUES (NULL, ?, ?, '', 1, ?)`,
    [input.name, input.muscle, now],
  );
  return {
    id: Number(result.lastInsertRowId),
    key: null,
    name: input.name,
    muscle: input.muscle,
    tip: '',
    is_custom: 1,
    created_at: now,
  };
}

export async function deleteCustomExercise(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM exercises WHERE id = ? AND is_custom = 1', [id]);
}

// ---------------------------------------------------------------------------
// Fitness: workouts & sets
// ---------------------------------------------------------------------------

export interface WorkoutSession {
  workout: Workout;
  exercises: Array<{
    id: number;
    exercise_id: number;
    name: string;
    muscle: string;
    tip: string;
    sets: SetEntry[];
  }>;
}

export async function createWorkout(name = ''): Promise<Workout> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO workouts (name, started_at) VALUES (?, ?)',
    [name, now],
  );
  return { id: Number(result.lastInsertRowId), name, notes: '', started_at: now, ended_at: null };
}

export async function getActiveWorkout(): Promise<Workout | null> {
  const db = await getDb();
  return db.getFirstAsync<Workout>(
    'SELECT * FROM workouts WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
  );
}

export async function getWorkout(id: number): Promise<Workout | null> {
  const db = await getDb();
  return db.getFirstAsync<Workout>('SELECT * FROM workouts WHERE id = ?', [id]);
}

export async function getWorkoutSession(workoutId: number): Promise<WorkoutSession | null> {
  const db = await getDb();
  const workout = await getWorkout(workoutId);
  if (!workout) return null;
  const rows = await db.getAllAsync<
    WorkoutExercise & { muscle: string; tip: string }
  >(
    `SELECT we.*, COALESCE(e.muscle, '') AS muscle, COALESCE(e.tip, '') AS tip
     FROM workout_exercises we LEFT JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = ? ORDER BY we.position ASC`,
    [workoutId],
  );
  const allSets = await db.getAllAsync<SetEntry>(
    `SELECT s.* FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
     WHERE we.workout_id = ? ORDER BY s.position ASC`,
    [workoutId],
  );
  const exercises = rows.map((we) => ({
    id: we.id,
    exercise_id: we.exercise_id,
    name: we.exercise_name || 'Exercise',
    muscle: we.muscle,
    tip: we.tip,
    sets: allSets.filter((s) => s.workout_exercise_id === we.id),
  }));
  return { workout, exercises };
}

export async function addWorkoutExercise(
  workoutId: number,
  exerciseId: number,
  initialSets = 3,
): Promise<number> {
  const db = await getDb();
  const exercise = await getExercise(exerciseId);
  if (!exercise) throw new Error('exercise not found');
  const pos =
    (
      await db.getFirstAsync<{ maxPos: number | null }>(
        'SELECT MAX(position) AS maxPos FROM workout_exercises WHERE workout_id = ?',
        [workoutId],
      )
    )?.maxPos ?? -1;
  const weResult = await db.runAsync(
    `INSERT INTO workout_exercises (workout_id, exercise_id, exercise_name, position)
     VALUES (?, ?, ?, ?)`,
    [workoutId, exerciseId, exercise.name, pos + 1],
  );
  const weId = Number(weResult.lastInsertRowId);
  for (let i = 0; i < initialSets; i++) {
    await db.runAsync(
      'INSERT INTO sets (workout_exercise_id, position, reps, weight, done) VALUES (?, ?, NULL, NULL, 0)',
      [weId, i],
    );
  }
  return weId;
}

export async function removeWorkoutExercise(workoutExerciseId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sets WHERE workout_exercise_id = ?', [workoutExerciseId]);
  await db.runAsync('DELETE FROM workout_exercises WHERE id = ?', [workoutExerciseId]);
}

export async function addSetToWorkoutExercise(workoutExerciseId: number): Promise<void> {
  const db = await getDb();
  const pos =
    (
      await db.getFirstAsync<{ maxPos: number | null }>(
        'SELECT MAX(position) AS maxPos FROM sets WHERE workout_exercise_id = ?',
        [workoutExerciseId],
      )
    )?.maxPos ?? -1;
  await db.runAsync(
    'INSERT INTO sets (workout_exercise_id, position, reps, weight, done) VALUES (?, ?, NULL, NULL, 0)',
    [workoutExerciseId, pos + 1],
  );
}

export async function removeSet(setId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sets WHERE id = ?', [setId]);
}

export async function updateSet(
  setId: number,
  input: { reps?: number | null; weight?: number | null; done?: boolean },
): Promise<void> {
  const db = await getDb();
  if (input.reps !== undefined) {
    await db.runAsync('UPDATE sets SET reps = ? WHERE id = ?', [input.reps, setId]);
  }
  if (input.weight !== undefined) {
    await db.runAsync('UPDATE sets SET weight = ? WHERE id = ?', [input.weight, setId]);
  }
  if (input.done !== undefined) {
    await db.runAsync('UPDATE sets SET done = ? WHERE id = ?', [input.done ? 1 : 0, setId]);
  }
}

export async function updateWorkoutName(id: number, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE workouts SET name = ? WHERE id = ?', [name, id]);
}

export async function finishWorkout(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE workouts SET ended_at = ? WHERE id = ?', [Date.now(), id]);
}

export async function deleteWorkoutCascade(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM sets WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = ?)',
    [id],
  );
  await db.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?', [id]);
  await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
}

export interface WorkoutSummary {
  id: number;
  name: string;
  started_at: number;
  ended_at: number | null;
  exercise_count: number;
  volume: number;
}

export async function listWorkoutSummaries(limit = 60): Promise<WorkoutSummary[]> {
  const db = await getDb();
  return db.getAllAsync<WorkoutSummary>(
    `SELECT w.id, w.name, w.started_at, w.ended_at,
            COUNT(DISTINCT we.id) AS exercise_count,
            COALESCE(SUM(CASE WHEN s.done = 1 THEN s.weight * s.reps ELSE 0 END), 0) AS volume
     FROM workouts w
     LEFT JOIN workout_exercises we ON we.workout_id = w.id
     LEFT JOIN sets s ON s.workout_exercise_id = we.id
     WHERE w.ended_at IS NOT NULL
     GROUP BY w.id
     ORDER BY w.started_at DESC
     LIMIT ?`,
    [limit],
  );
}

export async function lastTrainedByMuscle(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ muscle: string; last: number }>(
    `SELECT e.muscle AS muscle, MAX(w.started_at) AS last
     FROM workouts w
     JOIN workout_exercises we ON we.workout_id = w.id
     JOIN exercises e ON e.id = we.exercise_id
     WHERE w.ended_at IS NOT NULL
     GROUP BY e.muscle`,
  );
  const map: Record<string, number> = {};
  for (const row of rows) map[row.muscle] = row.last;
  return map;
}

export interface PersonalRecord {
  name: string;
  best_weight: number;
  best_e1rm: number;
}

export async function personalRecords(limit = 8): Promise<PersonalRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ name: string; weight: number; reps: number }>(
    `SELECT we.exercise_name AS name, s.weight, s.reps
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN workouts w ON w.id = we.workout_id
     WHERE s.done = 1 AND s.weight IS NOT NULL AND s.reps IS NOT NULL
       AND s.weight > 0 AND s.reps > 0 AND w.ended_at IS NOT NULL`,
  );
  const byName = new Map<string, PersonalRecord>();
  for (const row of rows) {
    const e1rm = row.weight * (1 + row.reps / 30);
    const current = byName.get(row.name) ?? { name: row.name, best_weight: 0, best_e1rm: 0 };
    if (row.weight > current.best_weight) current.best_weight = row.weight;
    if (e1rm > current.best_e1rm) current.best_e1rm = e1rm;
    byName.set(row.name, current);
  }
  return [...byName.values()].sort((a, b) => b.best_e1rm - a.best_e1rm).slice(0, limit);
}

export async function volumeByDay(fromDay: string, toDay: string): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ started_at: number; volume: number }>(
    `SELECT w.started_at, SUM(s.weight * s.reps) AS volume
     FROM workouts w
     JOIN workout_exercises we ON we.workout_id = w.id
     JOIN sets s ON s.workout_exercise_id = we.id
     WHERE s.done = 1 AND w.ended_at IS NOT NULL
       AND date(w.started_at / 1000, 'unixepoch', 'localtime') BETWEEN ? AND ?
     GROUP BY w.id`,
    [fromDay, toDay],
  );
  const map: Record<string, number> = {};
  for (const row of rows) {
    const d = new Date(row.started_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    map[key] = (map[key] ?? 0) + row.volume;
  }
  return map;
}

export async function workoutDays(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ started_at: number }>(
    'SELECT started_at FROM workouts WHERE ended_at IS NOT NULL ORDER BY started_at DESC',
  );
  const days = new Set<string>();
  for (const row of rows) {
    const d = new Date(row.started_at);
    days.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return [...days].sort().reverse();
}

// ---------------------------------------------------------------------------
// Fitness: routines
// ---------------------------------------------------------------------------

export interface RoutineWithCount extends Routine {
  exercise_count: number;
}

export async function listRoutines(): Promise<RoutineWithCount[]> {
  const db = await getDb();
  return db.getAllAsync<RoutineWithCount>(
    `SELECT r.*, COUNT(re.id) AS exercise_count
     FROM routines r LEFT JOIN routine_exercises re ON re.routine_id = r.id
     GROUP BY r.id ORDER BY r.created_at ASC`,
  );
}

export async function getRoutine(id: number): Promise<Routine | null> {
  const db = await getDb();
  return db.getFirstAsync<Routine>('SELECT * FROM routines WHERE id = ?', [id]);
}

export async function getRoutineItems(routineId: number): Promise<RoutineItem[]> {
  const db = await getDb();
  return db.getAllAsync<RoutineItem>(
    'SELECT * FROM routine_exercises WHERE routine_id = ? ORDER BY position ASC',
    [routineId],
  );
}

export async function saveRoutine(
  routineId: number | null,
  name: string,
  items: Array<{ exercise_id: number; exercise_name: string; target_sets: number; target_reps: number }>,
): Promise<number> {
  const db = await getDb();
  let id = routineId;
  if (id === null) {
    const result = await db.runAsync('INSERT INTO routines (name, created_at) VALUES (?, ?)', [
      name,
      Date.now(),
    ]);
    id = Number(result.lastInsertRowId);
  } else {
    await db.runAsync('UPDATE routines SET name = ? WHERE id = ?', [name, id]);
    await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', [id]);
  }
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await db.runAsync(
      `INSERT INTO routine_exercises (routine_id, exercise_id, exercise_name, position, target_sets, target_reps)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, item.exercise_id, item.exercise_name, i, item.target_sets, item.target_reps],
    );
  }
  return id;
}

export async function deleteRoutine(routineId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', [routineId]);
  await db.runAsync('DELETE FROM routines WHERE id = ?', [routineId]);
}

/** Creates an active workout pre-filled with the routine's exercises and sets. */
export async function startWorkoutFromRoutine(routineId: number): Promise<number | null> {
  const db = await getDb();
  const routine = await db.getFirstAsync<Routine>('SELECT * FROM routines WHERE id = ?', [routineId]);
  if (!routine) return null;
  if (await getActiveWorkout()) return null;
  const items = await getRoutineItems(routineId);
  const workout = await createWorkout(routine.name);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const exercise = await getExercise(item.exercise_id);
    const name = exercise?.name || item.exercise_name;
    const posResult = await db.runAsync(
      `INSERT INTO workout_exercises (workout_id, exercise_id, exercise_name, position)
       VALUES (?, ?, ?, ?)`,
      [workout.id, item.exercise_id, name, i],
    );
    const weId = Number(posResult.lastInsertRowId);
    for (let s = 0; s < item.target_sets; s++) {
      await db.runAsync(
        'INSERT INTO sets (workout_exercise_id, position, reps, weight, done) VALUES (?, ?, ?, NULL, 0)',
        [weId, s, item.target_reps],
      );
    }
  }
  return workout.id;
}

// ---------------------------------------------------------------------------
// Fitness: body metrics & prefs
// ---------------------------------------------------------------------------

export async function listBodyEntries(metric: string): Promise<BodyEntry[]> {
  const db = await getDb();
  return db.getAllAsync<BodyEntry>(
    'SELECT * FROM body_entries WHERE metric = ? ORDER BY day DESC',
    [metric],
  );
}

export async function saveBodyEntry(metric: string, value: number, day: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO body_entries (metric, value, day) VALUES (?, ?, ?) ' +
      'ON CONFLICT(metric, day) DO UPDATE SET value = excluded.value',
    [metric, value, day],
  );
}

export async function deleteBodyEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM body_entries WHERE id = ?', [id]);
}

export async function getFitnessPrefs(): Promise<FitnessPrefs> {
  const db = await getDb();
  const row = await db.getFirstAsync<FitnessPrefs>('SELECT * FROM fitness_prefs WHERE id = 1');
  return row ?? { reminder_minutes: null, days: '1,3,5', notification_id: null };
}

export async function saveFitnessPrefs(prefs: FitnessPrefs): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO fitness_prefs (id, reminder_minutes, days, notification_id)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET reminder_minutes = excluded.reminder_minutes,
       days = excluded.days, notification_id = excluded.notification_id`,
    [prefs.reminder_minutes, prefs.days, prefs.notification_id],
  );
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

/** Minutes slept between a bedtime and wake time (handles past-midnight bedtimes). */
export function sleepDurationMinutes(bedMinutes: number, wakeMinutes: number): number {
  return wakeMinutes > bedMinutes ? wakeMinutes - bedMinutes : 1440 - bedMinutes + wakeMinutes;
}

export async function listSleepEntries(limit = 60): Promise<SleepEntry[]> {
  const db = await getDb();
  return db.getAllAsync<SleepEntry>(
    'SELECT * FROM sleep_entries ORDER BY day DESC LIMIT ?',
    [limit],
  );
}

export async function getSleepEntry(day: string): Promise<SleepEntry | null> {
  const db = await getDb();
  return db.getFirstAsync<SleepEntry>('SELECT * FROM sleep_entries WHERE day = ?', [day]);
}

export async function saveSleepEntry(input: {
  day: string;
  bed_minutes: number;
  wake_minutes: number;
  quality: number | null;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sleep_entries (day, bed_minutes, wake_minutes, quality)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET bed_minutes = excluded.bed_minutes,
       wake_minutes = excluded.wake_minutes, quality = excluded.quality`,
    [input.day, input.bed_minutes, input.wake_minutes, input.quality],
  );
}

export async function deleteSleepEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sleep_entries WHERE id = ?', [id]);
}

export async function getSleepPrefs(): Promise<SleepPrefs> {
  const db = await getDb();
  const row = await db.getFirstAsync<SleepPrefs>('SELECT * FROM sleep_prefs WHERE id = 1');
  return row ?? { goal_minutes: 480, reminder_minutes: null, notification_id: null };
}

export async function saveSleepPrefs(prefs: SleepPrefs): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sleep_prefs (id, goal_minutes, reminder_minutes, notification_id)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET goal_minutes = excluded.goal_minutes,
       reminder_minutes = excluded.reminder_minutes, notification_id = excluded.notification_id`,
    [prefs.goal_minutes, prefs.reminder_minutes, prefs.notification_id],
  );
}

// ---------------------------------------------------------------------------
// Lucid dreaming
// ---------------------------------------------------------------------------

export interface DreamEntryInput {
  day: string;
  title: string;
  body: string;
  lucid: boolean;
}

export async function saveDreamEntry(input: DreamEntryInput, entryId: number | null): Promise<void> {
  const db = await getDb();
  if (entryId === null) {
    await db.runAsync(
      'INSERT INTO dream_entries (day, title, body, lucid, created_at) VALUES (?, ?, ?, ?, ?)',
      [input.day, input.title, input.body, input.lucid ? 1 : 0, Date.now()],
    );
  } else {
    await db.runAsync(
      'UPDATE dream_entries SET day = ?, title = ?, body = ?, lucid = ? WHERE id = ?',
      [input.day, input.title, input.body, input.lucid ? 1 : 0, entryId],
    );
  }
}

export async function listDreamEntries(limit = 200): Promise<DreamEntry[]> {
  const db = await getDb();
  return db.getAllAsync<DreamEntry>(
    'SELECT * FROM dream_entries ORDER BY day DESC, created_at DESC LIMIT ?',
    [limit],
  );
}

export async function getDreamEntry(id: number): Promise<DreamEntry | null> {
  const db = await getDb();
  return db.getFirstAsync<DreamEntry>('SELECT * FROM dream_entries WHERE id = ?', [id]);
}

export async function deleteDreamEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM dream_entries WHERE id = ?', [id]);
}

export async function getLucidPrefs(): Promise<LucidPrefs> {
  const db = await getDb();
  const row = await db.getFirstAsync<LucidPrefs>('SELECT * FROM lucid_prefs WHERE id = 1');
  return row ?? { rc_per_day: 0, notification_id: null };
}

export async function saveLucidPrefs(prefs: LucidPrefs): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO lucid_prefs (id, rc_per_day, notification_id)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET rc_per_day = excluded.rc_per_day,
       notification_id = excluded.notification_id`,
    [prefs.rc_per_day, prefs.notification_id],
  );
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

export async function getBestScore(game: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ best: number }>(
    'SELECT best FROM game_scores WHERE game = ?',
    [game],
  );
  return row?.best ?? 0;
}

export async function recordScore(game: string, score: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO game_scores (game, best) VALUES (?, ?)
     ON CONFLICT(game) DO UPDATE SET best = MAX(best, excluded.best)`,
    [game, score],
  );
}

/** Best where lower is better (fastest time, fewest moves). */
export async function recordLowScore(game: string, value: number): Promise<void> {
  if (value <= 0) return;
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO game_scores (game, best) VALUES (?, ?)
     ON CONFLICT(game) DO UPDATE SET best = MIN(best, excluded.best)`,
    [game, value],
  );
}

// ---------------------------------------------------------------------------
// Daily routines (checklists that reset every day at noon)
// ---------------------------------------------------------------------------

export async function listDailyRoutines(): Promise<DailyRoutine[]> {
  const db = await getDb();
  return db.getAllAsync<DailyRoutine>('SELECT * FROM daily_routines ORDER BY created_at ASC');
}

export async function getDailyRoutine(id: number): Promise<DailyRoutine | null> {
  const db = await getDb();
  return db.getFirstAsync<DailyRoutine>('SELECT * FROM daily_routines WHERE id = ?', [id]);
}

export async function createDailyRoutine(name: string, emoji: string): Promise<DailyRoutine> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO daily_routines (name, emoji, created_at) VALUES (?, ?, ?)',
    [name, emoji, now],
  );
  return { id: Number(result.lastInsertRowId), name, emoji, created_at: now };
}

export async function renameDailyRoutine(id: number, name: string, emoji: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE daily_routines SET name = ?, emoji = ? WHERE id = ?', [name, emoji, id]);
}

export async function deleteDailyRoutine(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM daily_routine_completions
     WHERE item_id IN (SELECT id FROM daily_routine_items WHERE routine_id = ?)`,
    [id],
  );
  await db.runAsync('DELETE FROM daily_routine_items WHERE routine_id = ?', [id]);
  await db.runAsync('DELETE FROM daily_routines WHERE id = ?', [id]);
}

export async function listDailyRoutineItems(routineId: number): Promise<DailyRoutineItem[]> {
  const db = await getDb();
  return db.getAllAsync<DailyRoutineItem>(
    'SELECT * FROM daily_routine_items WHERE routine_id = ? ORDER BY position ASC',
    [routineId],
  );
}

export async function listAllDailyRoutineItems(): Promise<DailyRoutineItem[]> {
  const db = await getDb();
  return db.getAllAsync<DailyRoutineItem>(
    'SELECT * FROM daily_routine_items ORDER BY routine_id ASC, position ASC',
  );
}

export async function addDailyRoutineItem(routineId: number, title: string): Promise<void> {
  const db = await getDb();
  const pos =
    (
      await db.getFirstAsync<{ maxPos: number | null }>(
        'SELECT MAX(position) AS maxPos FROM daily_routine_items WHERE routine_id = ?',
        [routineId],
      )
    )?.maxPos ?? -1;
  await db.runAsync(
    'INSERT INTO daily_routine_items (routine_id, title, position, created_at) VALUES (?, ?, ?, ?)',
    [routineId, title, pos + 1, Date.now()],
  );
}

export async function updateDailyRoutineItem(id: number, title: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE daily_routine_items SET title = ? WHERE id = ?', [title, id]);
}

export async function deleteDailyRoutineItem(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM daily_routine_completions WHERE item_id = ?', [id]);
  await db.runAsync('DELETE FROM daily_routine_items WHERE id = ?', [id]);
}

/** All completions for one routine day window. */
export async function dailyRoutineCompletions(day: string): Promise<DailyRoutineCompletion[]> {
  const db = await getDb();
  return db.getAllAsync<DailyRoutineCompletion>(
    'SELECT * FROM daily_routine_completions WHERE day = ?',
    [day],
  );
}

/** Check an item if unchecked, uncheck it if already checked — within one day window. */
export async function toggleDailyRoutineItem(itemId: number, day: string): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM daily_routine_completions WHERE item_id = ? AND day = ?',
    [itemId, day],
  );
  if (existing) {
    await db.runAsync('DELETE FROM daily_routine_completions WHERE id = ?', [existing.id]);
  } else {
    await db.runAsync('INSERT INTO daily_routine_completions (item_id, day) VALUES (?, ?)', [
      itemId,
      day,
    ]);
  }
}

/** Unchecks every item of the routine for a given day window (manual reset). */
export async function resetDailyRoutine(routineId: number, day: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM daily_routine_completions
     WHERE day = ? AND item_id IN (SELECT id FROM daily_routine_items WHERE routine_id = ?)`,
    [day, routineId],
  );
}

// ---------------------------------------------------------------------------
// Goals (Evolve)
// ---------------------------------------------------------------------------

export async function listGoals(): Promise<Goal[]> {
  const db = await getDb();
  return db.getAllAsync<Goal>('SELECT * FROM goals ORDER BY created_at DESC');
}

export async function createGoal(input: {
  title: string;
  target_day: string;
  sphere: Goal['sphere'];
}): Promise<Goal> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO goals (title, target_day, sphere, created_at) VALUES (?, ?, ?, ?)',
    [input.title, input.target_day, input.sphere, Date.now()],
  );
  return { id: Number(result.lastInsertRowId), title: input.title, target_day: input.target_day, sphere: input.sphere, created_at: Date.now() };
}

export async function updateGoal(goal: Goal): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE goals SET title = ?, target_day = ?, sphere = ? WHERE id = ?',
    [goal.title, goal.target_day, goal.sphere, goal.id],
  );
}

export async function deleteGoal(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM goal_habits WHERE goal_id = ?', [id]);
  await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
}

export async function goalHabitIds(goalId: number): Promise<number[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<GoalHabit>('SELECT * FROM goal_habits WHERE goal_id = ?', [goalId]);
  return rows.map((r) => r.habit_id);
}

export async function linkGoalHabit(goalId: number, habitId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR IGNORE INTO goal_habits (goal_id, habit_id) VALUES (?, ?)',
    [goalId, habitId],
  );
}

export async function unlinkGoalHabit(goalId: number, habitId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM goal_habits WHERE goal_id = ? AND habit_id = ?', [goalId, habitId]);
}

export async function setHabitSphere(habitId: number, sphere: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE habits SET sphere = ? WHERE id = ?', [sphere, habitId]);
}

export async function listHabitsBySphere(sphere: string): Promise<Habit[]> {
  const db = await getDb();
  return db.getAllAsync<Habit>('SELECT * FROM habits WHERE sphere = ? ORDER BY created_at ASC', [sphere]);
}

// ---------------------------------------------------------------------------
// Water
// ---------------------------------------------------------------------------

export async function getWaterPrefs(): Promise<WaterPrefs> {
  const db = await getDb();
  const row = await db.getFirstAsync<WaterPrefs>('SELECT * FROM water_prefs WHERE id = 1');
  return (
    row ?? { target_ml: 2500, reminder_start: null, reminder_end: null, reminder_interval: null, notification_id: null }
  );
}

export async function saveWaterPrefs(prefs: WaterPrefs): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO water_prefs (id, target_ml, reminder_start, reminder_end, reminder_interval, notification_id)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET target_ml = excluded.target_ml,
       reminder_start = excluded.reminder_start, reminder_end = excluded.reminder_end,
       reminder_interval = excluded.reminder_interval, notification_id = excluded.notification_id`,
    [prefs.target_ml, prefs.reminder_start, prefs.reminder_end, prefs.reminder_interval, prefs.notification_id],
  );
}

/** Logs a glass/sip of water; returns the new row id (for undo). */
export async function addWaterLog(day: string, ml: number): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO water_logs (day, ml, created_at) VALUES (?, ?, ?)',
    [day, ml, Date.now()],
  );
  return res.lastInsertRowId;
}

export async function deleteWaterLog(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM water_logs WHERE id = ?', [id]);
}

export async function waterLogsFor(day: string): Promise<WaterLog[]> {
  const db = await getDb();
  return db.getAllAsync<WaterLog>(
    'SELECT * FROM water_logs WHERE day = ? ORDER BY created_at ASC',
    [day],
  );
}

export async function waterBetween(fromDay: string, toDay: string): Promise<WaterLog[]> {
  const db = await getDb();
  return db.getAllAsync<WaterLog>(
    'SELECT * FROM water_logs WHERE day >= ? AND day <= ? ORDER BY day ASC, created_at ASC',
    [fromDay, toDay],
  );
}

export async function allWaterLogs(): Promise<WaterLog[]> {
  const db = await getDb();
  return db.getAllAsync<WaterLog>('SELECT * FROM water_logs ORDER BY day ASC, created_at ASC');
}

// ---------------------------------------------------------------------------
// App-wide preferences & maintenance
// ---------------------------------------------------------------------------

export async function getPref(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_prefs WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setPref(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_prefs (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

/** Erases every user data table; theme and other app_prefs are kept. */
export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const table of [
      'completions',
      'habits',
      'notes',
      'todos',
      'todo_collections',
      'exercises',
      'workouts',
      'workout_exercises',
      'sets',
      'routines',
      'routine_exercises',
      'body_entries',
      'fitness_prefs',
      'sleep_entries',
      'sleep_prefs',
      'dream_entries',
      'lucid_prefs',
      'game_scores',
      'daily_routines',
      'daily_routine_items',
      'daily_routine_completions',
      'book_notes',
      'books',
      'links',
      'water_logs',
      'water_prefs',
      'goal_habits',
      'goals',
      'ai_messages',
      'ai_usage',
      'products',
      'customers',
      'sales',
    ]) {
      await tx.runAsync(`DELETE FROM ${table}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

export async function listBooks(status?: BookStatus): Promise<Book[]> {
  const db = await getDb();
  if (status === undefined) {
    return db.getAllAsync<Book>('SELECT * FROM books ORDER BY title COLLATE NOCASE ASC');
  }
  if (status === 'reading') {
    // Most recently updated first while reading.
    return db.getAllAsync<Book>('SELECT * FROM books WHERE status = ? ORDER BY updated_at DESC', [status]);
  }
  return db.getAllAsync<Book>('SELECT * FROM books WHERE status = ? ORDER BY title COLLATE NOCASE ASC', [
    status,
  ]);
}

export async function getBook(id: number): Promise<Book | null> {
  const db = await getDb();
  return db.getFirstAsync<Book>('SELECT * FROM books WHERE id = ?', [id]);
}

export async function createBook(input: Omit<Book, 'id'>): Promise<Book> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO books (title, author, status, cover_uri, total_pages, pages_read, buy_url, rating, created_at, updated_at, finished_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.author,
      input.status,
      input.cover_uri,
      input.total_pages,
      input.pages_read,
      input.buy_url,
      input.rating,
      input.created_at,
      input.updated_at,
      input.finished_at,
    ],
  );
  return { ...input, id: Number(result.lastInsertRowId) };
}

export async function updateBook(book: Book): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE books SET title = ?, author = ?, status = ?, cover_uri = ?, total_pages = ?, pages_read = ?,
     buy_url = ?, rating = ?, updated_at = ?, finished_at = ? WHERE id = ?`,
    [
      book.title,
      book.author,
      book.status,
      book.cover_uri,
      book.total_pages,
      book.pages_read,
      book.buy_url,
      book.rating,
      Date.now(),
      book.finished_at,
      book.id,
    ],
  );
}

/** Move a book between reading / finished / wishlist. Sets finished_at when finished. */
export async function setBookStatus(id: number, status: BookStatus): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE books SET status = ?, updated_at = ?,
     finished_at = CASE WHEN ? = 'finished' THEN COALESCE(finished_at, ?) ELSE NULL END
     WHERE id = ?`,
    [status, now, status, now, id],
  );
}

export async function updateBookPages(id: number, totalPages: number | null, pagesRead: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE books SET total_pages = ?, pages_read = ?, updated_at = ? WHERE id = ?`,
    [totalPages, Math.max(0, pagesRead), Date.now(), id],
  );
}

export async function adjustBookPagesRead(id: number, delta: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE books SET pages_read = MAX(0, pages_read + ?), updated_at = ? WHERE id = ?`,
    [delta, Date.now(), id],
  );
}

export async function deleteBook(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM book_notes WHERE book_id = ?', [id]);
  await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
}

export async function listBookNotes(bookId?: number): Promise<BookNote[]> {
  const db = await getDb();
  if (bookId === undefined) {
    return db.getAllAsync<BookNote>('SELECT * FROM book_notes ORDER BY updated_at DESC');
  }
  return db.getAllAsync<BookNote>(
    'SELECT * FROM book_notes WHERE book_id = ? ORDER BY updated_at DESC',
    [bookId],
  );
}

export async function getBookNote(id: number): Promise<BookNote | null> {
  const db = await getDb();
  return db.getFirstAsync<BookNote>('SELECT * FROM book_notes WHERE id = ?', [id]);
}

export async function createBookNote(input: { book_id: number; title: string; body: string }): Promise<BookNote> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO book_notes (book_id, title, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [input.book_id, input.title, input.body, now, now],
  );
  return { id: Number(result.lastInsertRowId), ...input, created_at: now, updated_at: now };
}

export async function updateBookNote(note: BookNote): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE book_notes SET book_id = ?, title = ?, body = ?, updated_at = ? WHERE id = ?`,
    [note.book_id, note.title, note.body, Date.now(), note.id],
  );
}

export async function deleteBookNote(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM book_notes WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export async function listLinks(favoriteOnly = false): Promise<LinkItem[]> {
  const db = await getDb();
  if (favoriteOnly) {
    return db.getAllAsync<LinkItem>('SELECT * FROM links WHERE favorite = 1 ORDER BY updated_at DESC');
  }
  return db.getAllAsync<LinkItem>('SELECT * FROM links ORDER BY favorite DESC, created_at DESC');
}

export async function listLinksByCategory(category: LinkCategory): Promise<LinkItem[]> {
  const db = await getDb();
  return db.getAllAsync<LinkItem>(
    'SELECT * FROM links WHERE category = ? ORDER BY created_at DESC',
    [category],
  );
}

export async function getLink(id: number): Promise<LinkItem | null> {
  const db = await getDb();
  return db.getFirstAsync<LinkItem>('SELECT * FROM links WHERE id = ?', [id]);
}

export async function createLink(input: {
  url: string;
  title: string;
  category: LinkCategory;
  note: string;
  favorite: boolean;
}): Promise<LinkItem> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO links (url, title, category, note, favorite, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.url, input.title, input.category, input.note, input.favorite ? 1 : 0, now, now],
  );
  return {
    id: Number(result.lastInsertRowId),
    url: input.url,
    title: input.title,
    category: input.category,
    note: input.note,
    favorite: input.favorite ? 1 : 0,
    created_at: now,
    updated_at: now,
  };
}

export async function updateLink(
  id: number,
  input: Partial<Pick<LinkItem, 'url' | 'title' | 'category' | 'note' | 'favorite'>>,
): Promise<void> {
  const db = await getDb();
  const current = await getLink(id);
  if (!current) return;
  await db.runAsync(
    `UPDATE links SET url = ?, title = ?, category = ?, note = ?, favorite = ?, updated_at = ? WHERE id = ?`,
    [
      input.url ?? current.url,
      input.title ?? current.title,
      input.category ?? current.category,
      input.note ?? current.note,
      input.favorite !== undefined ? (input.favorite ? 1 : 0) : current.favorite,
      Date.now(),
      id,
    ],
  );
}

export async function setLinkFavorite(id: number, favorite: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE links SET favorite = ?, updated_at = ? WHERE id = ?', [
    favorite ? 1 : 0,
    Date.now(),
    id,
  ]);
}

export async function deleteLink(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM links WHERE id = ?', [id]);
}

export async function countLinksByCategory(): Promise<{ category: string; count: number }[]> {
  const db = await getDb();
  return db.getAllAsync<{ category: string; count: number }>(
    'SELECT category, COUNT(*) AS count FROM links GROUP BY category',
  );
}

// ---------------------------------------------------------------------------
// AI assistant chat
// ---------------------------------------------------------------------------

/** Append a chat message. Order is preserved via the auto-incrementing id. */
export async function addAiMessage(role: 'user' | 'assistant', content: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO ai_messages (role, content, created_at) VALUES (?, ?, ?)',
    [role, content, Date.now()],
  );
}

/** Recent chat history, oldest first, up to `limit` messages. */
export async function listAiMessages(limit = 50): Promise<AiMessage[]> {
  const db = await getDb();
  return db.getAllAsync<AiMessage>(
    'SELECT * FROM (SELECT * FROM ai_messages ORDER BY id DESC LIMIT ?) ORDER BY id ASC',
    [limit],
  );
}

export async function clearAiMessages(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM ai_messages');
}

export interface AiUsageRow {
  day: string;
  prompt_tokens: number;
  completion_tokens: number;
  requests: number;
}

/** Record one chat-completion round for a calendar day (idempotent per call). */
export async function recordAiUsage(
  day: string,
  promptTokens: number,
  completionTokens: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO ai_usage (day, prompt_tokens, completion_tokens, requests) VALUES (?, ?, ?, 1)
     ON CONFLICT(day) DO UPDATE SET
       prompt_tokens = prompt_tokens + excluded.prompt_tokens,
       completion_tokens = completion_tokens + excluded.completion_tokens,
       requests = requests + 1`,
    [day, Math.max(0, promptTokens), Math.max(0, completionTokens)],
  );
}

/** Per-day usage, oldest first, up to `days` rows. */
export async function listAiUsage(days = 30): Promise<AiUsageRow[]> {
  const db = await getDb();
  return db.getAllAsync<AiUsageRow>(
    `SELECT day, prompt_tokens, completion_tokens, requests
     FROM (SELECT day, prompt_tokens, completion_tokens, requests FROM ai_usage ORDER BY day DESC LIMIT ?)
     ORDER BY day ASC`,
    [days],
  );
}

/** All-time totals across every recorded day. */
export async function getAiUsageTotals(): Promise<AiUsageRow> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ p: number; c: number; r: number }>(
    'SELECT COALESCE(SUM(prompt_tokens), 0) AS p, COALESCE(SUM(completion_tokens), 0) AS c, COALESCE(SUM(requests), 0) AS r FROM ai_usage',
  );
  return {
    day: 'total',
    prompt_tokens: row?.p ?? 0,
    completion_tokens: row?.c ?? 0,
    requests: row?.r ?? 0,
  };
}

// ---------------------------------------------------------------------------
// AI assistant: game scores
// ---------------------------------------------------------------------------

/** Every recorded best score. */
export async function listBestScores(): Promise<GameScore[]> {
  const db = await getDb();
  return db.getAllAsync<GameScore>('SELECT * FROM game_scores ORDER BY game ASC');
}

// ---------------------------------------------------------------------------
// Focus / Pomodoro
// ---------------------------------------------------------------------------

export async function listFocusSessions(limit = 500): Promise<FocusSession[]> {
  const db = await getDb();
  return db.getAllAsync<FocusSession>(
    'SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT ?',
    [limit],
  );
}

export async function getFocusSessionsBetween(fromMs: number, toMs: number): Promise<FocusSession[]> {
  const db = await getDb();
  return db.getAllAsync<FocusSession>(
    'SELECT * FROM focus_sessions WHERE started_at >= ? AND started_at <= ? ORDER BY started_at ASC',
    [fromMs, toMs],
  );
}

export async function createFocusSession(input: {
  started_at: number;
  ended_at: number;
  target_minutes: number;
  focus_minutes: number;
  tag: string;
  completed: boolean;
}): Promise<FocusSession> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO focus_sessions (started_at, ended_at, target_minutes, focus_minutes, tag, completed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.started_at, input.ended_at, input.target_minutes, input.focus_minutes, input.tag, input.completed ? 1 : 0],
  );
  return {
    id: Number(result.lastInsertRowId),
    started_at: input.started_at,
    ended_at: input.ended_at,
    target_minutes: input.target_minutes,
    focus_minutes: input.focus_minutes,
    tag: input.tag,
    completed: input.completed ? 1 : 0,
  };
}

export async function getFocusPrefs(): Promise<FocusPrefs> {
  const db = await getDb();
  const row = await db.getFirstAsync<FocusPrefs>('SELECT * FROM focus_prefs WHERE id = 1');
  return (
    row ?? {
      work_minutes: 25,
      short_break: 5,
      long_break: 15,
      sessions_before_long: 4,
      notify_on_end: 1,
      notification_id: null,
    }
  );
}

export async function saveFocusPrefs(prefs: FocusPrefs): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO focus_prefs (id, work_minutes, short_break, long_break, sessions_before_long, notify_on_end, notification_id)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       work_minutes = excluded.work_minutes,
       short_break = excluded.short_break,
       long_break = excluded.long_break,
       sessions_before_long = excluded.sessions_before_long,
       notify_on_end = excluded.notify_on_end,
       notification_id = excluded.notification_id`,
    [prefs.work_minutes, prefs.short_break, prefs.long_break, prefs.sessions_before_long, prefs.notify_on_end, prefs.notification_id],
  );
}

export async function setFocusNotificationId(id: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE focus_prefs SET notification_id = ? WHERE id = 1', [id]);
}

// ---------------------------------------------------------------------------
// Mood / Journal
// ---------------------------------------------------------------------------

export async function listMoodEntries(limit = 200): Promise<MoodEntry[]> {
  const db = await getDb();
  return db.getAllAsync<MoodEntry>(
    'SELECT * FROM mood_entries ORDER BY day DESC LIMIT ?',
    [limit],
  );
}

export async function getMoodEntry(day: string): Promise<MoodEntry | null> {
  const db = await getDb();
  return db.getFirstAsync<MoodEntry>('SELECT * FROM mood_entries WHERE day = ?', [day]);
}

export async function saveMoodEntry(input: { day: string; mood: number; note: string }): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO mood_entries (day, mood, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET
       mood = excluded.mood,
       note = excluded.note,
       updated_at = excluded.updated_at`,
    [input.day, input.mood, input.note, now, now],
  );
}

export async function deleteMoodEntry(day: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM mood_entries WHERE day = ?', [day]);
}

// ---------------------------------------------------------------------------
// Spending / Budget
// ---------------------------------------------------------------------------

export async function listTransactions(limit = 1000): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY day DESC, created_at DESC LIMIT ?', [limit]);
}

export async function getTransactionsBetween(fromDay: string, toDay: string): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE day >= ? AND day <= ? ORDER BY day ASC, created_at ASC',
    [fromDay, toDay],
  );
}

export async function createTransaction(input: {
  amount_cents: number;
  category: string;
  note: string;
  day: string;
}): Promise<Transaction> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO transactions (amount_cents, category, note, day, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [input.amount_cents, input.category, input.note, input.day, Date.now()],
  );
  return {
    id: Number(result.lastInsertRowId),
    amount_cents: input.amount_cents,
    category: input.category,
    note: input.note,
    day: input.day,
    created_at: Date.now(),
  };
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getBudgetPrefs(): Promise<BudgetPrefs> {
  const db = await getDb();
  const row = await db.getFirstAsync<BudgetPrefs>('SELECT * FROM budget_prefs WHERE id = 1');
  return { monthly_budget_cents: row?.monthly_budget_cents ?? null };
}

export async function saveBudgetPrefs(prefs: BudgetPrefs): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO budget_prefs (id, monthly_budget_cents)
     VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET monthly_budget_cents = excluded.monthly_budget_cents`,
    [prefs.monthly_budget_cents],
  );
}

// ---------------------------------------------------------------------------
// Business / Sales tracker
// ---------------------------------------------------------------------------

// -- Products ---------------------------------------------------------------

export async function listProducts(): Promise<Product[]> {
  const db = await getDb();
  return db.getAllAsync<Product>('SELECT * FROM products ORDER BY created_at ASC');
}

export async function createProduct(input: {
  name: string;
  cost_per_unit_cents: number;
  sell_per_unit_cents: number;
  quantity_on_hand: number;
}): Promise<Product> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO products (name, cost_per_unit_cents, sell_per_unit_cents, quantity_on_hand, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [input.name, input.cost_per_unit_cents, input.sell_per_unit_cents, input.quantity_on_hand, now],
  );
  return { id: Number(result.lastInsertRowId), ...input, created_at: now };
}

export async function updateProduct(product: Product): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE products SET name = ?, cost_per_unit_cents = ?, sell_per_unit_cents = ?, quantity_on_hand = ?
     WHERE id = ?`,
    [product.name, product.cost_per_unit_cents, product.sell_per_unit_cents, product.quantity_on_hand, product.id],
  );
}

export async function adjustProductStock(id: number, delta: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE products SET quantity_on_hand = MAX(0, quantity_on_hand + ?) WHERE id = ?', [delta, id]);
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE sales SET product_id = NULL WHERE product_id = ?', [id]);
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
}

// -- Customers --------------------------------------------------------------

export async function listCustomers(): Promise<Customer[]> {
  const db = await getDb();
  return db.getAllAsync<Customer>('SELECT * FROM customers ORDER BY created_at ASC');
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const db = await getDb();
  return db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
}

export async function createCustomer(input: { name: string; contact?: string; notes?: string }): Promise<Customer> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO customers (name, contact, notes, created_at) VALUES (?, ?, ?, ?)',
    [input.name, input.contact ?? '', input.notes ?? '', now],
  );
  return { id: Number(result.lastInsertRowId), name: input.name, contact: input.contact ?? '', notes: input.notes ?? '', created_at: now };
}

export async function updateCustomer(customer: Customer): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE customers SET name = ?, contact = ?, notes = ? WHERE id = ?',
    [customer.name, customer.contact, customer.notes, customer.id],
  );
}

export async function deleteCustomerCascade(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sales WHERE customer_id = ?', [id]);
  await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
}

// -- Sales ------------------------------------------------------------------

export async function listSales(limit = 1000): Promise<Sale[]> {
  const db = await getDb();
  return db.getAllAsync<Sale>('SELECT * FROM sales ORDER BY day DESC, created_at DESC LIMIT ?', [limit]);
}

export async function listSalesBetween(fromDay: string, toDay: string): Promise<Sale[]> {
  const db = await getDb();
  return db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE day >= ? AND day <= ? ORDER BY day ASC, created_at ASC',
    [fromDay, toDay],
  );
}

export async function salesForCustomer(customerId: number): Promise<Sale[]> {
  const db = await getDb();
  return db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE customer_id = ? ORDER BY day DESC, created_at DESC',
    [customerId],
  );
}

export async function createSale(input: {
  customer_id: number;
  product_id: number | null;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  day: string;
  status: SaleStatus;
  paid_cents: number;
  reorder_when_quantity: number | null;
  notes: string;
}): Promise<Sale> {
  const db = await getDb();
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO sales (customer_id, product_id, quantity, unit_price_cents, total_cents, day, status, paid_cents, reorder_when_quantity, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.customer_id, input.product_id, input.quantity, input.unit_price_cents, input.total_cents, input.day, input.status, input.paid_cents, input.reorder_when_quantity, input.notes, now],
  );
  // Decrement stock for the sold product.
  if (input.product_id != null) {
    await adjustProductStock(input.product_id, -input.quantity);
  }
  return {
    id: Number(result.lastInsertRowId),
    customer_id: input.customer_id,
    product_id: input.product_id,
    quantity: input.quantity,
    unit_price_cents: input.unit_price_cents,
    total_cents: input.total_cents,
    day: input.day,
    status: input.status,
    paid_cents: input.paid_cents,
    reorder_when_quantity: input.reorder_when_quantity,
    notes: input.notes,
    created_at: now,
  };
}

export async function updateSale(sale: Sale): Promise<void> {
  const db = await getDb();
  const old = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id = ?', [sale.id]);
  if (!old) return;
  await db.runAsync(
    `UPDATE sales SET customer_id = ?, product_id = ?, quantity = ?, unit_price_cents = ?, total_cents = ?, day = ?, status = ?, paid_cents = ?, reorder_when_quantity = ?, notes = ? WHERE id = ?`,
    [sale.customer_id, sale.product_id, sale.quantity, sale.unit_price_cents, sale.total_cents, sale.day, sale.status, sale.paid_cents, sale.reorder_when_quantity, sale.notes, sale.id],
  );
  // Reconcile stock if the sold product or quantity changed.
  if (old.product_id !== sale.product_id || old.quantity !== sale.quantity) {
    if (old.product_id != null) await adjustProductStock(old.product_id, old.quantity);
    if (sale.product_id != null) await adjustProductStock(sale.product_id, -sale.quantity);
  }
}

export async function setSalePaid(id: number, paidCents: number): Promise<void> {
  const db = await getDb();
  const status: SaleStatus = paidCents <= 0 ? 'unpaid' : paidCents >= (await getSaleTotal(db, id)) ? 'paid' : 'partial';
  await db.runAsync('UPDATE sales SET paid_cents = ?, status = ? WHERE id = ?', [paidCents, status, id]);
}

async function getSaleTotal(db: SQLite.SQLiteDatabase, id: number): Promise<number> {
  const row = await db.getFirstAsync<{ total_cents: number }>('SELECT total_cents FROM sales WHERE id = ?', [id]);
  return row?.total_cents ?? 0;
}

export async function markSaleFullyPaid(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE sales SET paid_cents = total_cents, status = 'paid' WHERE id = ?", [id]);
}

export async function deleteSale(id: number): Promise<void> {
  const db = await getDb();
  const sale = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
  if (sale && sale.product_id != null) {
    await adjustProductStock(sale.product_id, sale.quantity);
  }
  await db.runAsync('DELETE FROM sales WHERE id = ?', [id]);
}

// -- Aggregate queries -------------------------------------------------------

export interface SalesTotals {
  revenue_cents: number;
  outstanding_cents: number;
  cards_sold: number;
  cost_cents: number;
  profit_cents: number;
  sale_count: number;
}

export function salesTotals(sales: Sale[], products: Product[]): SalesTotals {
  const byId = new Map(products.map((p) => [p.id, p]));
  let revenue = 0;
  let outstanding = 0;
  let cards = 0;
  let cost = 0;
  for (const s of sales) {
    revenue += s.total_cents;
    outstanding += s.total_cents - Math.min(s.paid_cents, s.total_cents);
    cards += s.quantity;
    const p = s.product_id != null ? byId.get(s.product_id) : undefined;
    if (p) cost += s.quantity * p.cost_per_unit_cents;
  }
  return {
    revenue_cents: revenue,
    outstanding_cents: outstanding,
    cards_sold: cards,
    cost_cents: cost,
    profit_cents: revenue - cost,
    sale_count: sales.length,
  };
}

/** Customers flagged for reorder: total quantity sold at/above their threshold. */
export async function reorderCustomers(): Promise<Array<{ customer: Customer; sold_quantity: number; reorder_when_quantity: number }>> {
  const customers = await listCustomers();
  const sales = await listSales(100000);
  const perCustomer = new Map<number, number>();
  for (const s of sales) {
    perCustomer.set(s.customer_id, (perCustomer.get(s.customer_id) ?? 0) + s.quantity);
  }
  const out: Array<{ customer: Customer; sold_quantity: number; reorder_when_quantity: number }> = [];
  for (const c of customers) {
    // reorder threshold is stored on individual sales; use the max set for that customer.
    const thresholds = sales.filter((s) => s.customer_id === c.id && s.reorder_when_quantity != null).map((s) => s.reorder_when_quantity as number);
    const threshold = thresholds.length ? Math.max(...thresholds) : 0;
    const sold = perCustomer.get(c.id) ?? 0;
    if (threshold > 0 && sold >= threshold) {
      out.push({ customer: c, sold_quantity: sold, reorder_when_quantity: threshold });
    }
  }
  return out;
}

