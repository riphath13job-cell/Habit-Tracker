export interface Tile {
  id: number;
  r: number;
  c: number;
  value: number;
  /** spawned this turn — plays a scale-in. */
  isNew?: boolean;
  /** absorbed a neighbour this turn — plays a pop. */
  merged?: boolean;
  /** was absorbed by a merge this turn — slides to the target then fades out. */
  gone?: boolean;
}

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface MoveResult {
  /** Includes `gone` ghosts so callers can animate them before pruning. */
  board: Tile[];
  moved: boolean;
  gained: number;
  reached2048: boolean;
}

let idCounter = 1;

function makeTile(r: number, c: number, value: number): Tile {
  return { id: idCounter++, r, c, value, isNew: true };
}

export function spawnTile(board: Tile[]): Tile[] {
  const taken = new Set(board.map((t) => `${t.r},${t.c}`));
  const free: Array<[number, number]> = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!taken.has(`${r},${c}`)) free.push([r, c]);
    }
  }
  if (free.length === 0) return board;
  const [r, c] = free[Math.floor(Math.random() * free.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  return [...board, makeTile(r, c, value)];
}

export function createBoard(): Tile[] {
  idCounter = 1;
  return spawnTile(spawnTile([]));
}

/**
 * Slides every tile toward `dir`, merging equal neighbours once each.
 * Lines are processed wall-first so tiles stack up correctly.
 */
export function moveBoard(board: Tile[], dir: Dir): MoveResult {
  const horizontal = dir === 'left' || dir === 'right';
  const forward = dir === 'left' || dir === 'up';

  const lines: Tile[][] = [[], [], [], []];
  for (const t of board) lines[horizontal ? t.r : t.c].push(t);

  let moved = false;
  let gained = 0;
  let reached2048 = false;
  const out: Tile[] = [];

  for (const line of lines) {
    const sorted = [...line].sort((a, b) => (horizontal ? a.c - b.c : a.r - b.r));
    if (!forward) sorted.reverse();

    const placed: Tile[] = [];
    const ghosts: Array<{ idx: number; tile: Tile }> = [];
    let i = 0;
    while (i < sorted.length) {
      const cur = sorted[i];
      const nxt = sorted[i + 1];
      if (nxt && nxt.value === cur.value) {
        placed.push({ ...cur, value: cur.value * 2, isNew: false, merged: true });
        ghosts.push({ idx: placed.length - 1, tile: { ...nxt, isNew: false, gone: true } });
        gained += cur.value * 2;
        if (cur.value * 2 >= 2048) reached2048 = true;
        moved = true;
        i += 2;
      } else {
        placed.push({ ...cur, isNew: false, merged: false });
        i += 1;
      }
    }

    placed.forEach((t, idx) => {
      const slot = forward ? idx : 3 - idx;
      const oldPos = horizontal ? t.c : t.r;
      if (oldPos !== slot) moved = true;
    });

    placed.forEach((t, idx) => {
      const slot = forward ? idx : 3 - idx;
      out.push({
        ...t,
        r: horizontal ? t.r : slot,
        c: horizontal ? slot : t.c,
      });
    });
    for (const g of ghosts) {
      const target = out[out.length - placed.length + g.idx];
      out.push({ ...g.tile, r: target.r, c: target.c });
    }
  }

  return { board: out, moved, gained, reached2048 };
}

export function canMove(board: Tile[]): boolean {
  if (board.length < 16) return true;
  const grid: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (const t of board) grid[t.r][t.c] = t.value;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

export function maxValue(board: Tile[]): number {
  return board.reduce((m, t) => Math.max(m, t.value), 0);
}

/** Prunes merge ghosts and clears one-shot animation flags. */
export function cleanBoard(board: Tile[]): Tile[] {
  return board
    .filter((t) => !t.gone)
    .map((t) => ({ id: t.id, r: t.r, c: t.c, value: t.value }));
}
