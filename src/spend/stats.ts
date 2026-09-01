import type { Transaction } from '../types';

export interface MonthRange {
  start: string; // 'YYYY-MM-DD' (first day)
  end: string; // 'YYYY-MM-DD' (last day)
  label: string; // e.g. 'Aug 2026'
  key: string; // 'YYYY-MM'
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Returns the YYYY-MM key for a Date. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Inclusive day range (YYYY-MM-DD) for a given YYYY-MM key, plus a human label. */
export function monthRange(key: string): MonthRange {
  const [y, m] = key.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  return {
    start: `${y}-${pad(m)}-01`,
    end: `${y}-${pad(m)}-${pad(last.getDate())}`,
    label: `${MONTHS[m - 1]} ${y}`,
    key,
  };
}

/** Current month key. */
export function currentMonthKey(): string {
  return monthKey(new Date());
}

/** Shifts a YYYY-MM key by whole months. */
export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

/** Formats cents as money, e.g. 123456 -> "$1,234.56". */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}$${dollars.toLocaleString()}.${pad(rem)}`;
}

/** Total spent (positive cents) in a set of transactions; earnings ignored for spending totals. */
export function totalSpent(txs: Transaction[]): number {
  return txs.reduce((sum, t) => sum + (t.amount_cents > 0 ? t.amount_cents : 0), 0);
}

/** Net total (spent minus earned). */
export function totalNet(txs: Transaction[]): number {
  return txs.reduce((sum, t) => sum + t.amount_cents, 0);
}

export interface CategoryBreakdown {
  category: string;
  spent: number;
  count: number;
  pct: number; // 0..1 share of total spent
}

/** Groups transactions by category, sorted by amount spent (descending). */
export function byCategory(txs: Transaction[]): CategoryBreakdown[] {
  const map = new Map<string, { spent: number; count: number }>();
  for (const t of txs) {
    if (t.amount_cents <= 0) continue;
    const entry = map.get(t.category) ?? { spent: 0, count: 0 };
    entry.spent += t.amount_cents;
    entry.count += 1;
    map.set(t.category, entry);
  }
  const total = [...map.values()].reduce((s, e) => s + e.spent, 0);
  return [...map.entries()]
    .map(([category, e]) => ({ category, spent: e.spent, count: e.count, pct: total > 0 ? e.spent / total : 0 }))
    .sort((a, b) => b.spent - a.spent);
}

export const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Shopping',
  'Health',
  'Fun',
  'Bills',
  'Income',
  'Other',
];
