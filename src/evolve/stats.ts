import type { Completion, Goal, Habit } from '../types';
import { addDays, bestStreak, dayKey, isScheduled, todayKey } from '../date-utils';

/** Last `n` day keys (oldest → newest), ending at `end`. */
export function dayKeys(n: number, end = todayKey()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(dayKey(addDays(new Date(`${end}T12:00:00`), -i)));
  }
  return out;
}

/** 'habitId:day' keys, one per completion. */
export function completedSet(completions: Completion[]): Set<string> {
  return new Set(completions.map((c) => `${c.habit_id}:${c.day}`));
}

/** Day keys completed per habit — what currentStreak/bestStreak expect. */
export function perHabitDone(completions: Completion[]): Map<number, Set<string>> {
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

export interface DayStat {
  day: string;
  /** Number of habits scheduled that day. */
  expected: number;
  /** Number of scheduled habits actually completed. */
  done: number;
  /** Heatmap intensity 0..4. */
  level: number;
}

function buildDayStats(habits: Habit[], completions: Completion[], days: number): {
  stats: DayStat[];
  scheduled: number;
  completed: number;
} {
  const keys = dayKeys(days);
  const doneSet = completedSet(completions);
  const stats: DayStat[] = keys.map((day) => {
    const date = new Date(`${day}T12:00:00`);
    const due = habits.filter((h) => isScheduled(h, date));
    const expected = due.length;
    const done = due.filter((h) => doneSet.has(`${h.id}:${day}`)).length;
    let level = 0;
    if (expected > 0 && done > 0) {
      const ratio = done / expected;
      level = ratio >= 1.5 ? 4 : ratio >= 1 ? 3 : ratio >= 0.5 ? 2 : 1;
    }
    return { day, expected, done, level };
  });
  return {
    stats,
    scheduled: stats.reduce((a, s) => a + s.expected, 0),
    completed: stats.reduce((a, s) => a + s.done, 0),
  };
}

/** Habit Accuracy: scheduled instances completed over the last `days` days. */
export function habitAccuracy(habits: Habit[], completions: Completion[], days = 30): number {
  const { scheduled, completed } = buildDayStats(habits, completions, days);
  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
}

/** Consistency Score: mean share of scheduled habits completed per day. */
export function habitConsistency(habits: Habit[], completions: Completion[], days = 30): number {
  const { stats } = buildDayStats(habits, completions, days);
  const weighted = stats.filter((s) => s.expected > 0);
  if (weighted.length === 0) return 0;
  const avg = weighted.reduce((a, s) => a + s.done / s.expected, 0) / weighted.length;
  return Math.round(avg * 100);
}

/** Days with at least one completion in the window (the gauge / heatmap number). */
export function hitDays(habits: Habit[], completions: Completion[], days = 60): number {
  const seen = new Set<string>();
  for (const c of completions) seen.add(c.day);
  const keys = dayKeys(days);
  const habitsByDay = keys.map((day) => {
    const date = new Date(`${day}T12:00:00`);
    return habits.some((h) => isScheduled(h, date));
  });
  return keys.reduce((n, key, i) => (habitsByDay[i] && seen.has(key) ? n + 1 : n), 0);
}

/** 60-cell heatmap for the dashboard. */
export function heatmap(habits: Habit[], completions: Completion[], days = 60): DayStat[] {
  return buildDayStats(habits, completions, days).stats;
}

/** 0..100 overall score blending accuracy and hit-days coverage. */
export function overallScore(habits: Habit[], completions: Completion[], days = 60): number {
  const acc = habitAccuracy(habits, completions, 30);
  const coverage = habits.length === 0 ? 0 : (hitDays(habits, completions, days) / days) * 100;
  return Math.round(acc * 0.7 + coverage * 0.3);
}

export interface CategoryStat {
  sphere: string;
  label: string;
  count: number;
  rate: number;
}

const SPHERE_LABELS: Record<string, string> = {
  body: 'Body',
  intellect: 'Intellect',
  career: 'Career',
  life: 'Life',
};

/** Completion rate per life sphere over the last `days` days. */
export function categoryStats(
  habits: Habit[],
  completions: Completion[],
  days = 60,
): CategoryStat[] {
  const { stats } = buildDayStats(habits, completions, days);
  const bySphere = new Map<string, { scheduled: number; completed: number; count: number }>();
  for (const s of stats) {
    const date = new Date(`${s.day}T12:00:00`);
    for (const h of habits) {
      if (!isScheduled(h, date)) continue;
      const key = (h.sphere ?? 'body') as string;
      const entry = bySphere.get(key) ?? { scheduled: 0, completed: 0, count: 0 };
      entry.scheduled += 1;
      if (completedSet(completions).has(`${h.id}:${s.day}`)) entry.completed += 1;
      bySphere.set(key, entry);
    }
  }
  const out: CategoryStat[] = [];
  const sphereCount = new Map<string, number>();
  for (const h of habits) {
    const key = (h.sphere ?? 'body') as string;
    sphereCount.set(key, (sphereCount.get(key) ?? 0) + 1);
  }
  for (const [sphere, stats2] of bySphere) {
    const entry = sphereCount.get(sphere) ?? 0;
    out.push({
      sphere,
      label: SPHERE_LABELS[sphere] ?? sphere,
      count: entry,
      rate: stats2.scheduled === 0 ? 0 : Math.round((stats2.completed / stats2.scheduled) * 100),
    });
  }
  for (const [sphere, count] of sphereCount) {
    if (!bySphere.has(sphere)) {
      out.push({ sphere, label: SPHERE_LABELS[sphere] ?? sphere, count, rate: 0 });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

export interface GoalProgress {
  /** Percent of scheduled habit instances completed so far. */
  percent: number;
  /** progress - elapsed, in percent. Positive means ahead of schedule. */
  ahead: number;
}

/**
 * Goal progress: completions of the linked habits vs the occurrences that were
 * scheduled between the goal's creation day and today (future days don't count —
 * you cannot complete them yet). `ahead` compares that progress against the share
 * of the goal window that has already elapsed.
 */
export function goalProgress(
  goal: Goal,
  linked: Habit[],
  completions: Completion[],
  baseDay = todayKey(),
): GoalProgress {
  const startDay = dayKey(new Date(goal.created_at));
  const end = goal.target_day < baseDay ? goal.target_day : baseDay;
  const doneSet = completedSet(completions);
  let expected = 0;
  let done = 0;
  let d = new Date(`${startDay}T12:00:00`);
  while (dayKey(d) <= end) {
    for (const h of linked) {
      if (isScheduled(h, d)) {
        expected += 1;
        if (doneSet.has(`${h.id}:${dayKey(d)}`)) done += 1;
      }
    }
    d = addDays(d, 1);
  }
  const percent = expected === 0 ? 0 : Math.min(100, Math.round((done / expected) * 100));
  const totalDays = Math.max(
    1,
    Math.round((new Date(`${goal.target_day}T12:00:00`).getTime() - new Date(`${startDay}T12:00:00`).getTime()) / 86400000),
  );
  const elapsedDays = Math.max(
    0,
    Math.round((new Date(`${baseDay}T12:00:00`).getTime() - new Date(`${startDay}T12:00:00`).getTime()) / 86400000),
  );
  const elapsedPct = (elapsedDays / totalDays) * 100;
  return { percent, ahead: Math.round(percent - elapsedPct) };
}

/** Longest best-streak across all habits. */
export function longestStreak(habits: Habit[], completions: Completion[]): number {
  const byHabit = perHabitDone(completions);
  return habits.reduce((best, h) => Math.max(best, bestStreak(h, byHabit.get(h.id) ?? new Set())), 0);
}