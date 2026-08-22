import type { Habit } from './types';

/** 'YYYY-MM-DD' in local time (never UTC — avoids off-by-one-day bugs). */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** Weekdays (0=Sun…6=Sat) the habit is scheduled for; undefined means every day. */
export function scheduledWeekdays(habit: Habit): number[] | undefined {
  if (!habit.schedule || habit.schedule === 'daily') return undefined;
  return habit.schedule
    .split(',')
    .map((part) => parseInt(part, 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

export function isScheduled(habit: Habit, d: Date): boolean {
  const days = scheduledWeekdays(habit);
  return days === undefined || days.includes(d.getDay());
}

/**
 * Current streak: consecutive scheduled days completed, counting back from today.
 * An unfinished *today* does not break the streak — only a missed past day does.
 */
export function currentStreak(habit: Habit, done: ReadonlySet<string>): number {
  const startKey = dayKey(new Date(habit.created_at));
  let d = new Date();
  if (isScheduled(habit, d) && !done.has(dayKey(d))) d = addDays(d, -1);
  let streak = 0;
  while (dayKey(d) >= startKey) {
    if (isScheduled(habit, d)) {
      if (done.has(dayKey(d))) {
        streak += 1;
        d = addDays(d, -1);
      } else {
        break;
      }
    } else {
      d = addDays(d, -1);
    }
  }
  return streak;
}

/** Longest run of consecutive scheduled days completed since the habit was created. */
export function bestStreak(habit: Habit, done: ReadonlySet<string>): number {
  const startKey = dayKey(new Date(habit.created_at));
  const endKey = todayKey();
  let d = new Date(habit.created_at);
  let best = 0;
  let run = 0;
  while (dayKey(d) <= endKey) {
    if (isScheduled(habit, d)) {
      if (done.has(dayKey(d))) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    d = addDays(d, 1);
  }
  return best;
}

/** Completed / scheduled over the last `days` days (bounded by habit creation). */
export function completionRate(habit: Habit, done: ReadonlySet<string>, days = 30): number {
  let scheduled = 0;
  let completed = 0;
  const startKey = dayKey(new Date(habit.created_at));
  for (let i = 0; i < days; i++) {
    const d = addDays(new Date(), -i);
    if (dayKey(d) < startKey) break;
    if (isScheduled(habit, d)) {
      scheduled += 1;
      if (done.has(dayKey(d))) completed += 1;
    }
  }
  return scheduled === 0 ? 0 : completed / scheduled;
}

export const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function scheduleLabel(habit: Habit): string {
  const days = scheduledWeekdays(habit);
  if (days === undefined) return 'Every day';
  if (days.length === 0) return 'No days';
  return days.map((d) => WEEKDAY_SHORT[d]).join(' · ');
}

export function monthLabel(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatReminder(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatNoteDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (dayKey(d) === dayKey(now)) {
    return `Today, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (dayKey(d) === dayKey(addDays(now, -1))) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}
