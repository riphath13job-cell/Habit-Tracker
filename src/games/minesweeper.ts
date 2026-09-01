export interface MSCell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

export interface MSBoard {
  cols: number;
  rows: number;
  mines: number;
  /** Mines are placed after the first safe reveal. */
  placed: boolean;
  cells: MSCell[][];
}

export type MSDifficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: Record<MSDifficulty, { label: string; cols: number; rows: number; mines: number }> = {
  easy: { label: 'Easy', cols: 8, rows: 8, mines: 10 },
  medium: { label: 'Medium', cols: 10, rows: 10, mines: 18 },
  hard: { label: 'Hard', cols: 12, rows: 12, mines: 30 },
};

function emptyCells(cols: number, rows: number): MSCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })),
  );
}

export function createBoard(difficulty: MSDifficulty): MSBoard {
  const { cols, rows, mines } = DIFFICULTIES[difficulty];
  return { cols, rows, mines, placed: false, cells: emptyCells(cols, rows) };
}

function cloneBoard(board: MSBoard): MSBoard {
  return {
    ...board,
    cells: board.cells.map((row) => row.map((cell) => ({ ...cell }))),
  };
}

function neighbors(board: MSBoard, r: number, c: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols) out.push([nr, nc]);
    }
  }
  return out;
}

export function placeMines(board: MSBoard, safeR: number, safeC: number): MSBoard {
  const next = cloneBoard(board);
  const banned = new Set<string>([`${safeR},${safeC}`]);
  for (const [nr, nc] of neighbors(next, safeR, safeC)) banned.add(`${nr},${nc}`);

  let remaining = next.mines;
  while (remaining > 0) {
    const r = Math.floor(Math.random() * next.rows);
    const c = Math.floor(Math.random() * next.cols);
    if (next.cells[r][c].mine || banned.has(`${r},${c}`)) continue;
    next.cells[r][c].mine = true;
    remaining -= 1;
  }
  for (let r = 0; r < next.rows; r++) {
    for (let c = 0; c < next.cols; c++) {
      next.cells[r][c].adjacent = neighbors(next, r, c).filter(([nr, nc]) => next.cells[nr][nc].mine).length;
    }
  }
  next.placed = true;
  return next;
}

export interface RevealResult {
  board: MSBoard;
  hitMine: boolean;
  revealedAny: boolean;
}

/** Reveals one cell (flood-filling zero regions); flags are ignored. */
export function revealCell(board: MSBoard, r: number, c: number): RevealResult {
  let working = board.placed ? cloneBoard(board) : placeMines(board, r, c);
  const cell = working.cells[r][c];
  if (cell.revealed || cell.flagged) {
    return { board, hitMine: false, revealedAny: false };
  }
  if (cell.mine) {
    cell.revealed = true;
    return { board: working, hitMine: true, revealedAny: true };
  }

  let revealedAny = false;
  const queue: Array<[number, number]> = [[r, c]];
  while (queue.length > 0) {
    const [qr, qc] = queue.shift()!;
    const qcell = working.cells[qr][qc];
    if (qcell.revealed || qcell.flagged) continue;
    qcell.revealed = true;
    revealedAny = true;
    if (qcell.adjacent === 0) {
      for (const [nr, nc] of neighbors(working, qr, qc)) {
        if (!working.cells[nr][nc].revealed && !working.cells[nr][nc].mine) queue.push([nr, nc]);
      }
    }
  }
  return { board: working, hitMine: false, revealedAny };
}

export function toggleFlag(board: MSBoard, r: number, c: number): MSBoard {
  if (!board.placed) return board;
  const next = cloneBoard(board);
  const cell = next.cells[r][c];
  if (cell.revealed) return board;
  cell.flagged = !cell.flagged;
  return next;
}

export function isWin(board: MSBoard): boolean {
  for (const row of board.cells) {
    for (const cell of row) {
      if (!cell.mine && !cell.revealed) return false;
    }
  }
  return true;
}

export function flagCount(board: MSBoard): number {
  let n = 0;
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell.flagged) n += 1;
    }
  }
  return n;
}

/** Turns on `exploded` styling info: reveals every mine after a loss. */
export function revealAllMines(board: MSBoard): MSBoard {
  const next = cloneBoard(board);
  for (const row of next.cells) {
    for (const cell of row) {
      if (cell.mine) cell.revealed = true;
    }
  }
  return next;
}
