export const SUDOKU_SIZE = 9;

export type SudokuValue = number | null;

export interface SudokuPuzzle {
  /** The unique solution. */
  solution: number[][];
  /** The playable grid; null marks empty cells. */
  grid: SudokuValue[][];
}

const EMPTY: SudokuValue[][] = Array.from({ length: SUDOKU_SIZE }, () =>
  Array<SudokuValue>(SUDOKU_SIZE).fill(null),
);

export interface SudokuDifficulty {
  id: 'easy' | 'medium' | 'hard';
  label: string;
  /** Rough count of cells removed from the solution. */
  remove: number;
}

export const SUDOKU_DIFFICULTIES: SudokuDifficulty[] = [
  { id: 'easy', label: 'Easy', remove: 36 },
  { id: 'medium', label: 'Medium', remove: 45 },
  { id: 'hard', label: 'Hard', remove: 54 },
];

function shuffled(nums: number[]): number[] {
  const a = [...nums];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fills the grid completely via backtracking + random order. Returns false when impossible. */
function fill(grid: number[][]): boolean {
  for (let r = 0; r < SUDOKU_SIZE; r++) {
    for (let c = 0; c < SUDOKU_SIZE; c++) {
      if (grid[r][c] !== 0) continue;
      for (const n of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (canPlace(grid, r, c, n)) {
          grid[r][c] = n;
          if (fill(grid)) return true;
          grid[r][c] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

export function canPlace(grid: number[][], r: number, c: number, n: number): boolean {
  for (let i = 0; i < SUDOKU_SIZE; i++) {
    if (grid[r][i] === n) return false;
    if (grid[i][c] === n) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[br + i][bc + j] === n) return false;
    }
  }
  return true;
}

/** True when placing `n` at (r,c) conflicts with an already-placed number. */
export function conflicts(grid: SudokuValue[][], r: number, c: number, n: number): boolean {
  for (let i = 0; i < SUDOKU_SIZE; i++) {
    if (grid[r][i] === n) return true;
    if (grid[i][c] === n) return true;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[br + i][bc + j] === n) return true;
    }
  }
  return false;
}

/** Counts distinct completions, stopping early once `limit` is hit. */
function countSolutions(grid: number[][], limit = 2): number {
  for (let r = 0; r < SUDOKU_SIZE; r++) {
    for (let c = 0; c < SUDOKU_SIZE; c++) {
      if (grid[r][c] !== 0) continue;
      let total = 0;
      for (let n = 1; n <= 9 && total < limit; n++) {
        if (!canPlace(grid, r, c, n)) continue;
        grid[r][c] = n;
        total += countSolutions(grid, limit);
        grid[r][c] = 0;
        if (total >= limit) return total;
      }
      return total;
    }
  }
  return 1;
}

export function hasUniqueSolution(grid: number[][]): boolean {
  return countSolutions(grid, 2) === 1;
}

/** Builds a playable Sudoku with exactly one solution. */
export function generatePuzzle(difficulty: SudokuDifficulty): SudokuPuzzle {
  const solution = Array.from({ length: SUDOKU_SIZE }, () => Array<number>(SUDOKU_SIZE).fill(0));
  fill(solution);

  const puzzle = solution.map((row) => [...row]);
  const cells = shuffled(Array.from({ length: 81 }, (_, i) => i));
  let removed = 0;
  for (const idx of cells) {
    if (removed >= difficulty.remove) break;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    if (hasUniqueSolution(puzzle)) {
      removed += 1;
    } else {
      puzzle[r][c] = backup;
    }
  }

  return { solution, grid: puzzle.map((row) => row.map((v) => (v === 0 ? null : v))) };
}

export function isSolved(grid: SudokuValue[][]): boolean {
  for (let r = 0; r < SUDOKU_SIZE; r++) {
    for (let c = 0; c < SUDOKU_SIZE; c++) {
      if (grid[r][c] === null) return false;
    }
  }
  return true;
}

export function cloneGrid(grid: SudokuValue[][]): SudokuValue[][] {
  return grid.map((row) => [...row]);
}

export function emptyGrid(): SudokuValue[][] {
  return EMPTY.map((row) => [...row]);
}