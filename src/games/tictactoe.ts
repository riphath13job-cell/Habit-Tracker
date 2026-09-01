export type Cell = 'X' | 'O' | null;
export type Board = Cell[];

export interface WinResult {
  player: 'X' | 'O';
  line: [number, number, number];
}

export function emptyBoard(): Board {
  return Array<Cell>(9).fill(null);
}

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function winner(board: Board): WinResult | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a] as 'X' | 'O', line };
    }
  }
  return null;
}

export function isFull(board: Board): boolean {
  return board.every((c) => c !== null);
}

export function availableMoves(board: Board): number[] {
  const moves: number[] = [];
  board.forEach((c, i) => {
    if (c === null) moves.push(i);
  });
  return moves;
}

/** Minimax evaluation from X's perspective: X maximizes, O minimizes. */
function minimax(board: Board, depth: number, isMax: boolean): number {
  const win = winner(board);
  if (win) return win.player === 'X' ? 10 - depth : depth - 10;
  if (isFull(board)) return 0;

  const moves = availableMoves(board);
  if (isMax) {
    let best = -Infinity;
    for (const i of moves) {
      board[i] = 'X';
      best = Math.max(best, minimax(board, depth + 1, false));
      board[i] = null;
    }
    return best;
  }
  let worst = Infinity;
  for (const i of moves) {
    board[i] = 'O';
    worst = Math.min(worst, minimax(board, depth + 1, true));
    board[i] = null;
  }
  return worst;
}

/**
 * Perfect move for `player` on the given board. Random among equally-optimal
 * moves so the AI feels less robotic.
 */
export function bestMove(board: Board, player: 'X' | 'O'): number {
  const moves = availableMoves(board);
  const isMax = player === 'X';
  let scores: Map<number, number> = new Map();
  let best = isMax ? -Infinity : Infinity;
  for (const i of moves) {
    board[i] = player;
    const s = minimax(board, 0, !isMax);
    board[i] = null;
    scores.set(i, s);
    best = isMax ? Math.max(best, s) : Math.min(best, s);
  }
  const optimal = moves.filter((i) => scores.get(i) === best);
  return optimal[Math.floor(Math.random() * optimal.length)];
}