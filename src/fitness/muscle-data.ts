export type MuscleKey =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'lats'
  | 'traps'
  | 'lower_back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

export interface MuscleGroup {
  key: MuscleKey;
  name: string;
  /** Hours until the muscle is typically recovered after a hard session. */
  recoveryHours: number;
  description: string;
  tip: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    key: 'chest',
    name: 'Chest',
    recoveryHours: 48,
    description:
      'The pectorals push the arms forward and across the body. They respond well to both pressing and fly movements.',
    tip: 'Train twice a week mixing flat and incline presses.',
  },
  {
    key: 'shoulders',
    name: 'Shoulders',
    recoveryHours: 48,
    description:
      'The deltoids wrap around the shoulder joint: front delts assist all pressing, side delts build width, rear delts pull.',
    tip: 'Hit all three heads — press, raise, and face-pull.',
  },
  {
    key: 'biceps',
    name: 'Biceps',
    recoveryHours: 36,
    description:
      'The biceps bend the elbow and rotate the forearm. They also assist on every pull-up and row.',
    tip: 'Use a full stretch at the bottom of each curl.',
  },
  {
    key: 'triceps',
    name: 'Triceps',
    recoveryHours: 36,
    description:
      'Two-thirds of your upper-arm size. The triceps straighten the elbow and assist every press.',
    tip: 'Combine a pushdown with an overhead extension.',
  },
  {
    key: 'forearms',
    name: 'Forearms',
    recoveryHours: 24,
    description:
      'Grip and wrist strength that carries over to every lift, plus visible elbow-to-wrist muscle.',
    tip: 'Farmer carries and dead hangs build grip fast.',
  },
  {
    key: 'abs',
    name: 'Abs',
    recoveryHours: 24,
    description:
      'The rectus abdominis flexes the spine and braces the torso under heavy loads.',
    tip: 'Train them like any muscle — with load and progression.',
  },
  {
    key: 'obliques',
    name: 'Obliques',
    recoveryHours: 24,
    description:
      'The side-wall muscles rotate the trunk and resist unwanted twisting — key for a strong core.',
    tip: 'Side planks and twists cover rotation and anti-rotation.',
  },
  {
    key: 'lats',
    name: 'Lats',
    recoveryHours: 48,
    description:
      'The largest back muscle pulls the arms down and back, creating the V-taper.',
    tip: 'Think “elbows to ribs” on every pull.',
  },
  {
    key: 'traps',
    name: 'Traps',
    recoveryHours: 36,
    description:
      'The trapezius spans neck to mid-back: it shrugs, supports posture, and stabilizes heavy pulls.',
    tip: 'Shrugs with a pause at the top; rows fill in the middle.',
  },
  {
    key: 'lower_back',
    name: 'Lower Back',
    recoveryHours: 48,
    description:
      'The erector spinae keep you upright and transfer force from hips to bar on every hinge.',
    tip: 'Deadlifts and back extensions — progress slowly here.',
  },
  {
    key: 'glutes',
    name: 'Glutes',
    recoveryHours: 48,
    description:
      'The strongest muscles in the body: hip extension power for squats, sprints, and jumps.',
    tip: 'Hip thrusts through full lockout are the king builder.',
  },
  {
    key: 'quads',
    name: 'Quads',
    recoveryHours: 72,
    description:
      'Four muscles on the front of the thigh that extend the knee — built by squats, presses, and lunges.',
    tip: 'Deep reps with controlled tempo beat heavy partials.',
  },
  {
    key: 'hamstrings',
    name: 'Hamstrings',
    recoveryHours: 60,
    description:
      'The back-thigh muscles bend the knee and extend the hip; crucial for sprinting and injury-proofing.',
    tip: 'Romanian deadlifts stretch them under load.',
  },
  {
    key: 'calves',
    name: 'Calves',
    recoveryHours: 24,
    description:
      'The calf complex powers every step and jump, and recovers remarkably fast.',
    tip: 'High reps, full stretch at the bottom, no bouncing.',
  },
];

export const MUSCLE_BY_KEY: Record<MuscleKey, MuscleGroup> = MUSCLE_GROUPS.reduce(
  (acc, m) => {
    acc[m.key] = m;
    return acc;
  },
  {} as Record<MuscleKey, MuscleGroup>,
);

/** Poster-style flat colour per muscle group, used by the body map. */
export const MUSCLE_COLORS: Record<MuscleKey, string> = {
  chest: '#EF4444',
  shoulders: '#F59E0B',
  biceps: '#FB923C',
  triceps: '#EAB308',
  forearms: '#84CC16',
  abs: '#06B6D4',
  obliques: '#14B8A6',
  lats: '#3B82F6',
  traps: '#F97316',
  lower_back: '#A855F7',
  glutes: '#D946EF',
  quads: '#8B5CF6',
  hamstrings: '#6366F1',
  calves: '#EC4899',
};

/** Green family shown while a muscle is still recovering. */
export const RECOVERING_COLOR = '#22C55E';
export const RECOVERING_EDGE = '#15803D';

/** Dark outline that gives the map its bold, poster look on both themes. */
export const MUSCLE_OUTLINE = '#1F2937';

export function muscleColor(key: MuscleKey): string {
  return MUSCLE_COLORS[key];
}

/** ISO weekday used by expo-notifications weekly triggers (1 = Monday … 7 = Sunday). */
export function isoWeekday(appWeekday: number): number {
  return appWeekday === 0 ? 7 : appWeekday;
}
