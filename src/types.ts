export interface Habit {
  id: number;
  name: string;
  emoji: string;
  color: string;
  /**
   * 'daily' or a comma-separated list of weekday numbers (0 = Sunday … 6 = Saturday),
   * e.g. '1,3,5' for Mon/Wed/Fri.
   */
  schedule: string;
  /** Minutes after midnight for the daily reminder, or null when disabled. */
  reminder_minutes: number | null;
  /** Life sphere: 'body' | 'intellect' | 'career' | 'life' (Evolve app). */
  sphere?: string;
  /** Epoch ms of when the habit was created (start of its history). */
  created_at: number;
  /** Active expo notification id for the daily reminder, when scheduled. */
  notification_id?: string | null;
}

export interface Completion {
  id: number;
  habit_id: number;
  /** Local calendar day in 'YYYY-MM-DD' form. */
  day: string;
}

export interface Note {
  id: number;
  title: string;
  body: string;
  /** 1 = favorite (shown on the Favorites page). */
  favorite: number;
  /** Set (epoch ms) while the note sits in the Trash. */
  deleted_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface TodoCollection {
  id: number;
  name: string;
  emoji: string;
  created_at: number;
}

export interface Exercise {
  id: number;
  /** Stable key for built-in exercises, null for custom ones. */
  key: string | null;
  name: string;
  muscle: string;
  tip: string;
  is_custom: number;
  created_at: number;
}

export interface Workout {
  id: number;
  name: string;
  notes: string;
  started_at: number;
  ended_at: number | null;
}

export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_id: number;
  /** Snapshot of the exercise name so history survives exercise deletion. */
  exercise_name: string;
  position: number;
}

export interface SetEntry {
  id: number;
  workout_exercise_id: number;
  position: number;
  reps: number | null;
  weight: number | null;
  done: number;
}

export interface Routine {
  id: number;
  name: string;
  created_at: number;
}

export interface RoutineItem {
  id: number;
  routine_id: number;
  exercise_id: number;
  exercise_name: string;
  position: number;
  target_sets: number;
  target_reps: number;
}

export type BodyMetric = 'weight' | 'waist' | 'chest' | 'arms' | 'hips' | 'thighs';

export interface BodyEntry {
  id: number;
  metric: BodyMetric;
  value: number;
  day: string;
}

export interface FitnessPrefs {
  reminder_minutes: number | null;
  days: string;
  notification_id: string | null;
}

export interface SleepEntry {
  id: number;
  /** 'YYYY-MM-DD' of the morning you woke up — one entry per night. */
  day: string;
  /** Bedtime, minutes from midnight (can be past 1440 for after-midnight bedtimes). */
  bed_minutes: number;
  /** Wake time, minutes from midnight. */
  wake_minutes: number;
  /** 1-5 subjective rating, or null if unrated. */
  quality: number | null;
}

export interface SleepPrefs {
  goal_minutes: number;
  reminder_minutes: number | null;
  notification_id: string | null;
}

export interface DreamEntry {
  id: number;
  /** 'YYYY-MM-DD' of the morning the dream was recorded. */
  day: string;
  title: string;
  body: string;
  /** 1 = the dreamer became lucid in this dream. */
  lucid: number;
  created_at: number;
}

export interface LucidPrefs {
  /** Reality-check reminders per day; 0 disables them. */
  rc_per_day: number;
  notification_id: string | null;
}

export interface GameScore {
  /** Stable game identifier, e.g. '2048'. */
  game: string;
  best: number;
}

export interface AppPref {
  key: string;
  value: string;
}

export interface WaterLog {
  id: number;
  /** Local calendar day in 'YYYY-MM-DD' form. */
  day: string;
  /** Volume of this glass/sip in millilitres. */
  ml: number;
  created_at: number;
}

export interface WaterPrefs {
  /** Daily water target in millilitres. */
  target_ml: number;
  /** Minutes from midnight when the reminder window opens, or null when off. */
  reminder_start: number | null;
  /** Minutes from midnight when the reminder window closes, or null when off. */
  reminder_end: number | null;
  /** Minutes between nudges inside the window, or null when off. */
  reminder_interval: number | null;
  /** Comma-joined active expo notification ids for the water nudges. */
  notification_id: string | null;
}

/** 'reading' = now reading, 'finished' = already read, 'wishlist' = want to read. */
export type BookStatus = 'reading' | 'finished' | 'wishlist';

export interface Book {
  id: number;
  title: string;
  author: string;
  status: BookStatus;
  /** Local URI of the cropped cover image, or null. */
  cover_uri: string | null;
  /** Total pages when known (used for reading progress). */
  total_pages: number | null;
  pages_read: number;
  /** Link to buy the book (shown on wishlist + detail). */
  buy_url: string | null;
  /** 1-5 rating once finished, or null. */
  rating: number | null;
  created_at: number;
  updated_at: number;
  /** Set when the book is finished (or moved to finished). */
  finished_at: number | null;
}

export interface BookNote {
  id: number;
  book_id: number;
  title: string;
  body: string;
  created_at: number;
  updated_at: number;
}

/** A daily checklist routine (e.g. "Morning routine") — resets every day at noon. */
export interface DailyRoutine {
  id: number;
  name: string;
  emoji: string;
  created_at: number;
}

export interface DailyRoutineItem {
  id: number;
  routine_id: number;
  /** The thing to do each day, e.g. "Brush teeth". */
  title: string;
  position: number;
  created_at: number;
}

export interface DailyRoutineCompletion {
  id: number;
  item_id: number;
  /** Routine "day window" in 'YYYY-MM-DD' form (see routineDayKey in date-utils). */
  day: string;
}

export interface Todo {
  id: number;
  /** Owning collection, or null for Quick-list / Scheduled tasks. */
  collection_id: number | null;
  title: string;
  /** 1 = checked off. */
  done: number;
  /** Epoch ms the task is scheduled for, or null for non-scheduled tasks. */
  due_at: number | null;
  /** Epoch ms a reminder notification should fire at, or null. */
  remind_at: number | null;
  /** Active expo notification id, when a reminder is scheduled. */
  notification_id: string | null;
  created_at: number;
  completed_at: number | null;
}

/** Category a saved link is filed under. */
export type LinkCategory =
  | 'video'
  | 'article'
  | 'music'
  | 'social'
  | 'shopping'
  | 'code'
  | 'study'
  | 'tools'
  | 'image'
  | 'other';

export interface LinkItem {
  id: number;
  url: string;
  title: string;
  category: LinkCategory;
  note: string;
  /** 1 = favorite (starred). */
  favorite: number;
  created_at: number;
  updated_at: number;
}

export type LifeSphere = 'body' | 'intellect' | 'career' | 'life';

export const LIFE_SPHERES: Array<{ id: LifeSphere; label: string }> = [
  { id: 'body', label: 'Body' },
  { id: 'intellect', label: 'Intellect' },
  { id: 'career', label: 'Career' },
  { id: 'life', label: 'Life' },
];

/** A gamified goal in the Evolve app: a handful of habits with a target date. */
export interface Goal {
  id: number;
  title: string;
  /** Target day in 'YYYY-MM-DD' form. */
  target_day: string;
  sphere: LifeSphere;
  created_at: number;
}

export interface GoalHabit {
  goal_id: number;
  habit_id: number;
}

// ---------------------------------------------------------------------------
// Focus / Pomodoro
// ---------------------------------------------------------------------------

export interface FocusSession {
  id: number;
  /** Epoch ms when the session started. */
  started_at: number;
  /** Epoch ms when the session ended (completed or abandoned). */
  ended_at: number;
  /** Planned length of the focus block in minutes. */
  target_minutes: number;
  /** Minutes actually focused (0 if abandoned without any time). */
  focus_minutes: number;
  /** Optional short label for what was worked on. */
  tag: string;
  /** 1 when the block was completed, 0 when abandoned. */
  completed: number;
}

export interface FocusPrefs {
  /** Length of a focus block in minutes. */
  work_minutes: number;
  /** Length of a short break in minutes. */
  short_break: number;
  /** Length of a long break in minutes. */
  long_break: number;
  /** Number of focus blocks before a long break. */
  sessions_before_long: number;
  /** 1 to notify when a session ends, 0 to stay silent. */
  notify_on_end: number;
  /** Active expo notification id for the running session end alert. */
  notification_id: string | null;
}

// ---------------------------------------------------------------------------
// Mood / Journal
// ---------------------------------------------------------------------------

export interface MoodEntry {
  id: number;
  /** Local calendar day in 'YYYY-MM-DD' form (one entry per day). */
  day: string;
  /** Mood on a 1-5 scale (1 = terrible, 5 = amazing). */
  mood: number;
  /** Optional free-text note for the day. */
  note: string;
  created_at: number;
  updated_at: number;
}

// ---------------------------------------------------------------------------
// Spending / Budget
// ---------------------------------------------------------------------------

export interface Transaction {
  id: number;
  /** Amount in cents (positive = spent, negative = earned). */
  amount_cents: number;
  category: string;
  note: string;
  /** Local calendar day in 'YYYY-MM-DD' form. */
  day: string;
  created_at: number;
}

export interface BudgetPrefs {
  /** Monthly spending target in cents, or null when unset. */
  monthly_budget_cents: number | null;
}

// ---------------------------------------------------------------------------
// Business / Sales tracker
// ---------------------------------------------------------------------------

/** A product (e.g. a Google Review card pack) you sell. */
export interface Product {
  id: number;
  name: string;
  /** What each unit costs you, in cents. */
  cost_per_unit_cents: number;
  /** What you sell each unit for, in cents. */
  sell_per_unit_cents: number;
  /** Current units in stock. */
  quantity_on_hand: number;
  created_at: number;
}

/** A business (customer) you sell to. */
export interface Customer {
  id: number;
  name: string;
  /** Phone / email / other contact detail. */
  contact: string;
  notes: string;
  created_at: number;
}

export type SaleStatus = 'unpaid' | 'partial' | 'paid';

/** A single sale of a product to a customer. */
export interface Sale {
  id: number;
  customer_id: number;
  product_id: number | null;
  quantity: number;
  /** Unit price in cents. */
  unit_price_cents: number;
  /** Total price in cents (quantity × unit price), minus nothing for now. */
  total_cents: number;
  /** Local calendar day in 'YYYY-MM-DD' form. */
  day: string;
  status: SaleStatus;
  /** Cents actually paid (reflects the status). */
  paid_cents: number;
  /** Quantity that triggers a reorder flag on this sale's customer. */
  reorder_when_quantity: number | null;
  notes: string;
  created_at: number;
}

export type BusinessCurrency = 'czk' | 'eur';

/** A stored message in the AI assistant chat. */
export interface AiMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}

export interface ExportBundle {
  format: 'habit-tracker-backup';
  version: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;
  exported_at: string;
  habits: Habit[];
  completions: Completion[];
  notes?: Note[];
  todos?: Todo[];
  collections?: TodoCollection[];
  exercises?: Exercise[];
  workouts?: Workout[];
  workout_exercises?: WorkoutExercise[];
  sets?: SetEntry[];
  routines?: Routine[];
  routine_items?: RoutineItem[];
  body_entries?: BodyEntry[];
  fitness_prefs?: FitnessPrefs[];
  sleep_entries?: SleepEntry[];
  sleep_prefs?: SleepPrefs[];
  dream_entries?: DreamEntry[];
  lucid_prefs?: LucidPrefs[];
  game_scores?: GameScore[];
  app_prefs?: AppPref[];
  daily_routines?: DailyRoutine[];
  daily_routine_items?: DailyRoutineItem[];
  daily_routine_completions?: DailyRoutineCompletion[];
  books?: Book[];
  book_notes?: BookNote[];
  links?: LinkItem[];
  water_logs?: WaterLog[];
  water_prefs?: WaterPrefs[];
  goals?: Goal[];
  goal_habits?: GoalHabit[];
  focus_sessions?: FocusSession[];
  focus_prefs?: FocusPrefs[];
  mood_entries?: MoodEntry[];
  transactions?: Transaction[];
  budget_prefs?: BudgetPrefs[];
  products?: Product[];
  customers?: Customer[];
  sales?: Sale[];
}
