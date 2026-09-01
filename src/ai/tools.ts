import type { AiTool } from './loop-core';
import {
  addWaterLog,
  allCompletions,
  allWaterLogs,
  completionsBetween,
  createLink,
  createNote,
  createTodo,
  dailyRoutineCompletions,
  getNote,
  getWaterPrefs,
  lastTrainedByMuscle,
  listAllDailyRoutineItems,
  listAllTodos,
  listBestScores,
  listBodyEntries,
  listBookNotes,
  listBooks,
  listCollections,
  listDailyRoutines,
  listDreamEntries,
  listFavoriteNotes,
  listHabits,
  listLinks,
  listLinksByCategory,
  listNotes,
  listRoutines,
  listSleepEntries,
  listWorkoutSummaries,
  personalRecords,
  saveSleepEntry,
  scheduledTodos,
  setTodoDone,
  sleepDurationMinutes,
  toggleCompletion,
  trashNote,
  updateNote,
} from '../db';
import {
  addDays,
  bestStreak,
  completionRate,
  currentStreak,
  dayKey,
  routineDayKey,
  scheduleLabel,
  todayKey,
} from '../date-utils';
import { getRoutineItems } from '../db';
import type { Habit } from '../types';
import { currentWaterStreak, formatMl, rollupByDay, shiftDay } from '../water/stats';

const LINK_CATEGORIES = ['video', 'article', 'music', 'social', 'shopping', 'code', 'study', 'tools', 'image', 'other'];

const BODY_METRICS = [
  { id: 'weight', unit: 'kg' },
  { id: 'waist', unit: 'cm' },
  { id: 'chest', unit: 'cm' },
  { id: 'arms', unit: 'cm' },
  { id: 'hips', unit: 'cm' },
  { id: 'thighs', unit: 'cm' },
] as const;

/** JSON.stringify with a safety cap, so huge tables stay small for the model. */
function j(value: unknown, max = 6000): string {
  const out = JSON.stringify(value);
  if (out === undefined) return 'null';
  return out.length > max ? `${out.slice(0, max)}\n…(truncated)` : out;
}

function toDay(value: unknown, fallback: string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return fallback;
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

function toInt(value: unknown, fallback: number): number {
  return Math.round(toNumber(value, fallback));
}

function formatDay(ts: number): string {
  return dayKey(new Date(ts));
}

const numberParam = (desc: string, extra: Record<string, unknown> = {}) => ({
  type: 'number',
  description: desc,
  ...extra,
});
const stringParam = (desc: string, extra: Record<string, unknown> = {}) => ({
  type: 'string',
  description: desc,
  ...extra,
});
const intParam = (desc: string) => ({ type: 'integer', description: desc });
const boolParam = (desc: string) => ({ type: 'boolean', description: desc });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function habitCompletionSets(): Promise<Map<number, Set<string>>> {
  const completions = await allCompletions();
  const map = new Map<number, Set<string>>();
  for (const c of completions) {
    let set = map.get(c.habit_id);
    if (!set) {
      set = new Set();
      map.set(c.habit_id, set);
    }
    set.add(c.day);
  }
  return map;
}

function habitRows(habits: Habit[], doneByHabit: Map<number, Set<string>>) {
  const today = todayKey();
  return habits.map((h) => {
    const done = doneByHabit.get(h.id) ?? new Set();
    return {
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      schedule: scheduleLabel(h),
      done_today: done.has(today) ? 1 : 0,
      current_streak: currentStreak(h, done),
      best_streak: bestStreak(h, done),
      completion_30d_pct: Math.round(completionRate(h, done, 30) * 100),
    };
  });
}

// ---------------------------------------------------------------------------
// Read tools
// ---------------------------------------------------------------------------

const overview: AiTool = {
  name: 'get_overview',
  description:
    'Returns a compact bird’s-eye summary of the whole app: counts per domain, today’s habits, streaks, open tasks, workout volume, sleep, books, links, dreams and high scores. Call this first for "what is going on", "summarize me", "how is my week going", or before deciding which other tools to query.',
  parameters: { type: 'object', properties: {} },
  handler: async () => {
    const today = todayKey();
    const weekAgo = formatDay(Date.now() - 7 * 24 * 3600 * 1000);
    const monthAgo = formatDay(Date.now() - 30 * 24 * 3600 * 1000);

    const habits = await listHabits();
    const doneByHabit = await habitCompletionSets();
    const notes = await listNotes();
    const favoriteNotes = await listFavoriteNotes();
    const collections = await listCollections();
    const allTodos = await listAllTodos();
    const scheduled = await scheduledTodos();
    const routines = await listRoutines();
    const workouts = await listWorkoutSummaries(40);
    const prs = await personalRecords(8);
    const lastTrained = await lastTrainedByMuscle();
    const sleep = await listSleepEntries(30);
    const dreams = await listDreamEntries(200);
    const books = await listBooks();
    const links = await listLinks();
    const dailyRoutines = await listDailyRoutines();
    const drc = await dailyRoutineCompletions(routineDayKey());
    const scores = await listBestScores();

    const openTodos = allTodos.filter((t) => t.done === 0);
    const overdue = scheduled.filter((t) => t.due_at !== null && t.due_at < Date.now() && t.done === 0);
    const dueSoon = scheduled.filter(
      (t) => t.due_at !== null && t.due_at >= Date.now() && t.due_at <= Date.now() + 7 * 24 * 3600 * 1000 && t.done === 0,
    );

    const workoutsThisWeek = workflowsSince(workouts, weekAgo).length;
    const workoutsThisMonth = workflowsSince(workouts, monthAgo).length;
    const volumeThisMonth = workflowsSince(workouts, monthAgo).reduce((sum, w) => sum + w.volume, 0);

    const sleepRecent = sleep
      .slice(0, 7)
      .map((s) => ({
        day: s.day,
        hours: Math.round((sleepDurationMinutes(s.bed_minutes, s.wake_minutes) / 60) * 10) / 10,
        quality: s.quality ?? null,
      }));
    const avgHours =
      sleepRecent.length === 0
        ? null
        : Math.round((sleepRecent.reduce((sum, s) => sum + s.hours, 0) / sleepRecent.length) * 10) / 10;

    const habitToday = habits
      .filter((h) => (doneByHabit.get(h.id) ?? new Set()).has(today))
      .map((h) => h.name);

    const lastTrainedHuman: Record<string, string> = {};
    for (const [muscle, ts] of Object.entries(lastTrained)) {
      lastTrainedHuman[muscle] = `${formatDay(ts)} (${Math.max(0, Math.round((Date.now() - ts) / (24 * 3600 * 1000)))}d ago)`;
    }

    return j({
      today,
      date_hint: `Today is ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      habits: {
        count: habits.length,
        done_today_count: habitToday.length,
        done_today_names: habitToday,
        active_streaks: habits
          .map((h) => currentStreak(h, doneByHabit.get(h.id) ?? new Set()))
          .filter((s) => s > 0)
          .slice(0, 5),
      },
      notes: { total: notes.length, favorites: favoriteNotes.length },
      todos: {
        open: openTodos.length,
        overdue_count: overdue.length,
        due_next_7d_count: dueSoon.length,
        collections: collections.map((c) => ({ id: c.id, name: c.name })),
        overdue_titles: overdue.slice(0, 10).map((t) => t.title),
        upcoming_titles: dueSoon.slice(0, 10).map((t) => t.title),
      },
      routines: routines.map((r) => ({ id: r.id, name: r.name, exercises: r.exercise_count })),
      fitness: {
        total_finished_workouts: workouts.length >= 40 ? `${workouts.length}+ (recent)` : workouts.length,
        workouts_this_week: workoutsThisWeek,
        workouts_this_month: workoutsThisMonth,
        volume_kg_this_month: Math.round(volumeThisMonth),
        top_prs: prs.slice(0, 5).map((p) => ({ name: p.name, best_kg: p.best_weight })),
        last_trained: lastTrainedHuman,
      },
      body: {
        last_weight_kg: await lastBodyValue('weight'),
        last_waist_cm: await lastBodyValue('waist'),
      },
      sleep: {
        last_7_days: sleepRecent,
        avg_hours_last_7: avgHours,
        goal_minutes: 480,
      },
      dreams: { total_recorded: dreams.length, lucid_count: dreams.filter((d) => d.lucid === 1).length },
      books: {
        reading_count: books.filter((b) => b.status === 'reading').length,
        finished_count: books.filter((b) => b.status === 'finished').length,
        wishlist_count: books.filter((b) => b.status === 'wishlist').length,
      },
      links: { count: links.length },
      daily_checklists: {
        routines: dailyRoutines.length,
        items_done_today: drc.length,
      },
      game_high_scores: scores.map((s) => ({ game: s.game, best: s.best })),
    });
  },
};

async function lastBodyValue(metric: string): Promise<number | null> {
  const entries = await listBodyEntries(metric);
  return entries.length > 0 ? entries[0].value : null;
}

function workflowsSince(summaries: Array<{ started_at: number; volume: number }>, fromDay: string): typeof summaries {
  return summaries.filter((w) => dayKey(new Date(w.started_at)) >= fromDay);
}

const listHabitsTool: AiTool = {
  name: 'list_habits',
  description:
    'Lists every habit with its current streak, best streak, 30-day completion % and whether it is done today. Use for "what habits do I have" and consistency questions.',
  parameters: { type: 'object', properties: {} },
  handler: async () => {
    const habits = await listHabits();
    const doneByHabit = await habitCompletionSets();
    return j({ habits: habitRows(habits, doneByHabit) });
  },
};

const getHabitCompletions: AiTool = {
  name: 'get_habit_completions',
  description:
    'Fetches completion dates for a habit (or all habits). Days are "YYYY-MM-DD". Use to analyze consistency, gaps, or a specific period.',
  parameters: {
    type: 'object',
    properties: {
      habit_id: numberParam('Optional habit id. Omit for every habit.', {}),
      from_day: stringParam('Optional "YYYY-MM-DD", inclusive. Defaults to 60 days ago.'),
      to_day: stringParam('Optional "YYYY-MM-DD", inclusive. Defaults to today.'),
    },
    required: [],
  },
  handler: async (args) => {
    const habitId = args.habit_id === undefined ? null : toInt(args.habit_id, -1);
    const toDay2 = toDay(args.to_day, todayKey());
    const fromDay = toDay(args.from_day, dayKey(addDays(new Date(), -60)));
    let completions = await completionsBetween(fromDay, toDay2);
    if (habitId !== null && habitId > 0) {
      completions = completions.filter((c) => c.habit_id === habitId);
    }
    const byHabit = new Map<number, string[]>();
    for (const c of completions) {
      const arr = byHabit.get(c.habit_id) ?? [];
      arr.push(c.day);
      byHabit.set(c.habit_id, arr);
    }
    const habits = await listHabits();
    return j(
      habits
        .filter((h) => habitId === null || h.id === habitId)
        .map((h) => ({ habit_id: h.id, habit: h.name, days_completed: (byHabit.get(h.id) ?? []).sort() })),
    );
  },
};

const searchNotes: AiTool = {
  name: 'search_notes',
  description:
    'Searches notes by text in title or body (case-insensitive). Returns up to 25 notes with truncated body snippets. Use "find my notes about X"',
  parameters: {
    type: 'object',
    properties: {
      query: stringParam('Required search text.'),
      favorites_only: boolParam('Optional. Only search favorite notes.'),
      limit: intParam('Optional max results (default 25).'),
    },
    required: ['query'],
  },
  handler: async (args) => {
    const query = String(args.query ?? '').toLowerCase();
    const favoritesOnly = args.favorites_only === true;
    const limit = toInt(args.limit, 25);
    let notes = favoritesOnly ? await listFavoriteNotes() : await listNotes();
    notes = notes.filter((n) => n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query));
    notes = notes.slice(0, limit);
    return j({
      count: notes.length,
      notes: notes.map((n) => ({ id: n.id, title: n.title, body_excerpt: n.body.slice(0, 400), favorite: n.favorite })),
    });
  },
};

const getNoteTool: AiTool = {
  name: 'get_note',
  description: 'Returns the full content of a single note by id. Use after search_notes or list_notes.',
  parameters: {
    type: 'object',
    properties: { note_id: numberParam('The note id.') },
    required: ['note_id'],
  },
  handler: async (args) => {
    const note = await getNote(toInt(args.note_id, -1));
    return note ? j({ id: note.id, title: note.title, body: note.body, favorite: note.favorite, created_ms: note.created_at }) : j({ error: 'note not found' });
  },
};

const listNotesTool: AiTool = {
  name: 'list_notes',
  description: 'Lists the most recently updated notes (title + truncated body + favorite flag). For "what notes do I have".',
  parameters: {
    type: 'object',
    properties: {
      limit: intParam('Optional max results (default 20).'),
      include_favorites_only: boolParam('Optional. Only notes marked as favorite.'),
    },
    required: [],
  },
  handler: async (args) => {
    const limit = toInt(args.limit, 20);
    let notes = args.include_favorites_only === true ? await listFavoriteNotes() : await listNotes();
    notes = notes.slice(0, limit);
    return j({
      count: notes.length,
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        excerpt: n.body.slice(0, 300),
        favorite: n.favorite,
        updated_day: dayKey(new Date(n.updated_at)),
      })),
    });
  },
};

const listTodosTool: AiTool = {
  name: 'list_todos',
  description:
    'Lists to-dos: quick tasks, scheduled (split into overdue / due soon / later), and each collection. Shows done state and due times',
  parameters: { type: 'object', properties: {} },
  handler: async () => {
    const collections = await listCollections();
    const scheduled = await scheduledTodos();
    const now = Date.now();
    const quick = (await listAllTodos()).filter((t) => t.collection_id === null && t.due_at === null);
    const colTodos = new Map<number, Array<{ title: string; done: number }>>();
    for (const c of collections) {
      colTodos.set(c.id, []);
    }
    for (const t of await listAllTodos()) {
      if (t.collection_id !== null) {
        const list = colTodos.get(t.collection_id) ?? [];
        list.push({ title: t.title, done: t.done });
        colTodos.set(t.collection_id, list);
      }
    }
    const fmt = (ts: number) => new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    return j({
      quick_tasks: quick.map((t) => ({ id: t.id, title: t.title, done: t.done })),
      scheduled: {
        overdue: scheduled.filter((t) => t.done === 0 && t.due_at !== null && t.due_at < now).map((t) => ({ id: t.id, title: t.title, due: t.due_at !== null ? fmt(t.due_at) : null })),
        due_next_7d: scheduled.filter((t) => t.done === 0 && t.due_at !== null && t.due_at >= now && t.due_at <= now + 7 * 24 * 3600 * 1000).map((t) => ({ id: t.id, title: t.title, due: t.due_at !== null ? fmt(t.due_at) : null })),
        later: scheduled.filter((t) => t.done === 0 && (t.due_at === null || t.due_at > now + 7 * 24 * 3600 * 1000)).map((t) => ({ id: t.id, title: t.title })),
        done: scheduled.filter((t) => t.done === 1).map((t) => t.title),
      },
      collections: collections.map((c) => ({ id: c.id, name: c.name, items: colTodos.get(c.id) })),
    });
  },
};

const listRoutinesTool: AiTool = {
  name: 'list_routines',
  description: 'Lists gym routines and their exercises (sets × reps per exercise). For "what are my routines" or picking a workout plan',
  parameters: { type: 'object', properties: {} },
  handler: async () => {
    const routines = await listRoutines();
    const out = [];
    for (const r of routines) {
      const items = await getRoutineItems(r.id);
      out.push({
        id: r.id,
        name: r.name,
        exercises: items.map((i) => ({ name: i.exercise_name, sets: i.target_sets, reps: i.target_reps })),
      });
    }
    return j({ routines: out });
  },
};

const listWorkoutsTool: AiTool = {
  name: 'list_workouts',
  description:
    'Recent finished workouts (name, day, exercise count, total volume kg), top personal records, and when each muscle was last trained. For "what did I train", "am I progressing", "how many workouts".',
  parameters: {
    type: 'object',
    properties: { limit: intParam('Optional number of workouts (default 30).') },
    required: [],
  },
  handler: async (args) => {
    const limit = toInt(args.limit, 30);
    const workouts = await listWorkoutSummaries(limit);
    const prs = await personalRecords(10);
    const lastTrained = await lastTrainedByMuscle();
    const lastTrainedHuman: Record<string, string> = {};
    for (const [muscle, ts] of Object.entries(lastTrained)) {
      lastTrainedHuman[muscle] = `${formatDay(ts)} (${Math.max(0, Math.round((Date.now() - ts) / (24 * 3600 * 1000)))}d ago)`;
    }
    return j({
      recent_workouts: workouts.map((w) => ({
        id: w.id,
        name: w.name || 'Workout',
        day: formatDay(w.started_at),
        exercise_count: w.exercise_count,
        volume_kg: Math.round(w.volume),
      })),
      personal_records: prs.map((p) => ({ name: p.name, best_weight_kg: p.best_weight, est_1rm_kg: Math.round(p.best_e1rm) })),
      last_trained_per_muscle: lastTrainedHuman,
    });
  },
};

const getBodyMetrics: AiTool = {
  name: 'get_body_metrics',
  description:
    'Body measurements: weight (kg) and waist/chest/arms/hips/thighs (cm). Returns the latest value and the last 15 logged entries per metric.',
  parameters: { type: 'object', properties: {} },
  handler: async () => {
    const out: Record<string, unknown> = {};
    for (const metric of BODY_METRICS) {
      const entries = await listBodyEntries(metric.id);
      out[metric.id] = {
        latest_value: entries.length > 0 ? entries[0].value : null,
        unit: metric.unit,
        recent: entries.slice(0, 15).map((e) => ({ day: e.day, value: e.value })),
      };
    }
    return j(out);
  },
};

const listSleepTool: AiTool = {
  name: 'list_sleep',
  description:
    'Sleep log: day, bed/wake time, hours slept, quality 1-5. Recent 30 first. For "how have I been sleeping".',
  parameters: { type: 'object', properties: {} },
  handler: async () => {
    const entries = await listSleepEntries(30);
    return j({
      entries: entries.map((s) => ({
        day: s.day,
        hours: Math.round((sleepDurationMinutes(s.bed_minutes, s.wake_minutes) / 60) * 10) / 10,
        bed_minutes_from_midnight: s.bed_minutes,
        wake_minutes_from_midnight: s.wake_minutes,
        quality: s.quality ?? null,
      })),
    });
  },
};

const listDreamsTool: AiTool = {
  name: 'list_dreams',
  description: 'Dream journal entries (day, title, whether lucid, truncated body). Latest first.',
  parameters: { type: 'object', properties: {} },
  handler: async () => {
    const entries = await listDreamEntries(60);
    return j({
      entries: entries.map((d) => ({
        id: d.id,
        day: d.day,
        title: d.title,
        lucid: d.lucid === 1,
        body_excerpt: d.body.slice(0, 500),
      })),
    });
  },
};

const listBooksTool: AiTool = {
  name: 'list_books',
  description:
    'Books: reading/finished/wishlist, pages read vs total, rating, and note counts. For "what am I reading" or book progress.',
  parameters: {
    type: 'object',
    properties: {
      status: stringParam('Optional filter: "reading", "finished" or "wishlist".'),
    },
    required: [],
  },
  handler: async (args) => {
    const status = String(args.status ?? '');
    const books = await listBooks(
      status === 'reading' || status === 'finished' || status === 'wishlist' ? (status as 'reading' | 'finished' | 'wishlist') : undefined,
    );
    const notes = await listBookNotes();
    const notesByBook = new Map<number, number>();
    for (const n of notes) notesByBook.set(n.book_id, (notesByBook.get(n.book_id) ?? 0) + 1);
    return j({
      books: books.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        status: b.status,
        pages_read: b.pages_read,
        total_pages: b.total_pages,
        progress_pct: b.total_pages ? Math.round((b.pages_read / b.total_pages) * 100) : null,
        rating: b.rating ?? null,
        notes_count: notesByBook.get(b.id) ?? 0,
        finished_day: b.finished_at ? formatDay(b.finished_at) : null,
      })),
    });
  },
};

const getBookNotes: AiTool = {
  name: 'get_book_notes',
  description: 'Notes taken about books (title + body). Optionally filter to one book id.',
  parameters: {
    type: 'object',
    properties: { book_id: numberParam('Optional book id.') },
    required: [],
  },
  handler: async (args) => {
    const bookId = args.book_id === undefined ? undefined : toInt(args.book_id, -1);
    const notes = bookId === undefined ? await listBookNotes() : await listBookNotes(bookId);
    return j({
      notes: notes.map((n) => ({ id: n.id, book_id: n.book_id, title: n.title, excerpt: n.body.slice(0, 400) })),
    });
  },
};

const listLinksTool: AiTool = {
  name: 'list_links',
  description: 'Saved links, optionally filtered by category or only favorites, with an optional text search over title/note.',
  parameters: {
    type: 'object',
    properties: {
      category: stringParam(`One of: ${LINK_CATEGORIES.join(', ')}.`),
      favorites_only: boolParam('Optional.'),
      search: stringParam('Optional text to match against title and note.'),
    },
    required: [],
  },
  handler: async (args) => {
    const category = String(args.category ?? '');
    const favoritesOnly = args.favorites_only === true;
    const search = args.search ? String(args.search).toLowerCase() : '';
    let links = category && LINK_CATEGORIES.includes(category as never) ? await listLinksByCategory(category as never) : await listLinks(favoritesOnly);
    if (search) {
      links = links.filter((l) => l.title.toLowerCase().includes(search) || l.note.toLowerCase().includes(search));
    }
    return j({
      links: links.slice(0, 40).map((l) => ({
        id: l.id,
        title: l.title || l.url,
        url: l.url,
        category: l.category,
        favorite: l.favorite,
        note: l.note.slice(0, 200),
      })),
    });
  },
};

const getBestScores: AiTool = {
  name: 'get_best_scores',
  description:
    'Game high scores: 2048 (points), snake (points), minesweeper-easy (seconds, lower is better), memory (moves, lower better), ttt (win streak), reaction (ms, lower better), sudoku-easy (seconds), fifteen (moves), mastermind (guesses, lower better).',
  parameters: { type: 'object', properties: {} },
  handler: async () => j({ scores: await listBestScores() }),
};

const listDailyRoutinesTool: AiTool = {
  name: 'list_daily_routines',
  description:
    'Daily checklist routines (they reset each day at noon) with which items are already checked in the current day window. For "what is in my morning routine" or "what did I complete today".',
  parameters: { type: 'object', properties: {} },
  handler: async () => {
    const routines = await listDailyRoutines();
    const drc = await dailyRoutineCompletions(routineDayKey());
    const doneIds = new Set(drc.map((c) => c.item_id));
    const items = await listAllDailyRoutineItems();
    return j({
      day_window: routineDayKey(),
      routines: routines.map((r) => ({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        items: items
          .filter((i) => i.routine_id === r.id)
          .map((i) => ({ id: i.id, title: i.title, done_today: doneIds.has(i.id) ? 1 : 0 })),
      })),
    });
  },
};

const getWaterTool: AiTool = {
  name: 'get_water',
  description:
    'Water intake: daily total vs the target (in millilitres), current streak, a per-day breakdown for the last N days, and lifetime total. Use for "how much did I drink", "did I hit my water goal", or hydration questions.',
  parameters: {
    type: 'object',
    properties: {
      day: stringParam('Optional "YYYY-MM-DD". Defaults to today.'),
      days: numberParam('Optional window length ending at `day` (1-30, default 7).'),
    },
    required: [],
  },
  handler: async (args) => {
    const prefs = await getWaterPrefs();
    const target = prefs.target_ml;
    const baseDay = toDay(args.day, todayKey());
    const window = Math.min(30, Math.max(1, toInt(args.days, 7)));
    const logs = await allWaterLogs();
    const totals = rollupByDay(logs);
    const fromDay = shiftDay(baseDay, -(window - 1));
    const dayTotal = totals.get(baseDay) ?? 0;

    const days = [];
    let key = fromDay;
    for (let i = 0; i < window; i++) {
      days.push({ day: key, ml: totals.get(key) ?? 0 });
      key = shiftDay(key, 1);
    }

    return j({
      target_ml: target,
      day: baseDay,
      day_total_ml: dayTotal,
      day_remaining_ml: Math.max(0, target - dayTotal),
      day_met_goal: dayTotal >= target ? 1 : 0,
      current_streak_days: currentWaterStreak(totals, target, baseDay),
      last_n_days: days,
      lifetime_total_ml: logs.reduce((sum, l) => sum + l.ml, 0),
    });
  },
};

const logWaterTool: AiTool = {
  name: 'log_water',
  description:
    'WRITE — logs water drunk. Use when the user asks to record a glass/sip of water. ml is the amount in millilitres (e.g. a standard glass is 250).',
  parameters: {
    type: 'object',
    properties: {
      ml: numberParam('Amount in millilitres.'),
      day: stringParam('Optional "YYYY-MM-DD". Defaults to today.'),
    },
    required: ['ml'],
  },
  handler: async (args) => {
    const ml = Math.min(5000, Math.max(1, Math.round(toNumber(args.ml, 0))));
    const day = toDay(args.day, todayKey());
    await addWaterLog(day, ml);
    return j({ day, logged_ml: ml });
  },
  actionText: (_args, result) => {
    try {
      const d = JSON.parse(result);
      const label = d.day === todayKey() ? 'today' : d.day;
      return `» Logged ${formatMl(Number(d.logged_ml ?? 0))} of water (${label})`;
    } catch {
      return '» Water logged';
    }
  },
};

// ---------------------------------------------------------------------------
// Write tools
// ---------------------------------------------------------------------------

const toggleHabitCompletion: AiTool = {
  name: 'toggle_habit_completion',
  description:
    'WRITE — checks a habit off for a day, or unchecks it if already done (it toggles). Use when the user asks to mark a habit done/undone for today or a past day.',
  parameters: {
    type: 'object',
    properties: {
      habit_id: numberParam('The habit id (from list_habits).'),
      day: stringParam('Local day "YYYY-MM-DD". Defaults to today.'),
    },
    required: ['habit_id'],
  },
  handler: async (args) => {
    const habitId = toInt(args.habit_id, -1);
    const day = toDay(args.day, todayKey());
    const habits = await listHabits();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return j({ error: `No habit with id ${habitId}` });
    const dayComps = await completionsBetween(day, day);
    const wasDone = dayComps.some((c) => c.habit_id === habitId);
    await toggleCompletion(habitId, day);
    return j({ habit: habit.name, day, now_completed: !wasDone });
  },
  actionText: (args, result) => {
    try {
      const d = JSON.parse(result);
      const on = d.now_completed ? 'Marked' : 'Un-marked';
      const label = d.day === todayKey() ? 'today' : d.day;
      return `» ${on} ${d.habit || 'habit'} done (${label})`;
    } catch {
      return `» Toggled habit #${String(args.habit_id)}`;
    }
  },
};

const createNoteTool: AiTool = {
  name: 'create_note',
  description: 'WRITE — creates a new note. Use when the user asks you to save a text, idea or note.',
  parameters: {
    type: 'object',
    properties: {
      title: stringParam('Note title (can be empty).'),
      body: stringParam('Note body.'),
    },
    required: ['body'],
  },
  handler: async (args) => {
    const note = await createNote({ title: String(args.title ?? ''), body: String(args.body ?? '') });
    return j({ id: note.id, title: note.title });
  },
  actionText: (_args, result) => {
    try {
      const d = JSON.parse(result);
      return `» Note created: ${d.title || '(untitled)'}`;
    } catch {
      return '» Note created';
    }
  },
};

const updateNoteTool: AiTool = {
  name: 'update_note',
  description: 'WRITE — edits an existing note\'s title and/or body by id. Use when the user asks to change a note.',
  parameters: {
    type: 'object',
    properties: {
      note_id: numberParam('The note id.'),
      title: stringParam('New title (optional).'),
      body: stringParam('New body (optional).'),
    },
    required: ['note_id'],
  },
  handler: async (args) => {
    const id = toInt(args.note_id, -1);
    const note = await getNote(id);
    if (!note) return j({ error: 'note not found' });
    const title = args.title !== undefined ? String(args.title) : note.title;
    const body = args.body !== undefined ? String(args.body) : note.body;
    await updateNote(id, { title, body });
    return j({ id, title });
  },
  actionText: (_args, result) => {
    try {
      const d = JSON.parse(result);
      return `» Note updated: ${d.title || '(untitled)'}`;
    } catch {
      return '» Note updated';
    }
  },
};

const trashNoteTool: AiTool = {
  name: 'trash_note',
  description: 'WRITE — moves a note to the Trash (recoverable from Notes > Trash). Only when the user explicitly asks to delete a note.',
  parameters: {
    type: 'object',
    properties: { note_id: numberParam('The note id.') },
    required: ['note_id'],
  },
  handler: async (args) => {
    const id = toInt(args.note_id, -1);
    const note = await getNote(id);
    if (!note) return j({ error: 'note not found' });
    await trashNote(id);
    return j({ id, title: note.title });
  },
  actionText: (_args, result) => {
    try {
      const d = JSON.parse(result);
      return `» Moved note to Trash: ${d.title || `#${String(d.id)}`}`;
    } catch {
      return '» Note moved to Trash';
    }
  },
};

const createTodoTool: AiTool = {
  name: 'create_todo',
  description:
    'WRITE — creates a to-do task. collection_id is optional (omit for Quick tasks); due_at is optional (epoch ms or "YYYY-MM-DDTHH:mm:ss" ISO).',
  parameters: {
    type: 'object',
    properties: {
      title: stringParam('Task text.'),
      collection_id: numberParam('Optional collection id (see list_todos).'),
      due_at: stringParam('Optional due date: epoch ms number or ISO date string.'),
    },
    required: ['title'],
  },
  handler: async (args) => {
    const title = String(args.title ?? '');
    if (!title.trim()) return j({ error: 'title is required' });
    const collectionId = args.collection_id === undefined || args.collection_id === null ? null : toInt(args.collection_id, -1);
    if (collectionId !== null && collectionId < 0) return j({ error: 'collection_id must be a valid id or null' });
    let dueAt: number | null = null;
    if (args.due_at !== undefined && args.due_at !== null) {
      const raw = String(args.due_at);
      const parsed = /^\d+$/.test(raw) ? parseInt(raw, 10) : Date.parse(raw);
      if (!Number.isFinite(parsed)) return j({ error: 'due_at could not be parsed' });
      dueAt = parsed;
    }
    const todo = await createTodo({ collection_id: collectionId, title, due_at: dueAt });
    return j({ id: todo.id, title, collection_id: collectionId, due_at: dueAt });
  },
  actionText: (_args, result) => {
    try {
      const d = JSON.parse(result);
      return `» To-do created: ${d.title}${d.due_at ? ' (with due time)' : ''}`;
    } catch {
      return '» To-do created';
    }
  },
};

const setTodoDoneTool: AiTool = {
  name: 'set_todo_done',
  description: 'WRITE — marks a to-do as done or not done. Use when the user asks to check off (or restore) a task.',
  parameters: {
    type: 'object',
    properties: {
      todo_id: numberParam('The to-do id (from list_todos).'),
      done: boolParam('true = checked off, false = uncheck.'),
    },
    required: ['todo_id', 'done'],
  },
  handler: async (args) => {
    const id = toInt(args.todo_id, -1);
    const done = args.done === true;
    const all = await listAllTodos();
    const todo = all.find((t) => t.id === id);
    if (!todo) return j({ error: 'todo not found' });
    await setTodoDone(id, done);
    return j({ id, title: todo.title, done });
  },
  actionText: (_args, result) => {
    try {
      const d = JSON.parse(result);
      return `» ${d.done ? 'Completed' : 'Reopened'} to-do: ${d.title}`;
    } catch {
      return '» To-do updated';
    }
  },
};

const logSleepTool: AiTool = {
  name: 'log_sleep',
  description:
    'WRITE — saves/updates a sleep entry. bed_minutes and wake_minutes are minutes from midnight (e.g. bed 23:30 = 1410, wake 07:00 = 420).',
  parameters: {
    type: 'object',
    properties: {
      day: stringParam('"YYYY-MM-DD" of the morning you woke up.'),
      bed_minutes: numberParam('Bedtime, minutes from midnight (can be > 1440).'),
      wake_minutes: numberParam('Wake time, minutes from midnight.'),
      quality: numberParam('Optional quality 1-5.'),
    },
    required: ['day', 'bed_minutes', 'wake_minutes'],
  },
  handler: async (args) => {
    const day = toDay(args.day, todayKey());
    const bed = toNumber(args.bed_minutes, -1);
    const wake = toNumber(args.wake_minutes, -1);
    if (bed < 0 || wake < 0 || bed > 2880 || wake > 2880) return j({ error: 'minutes must be between 0 and 2880' });
    const quality = args.quality === undefined || args.quality === null ? null : toInt(args.quality, 3);
    await saveSleepEntry({ day, bed_minutes: bed, wake_minutes: wake, quality });
    return j({ day, bed_minutes: bed, wake_minutes: wake, hours: Math.round((sleepDurationMinutes(bed, wake) / 60) * 10) / 10, quality });
  },
  actionText: (_args, result) => {
    try {
      const d = JSON.parse(result);
      return `» Sleep logged for ${d.day} (${d.hours} h)`;
    } catch {
      return '» Sleep logged';
    }
  },
};

const createLinkTool: AiTool = {
  name: 'create_link',
  description:
    'WRITE — saves a link (URL) into the Links app with an optional category, title and note. Use when the user asks to save a link.',
  parameters: {
    type: 'object',
    properties: {
      url: stringParam('The link URL.'),
      title: stringParam('Optional display title.'),
      category: stringParam(`Optional category: ${LINK_CATEGORIES.join(' / ')}. Default "other".`),
      note: stringParam('Optional note.'),
    },
    required: ['url'],
  },
  handler: async (args) => {
    const url = String(args.url ?? '');
    if (!/^https?:\/\//i.test(url)) return j({ error: 'url must start with http(s)://' });
    const category = LINK_CATEGORIES.includes(String(args.category)) ? (String(args.category) as never) : 'other';
    const link = await createLink({
      url,
      title: String(args.title ?? ''),
      category,
      note: String(args.note ?? ''),
      favorite: false,
    });
    return j({ id: link.id, title: link.title || link.url });
  },
  actionText: (_args, result) => {
    try {
      const d = JSON.parse(result);
      return `» Link saved: ${d.title}`;
    } catch {
      return '» Link saved';
    }
  },
};

// ---------------------------------------------------------------------------

export const READ_TOOLS: AiTool[] = [
  overview,
  listHabitsTool,
  getHabitCompletions,
  searchNotes,
  getNoteTool,
  listNotesTool,
  listTodosTool,
  listRoutinesTool,
  listWorkoutsTool,
  getBodyMetrics,
  listSleepTool,
  listDreamsTool,
  listBooksTool,
  getBookNotes,
  listLinksTool,
  getBestScores,
  listDailyRoutinesTool,
  getWaterTool,
];

export const WRITE_TOOLS: AiTool[] = [
  toggleHabitCompletion,
  createNoteTool,
  updateNoteTool,
  trashNoteTool,
  createTodoTool,
  setTodoDoneTool,
  logSleepTool,
  createLinkTool,
  logWaterTool,
];

export const ALL_TOOLS: AiTool[] = [...READ_TOOLS, ...WRITE_TOOLS];