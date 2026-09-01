export const ROUNDS = 5;

export const MIN_DELAY_MS = 1200;
export const MAX_DELAY_MS = 3000;

export function nextDelay(): number {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

export function nowMs(): number {
  return Date.now();
}

/** Average reaction time of the completed rounds, or 0 when none. */
export function average(times: number[]): number {
  if (times.length === 0) return 0;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}