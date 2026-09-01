export const CODE_SIZE = 4;
export const NUM_COLORS = 6;
export const MAX_GUESSES = 10;

export type ColorId = number; // 0..NUM_COLORS-1
export type Code = ColorId[];

export interface MatchResult {
  /** Exact position + color matches. */
  black: number;
  /** Right color, wrong position. */
  white: number;
}

export function newSecret(): Code {
  return Array.from({ length: CODE_SIZE }, () => Math.floor(Math.random() * NUM_COLORS));
}

export function evaluate(secret: Code, guess: Code): MatchResult {
  let black = 0;
  const secretCounters = Array(NUM_COLORS).fill(0);
  const guessCounters = Array(NUM_COLORS).fill(0);
  for (let i = 0; i < CODE_SIZE; i++) {
    if (secret[i] === guess[i]) {
      black += 1;
    } else {
      secretCounters[secret[i]] += 1;
      guessCounters[guess[i]] += 1;
    }
  }
  let white = 0;
  for (let c = 0; c < NUM_COLORS; c++) {
    white += Math.min(secretCounters[c], guessCounters[c]);
  }
  return { black, white };
}

export function isWin(result: MatchResult): boolean {
  return result.black === CODE_SIZE;
}

export const PEG_COLORS: string[] = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#A855F7', // purple
  '#06B6D4', // cyan
];