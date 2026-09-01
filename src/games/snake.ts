export interface Cell {
  r: number;
  c: number;
}

export type Dir = 'up' | 'down' | 'left' | 'right';

export const GRID = 15;

const DELTA: Record<Dir, Cell> = {
  up: { r: -1, c: 0 },
  down: { r: 1, c: 0 },
  left: { r: 0, c: -1 },
  right: { r: 0, c: 1 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function isOpposite(a: Dir, b: Dir): boolean {
  return a === OPPOSITE[b];
}

export function initialSnake(): { snake: Cell[]; dir: Dir; food: Cell } {
  const mid = Math.floor(GRID / 2);
  const snake: Cell[] = [
    { r: mid, c: mid },
    { r: mid, c: mid - 1 },
    { r: mid, c: mid - 2 },
  ];
  return { snake, dir: 'right', food: spawnFood(snake) };
}

export function spawnFood(snake: Cell[]): Cell {
  const taken = new Set(snake.map((s) => `${s.r},${s.c}`));
  const free: Cell[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (!taken.has(`${r},${c}`)) free.push({ r, c });
    }
  }
  if (free.length === 0) return snake[0];
  return free[Math.floor(Math.random() * free.length)];
}

export interface TickResult {
  snake: Cell[];
  food: Cell;
  alive: boolean;
  ate: boolean;
}

/**
 * Advances the snake one cell. The tail vacates its spot unless the head
 * eats this tick, so moving into the tail cell is legal.
 */
export function stepSnake(snake: Cell[], dir: Dir, food: Cell): TickResult {
  const head = snake[0];
  const d = DELTA[dir];
  const nr = head.r + d.r;
  const nc = head.c + d.c;

  if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) {
    return { snake, food, alive: false, ate: false };
  }

  const ate = nr === food.r && nc === food.c;
  const body = ate ? snake : snake.slice(0, -1);
  if (body.some((s) => s.r === nr && s.c === nc)) {
    return { snake, food, alive: false, ate: false };
  }

  const next = [{ r: nr, c: nc }, ...body];
  return { snake: next, food: ate ? spawnFood(next) : food, alive: true, ate };
}
