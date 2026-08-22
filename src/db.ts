import * as SQLite from 'expo-sqlite';
import type { Completion, ExportBundle, Habit, Note } from './types';

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
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function listHabits(): Promise<Habit[]> {
  const db = await getDb();
  return db.getAllAsync<Habit>('SELECT * FROM habits ORDER BY created_at ASC');
}

export async function createHabit(input: Omit<Habit, 'id'>): Promise<Habit> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO habits (name, emoji, color, schedule, reminder_minutes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.name, input.emoji, input.color, input.schedule, input.reminder_minutes, input.created_at],
  );
  return { ...input, id: Number(result.lastInsertRowId) };
}

export async function updateHabit(habit: Habit): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE habits SET name = ?, emoji = ?, color = ?, schedule = ?, reminder_minutes = ?
     WHERE id = ?`,
    [habit.name, habit.emoji, habit.color, habit.schedule, habit.reminder_minutes, habit.id],
  );
}

export async function deleteHabit(id: number): Promise<void> {
  const db = await getDb();
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
  const [habits, completions, notes] = await Promise.all([listHabits(), allCompletions(), listNotes()]);
  return {
    format: 'habit-tracker-backup',
    version: 2,
    exported_at: new Date().toISOString(),
    habits,
    completions,
    notes,
  };
}

/** Replaces everything in the database with the bundle's contents. */
export async function importBundle(bundle: ExportBundle): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('DELETE FROM completions');
    await tx.runAsync('DELETE FROM habits');
    await tx.runAsync('DELETE FROM notes');
    for (const h of bundle.habits) {
      await tx.runAsync(
        `INSERT INTO habits (id, name, emoji, color, schedule, reminder_minutes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [h.id, h.name, h.emoji ?? '✅', h.color ?? '#4F46E5', h.schedule ?? 'daily', h.reminder_minutes ?? null, h.created_at ?? Date.now()],
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
        `INSERT INTO notes (id, title, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [n.id, n.title ?? '', n.body ?? '', n.created_at ?? Date.now(), n.updated_at ?? Date.now()],
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>('SELECT * FROM notes ORDER BY updated_at DESC');
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
  return { id: Number(result.lastInsertRowId), title: input.title, body: input.body, created_at: now, updated_at: now };
}

export async function updateNote(id: number, input: { title: string; body: string }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE notes SET title = ?, body = ?, updated_at = ? WHERE id = ?',
    [input.title, input.body, Date.now(), id],
  );
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}
