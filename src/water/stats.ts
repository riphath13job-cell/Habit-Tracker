import type { WaterLog } from '../types';

export function rollupByDay(logs: WaterLog[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const log of logs) {
    totals.set(log.day, (totals.get(log.day) ?? 0) + log.ml);
  }
  return totals;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Shifts a 'YYYY-MM-DD' key by `delta` days (handles month/year boundaries). */
export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Days where the daily total reached the target, counting back from today. */
export function currentWaterStreak(
  totals: ReadonlyMap<string, number>,
  target: number,
  today: string,
): number {
  const start = (totals.get(today) ?? 0) >= target ? today : shiftDay(today, -1);
  let streak = 0;
  let key = start;
  while ((totals.get(key) ?? 0) >= target) {
    streak += 1;
    key = shiftDay(key, -1);
  }
  return streak;
}

export function bestWaterStreak(
  totals: ReadonlyMap<string, number>,
  target: number,
): number {
  const days = [...totals.keys()].sort();
  if (days.length === 0) return 0;
  const first = days[0];
  const last = days[days.length - 1];
  let best = 0;
  let run = 0;
  let key = first;
  let guard = 0;
  while (key <= last && guard < 4000) {
    if ((totals.get(key) ?? 0) >= target) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    guard += 1;
    key = shiftDay(key, 1);
  }
  return best;
}

/** Fraction of days in [from, to] that reached the target; null if no days in range. */
export function hitRate(
  totals: ReadonlyMap<string, number>,
  target: number,
  fromKey: string,
  toKey: string,
): number | null {
  let hit = 0;
  let total = 0;
  let key = fromKey;
  let guard = 0;
  while (key <= toKey && guard < 4000) {
    total += 1;
    if ((totals.get(key) ?? 0) >= target) hit += 1;
    guard += 1;
    key = shiftDay(key, 1);
  }
  return total === 0 ? null : hit / total;
}

/** Contiguous day range (inclusive), oldest first — for the 7-day chart. */
export function dayRangeTotals(
  totals: ReadonlyMap<string, number>,
  fromKey: string,
  toKey: string,
): Array<{ day: string; total: number }> {
  const out: Array<{ day: string; total: number }> = [];
  let key = fromKey;
  let guard = 0;
  while (key <= toKey && guard < 4000) {
    out.push({ day: key, total: totals.get(key) ?? 0 });
    guard += 1;
    key = shiftDay(key, 1);
  }
  return out;
}

export function formatMl(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000;
    return `${Number.isInteger(liters) ? liters : liters.toFixed(1)} L`;
  }
  return `${ml} ml`;
}

export interface WaterChallenge {
  id: string;
  title: string;
  detail: string;
  /** 0..1 progress (capped). */
  progress: number;
  /** Human label of progress, e.g. "3/7" or "48%". */
  progressLabel: string;
  done: boolean;
}

export function evaluateChallenges(
  totals: ReadonlyMap<string, number>,
  target: number,
  today: string,
  totalLogs: number,
  totalMl: number,
): WaterChallenge[] {
  const streak = currentWaterStreak(totals, target, today);
  const best = bestWaterStreak(totals, target);
  const todayTotal = totals.get(today) ?? 0;
  const monthAgo = shiftDay(today, -29);
  const last30Rate = hitRate(totals, target, monthAgo, today);
  const loggedDays = totals.size;

  const pct = (n: number) => Math.min(1, n);

  return [
    {
      id: 'first-sip',
      title: 'First sip',
      detail: 'Log your first water',
      progress: totalLogs > 0 ? 1 : 0,
      progressLabel: totalLogs > 0 ? 'Done' : '0 glasses',
      done: totalLogs > 0,
    },
    {
      id: 'today',
      title: 'Hit today\u2019s goal',
      detail: `Drink ${formatMl(target)} today`,
      progress: todayTotal >= target ? 1 : todayTotal / target,
      progressLabel: `${formatMl(todayTotal)} / ${formatMl(target)}`,
      done: todayTotal >= target,
    },
    {
      id: 'streak-3',
      title: '3-day streak',
      detail: 'Hit your goal 3 days in a row',
      progress: pct(streak / 3),
      progressLabel: `${streak}/3`,
      done: streak >= 3,
    },
    {
      id: 'streak-7',
      title: '7-day streak',
      detail: 'Hit your goal 7 days in a row',
      progress: pct(streak / 7),
      progressLabel: `${streak}/7`,
      done: streak >= 7,
    },
    {
      id: 'rate-30',
      title: 'Hydration consistency',
      detail: 'Hit your goal on 4 of the last 5 days',
      progress: last30Rate === null ? 0 : pct(last30Rate / 0.8),
      progressLabel: last30Rate === null ? 'No data' : `${Math.round(last30Rate * 100)}%`,
      done: last30Rate !== null && last30Rate >= 0.8,
    },
    {
      id: 'days-14',
      title: 'Two weeks of water',
      detail: 'Log on at least 14 distinct days',
      progress: pct(loggedDays / 14),
      progressLabel: `${Math.min(loggedDays, 14)}/14 days`,
      done: loggedDays >= 14,
    },
    {
      id: 'lifetime-100',
      title: 'Century club',
      detail: 'Drink 100 L in total',
      progress: pct(totalMl / 100000),
      progressLabel: `${formatMl(totalMl)} / 100 L`,
      done: totalMl >= 100000,
    },
    {
      id: 'best',
      title: 'Personal best',
      detail: 'Reach a 5-day streak',
      progress: pct(best / 5),
      progressLabel: `${best} days`,
      done: best >= 5,
    },
  ];
}