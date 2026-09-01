export const GRID_SIZE = 4;
export const TILE_COUNT = GRID_SIZE * GRID_SIZE; // 16; index 0 = blank

export type Board15 = number[];

export function solvedBoard(): Board15 {
  return Array.from({ length: TILE_COUNT }, (_, i) => (i + 1) % TILE_COUNT);
}

export function blankIndex(board: Board15): number {
  return board.indexOf(0);
}

export function canMove(board: Board15, index: number): boolean {
  const blank = blankIndex(board);
  const r = Math.floor(index / GRID_SIZE);
  const c = index % GRID_SIZE;
  const br = Math.floor(blank / GRID_SIZE);
  const bc = blank % GRID_SIZE;
  return Math.abs(r - br) + Math.abs(c - bc) === 1;
}

/**
 * Slides the whole run of tiles between `index` and the blank one step toward
 * the blank, so tapping any tile in the blank's row or column works (standard
 * 15-puzzle UX). Returns a new board, or null when the tap can't move anything.
 */
export function slideMove(board: Board15, index: number): Board15 | null {
  const blank = blankIndex(board);
  if (index === blank) return null;
  const r = Math.floor(index / GRID_SIZE);
  const c = index % GRID_SIZE;
  const br = Math.floor(blank / GRID_SIZE);
  const bc = blank % GRID_SIZE;
  if (r === br || c === bc) {
    const next = [...board];
    const step = Math.sign(blank - index);
    const run = Math.abs(blank - index);
    for (let k = 0; k < run; k++) {
      next[index + (k + 1) * step] = board[index + k * step];
    }
    next[index] = 0;
    return next;
  }
  return null;
}

/** Returns a new board after sliding tile at `index` into the blank. */
export function moveTile(board: Board15, index: number): Board15 {
  return slideMove(board, index) ?? board;
}

export function isSolved(board: Board15): boolean {
  return board.every((v, i) => v === (i + 1) % TILE_COUNT);
}

/** Scrambles the board with legal moves from the solved state (always solvable). */
export function shuffleBoard(steps = 220): Board15 {
  let board = solvedBoard();
  let iterations = 0;
  let blank = blankIndex(board);
  let lastSwap = -1;
  for (let i = 0; i < steps; i++) {
    const neighbors: number[] = [];
    const r = Math.floor(blank / GRID_SIZE);
    const c = blank % GRID_SIZE;
    if (r > 0) neighbors.push(blank - GRID_SIZE);
    if (r < GRID_SIZE - 1) neighbors.push(blank + GRID_SIZE);
    if (c > 0) neighbors.push(blank - 1);
    if (c < GRID_SIZE - 1) neighbors.push(blank + 1);
    const options = neighbors.filter((n) => n !== lastSwap);
    const move = options[Math.floor(Math.random() * options.length)];
    [board[blank], board[move]] = [board[move], board[blank]];
    lastSwap = blank;
    blank = move;
    iterations++;
  }
  while (isSolved(board) && iterations > 0) {
    const neighbors: number[] = [];
    const r = Math.floor(blank / GRID_SIZE);
    const c = blank % GRID_SIZE;
    if (r > 0) neighbors.push(blank - GRID_SIZE);
    if (r < GRID_SIZE - 1) neighbors.push(blank + GRID_SIZE);
    if (c > 0) neighbors.push(blank - 1);
    if (c < GRID_SIZE - 1) neighbors.push(blank + 1);
    const options = neighbors.filter((n) => n !== lastSwap);
    const move = options[Math.floor(Math.random() * options.length)];
    [board[blank], board[move]] = [board[move], board[blank]];
    lastSwap = blank;
    blank = move;
  }
  return board;
}