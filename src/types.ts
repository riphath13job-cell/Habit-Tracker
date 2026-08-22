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
  /** Epoch ms of when the habit was created (start of its history). */
  created_at: number;
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
  created_at: number;
  updated_at: number;
}

export interface ExportBundle {
  format: 'habit-tracker-backup';
  version: 2;
  exported_at: string;
  habits: Habit[];
  completions: Completion[];
  /** Present since version 2. */
  notes?: Note[];
}
