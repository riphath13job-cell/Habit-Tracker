import * as Notifications from 'expo-notifications';
import { isNative } from './platform';
import type { Habit } from './types';
import {
  getFitnessPrefs,
  saveFitnessPrefs,
  setHabitNotificationId,
  getSleepPrefs,
  saveSleepPrefs,
  getLucidPrefs,
  saveLucidPrefs,
  getWaterPrefs,
  saveWaterPrefs,
} from './db';
import { isoWeekday } from './fitness/muscle-data';

export function configureNotifications(): void {
  if (!isNative) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Schedules a one-shot reminder for a to-do; returns the notification id, or null. */
export async function scheduleTodoReminder(
  todoId: number,
  title: string,
  atMs: number,
): Promise<string | null> {
  if (!isNative) return null;
  if (atMs <= Date.now() + 500) return null;
  const perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ To-do reminder',
      body: title,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(atMs) },
  });
}

export async function cancelScheduledNotification(notificationId?: string | null): Promise<void> {
  if (!isNative || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // already gone
  }
}

/**
 * Re-syncs daily habit reminders. Each habit's active notification id is stored on
 * its row, so cancelling only touches habit reminders — to-do reminders are safe.
 * A one-time full sweep handles reminders scheduled by older versions (no ids yet).
 */
export async function syncReminders(habits: Habit[]): Promise<number> {
  if (!isNative) return 0;
  const legacy = habits.some((h) => h.reminder_minutes != null && !h.notification_id);
  if (legacy) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } else {
    for (const habit of habits) {
      if (habit.notification_id) {
        try {
          await Notifications.cancelScheduledNotificationAsync(habit.notification_id);
        } catch {
          // already gone
        }
      }
    }
  }

  const perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) return 0;

  let count = 0;
  for (const habit of habits) {
    if (habit.reminder_minutes == null) {
      if (habit.notification_id) await setHabitNotificationId(habit.id, null);
      continue;
    }
    const hour = Math.floor(habit.reminder_minutes / 60);
    const minute = habit.reminder_minutes % 60;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${habit.emoji} ${habit.name}`,
        body: 'Keep your streak alive!',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    await setHabitNotificationId(habit.id, id);
    count += 1;
  }
  return count;
}

/**
 * Re-syncs the weekly workout reminder (one notification per selected weekday).
 * The active notification ids live on the fitness_prefs row, so this never
 * touches habit or to-do reminders.
 */
export async function syncFitnessReminder(): Promise<void> {
  if (!isNative) return;
  const prefs = await getFitnessPrefs();
  const oldIds = (prefs.notification_id ?? '').split(',').filter(Boolean);
  for (const id of oldIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // already gone
    }
  }

  const ids: string[] = [];
  if (prefs.reminder_minutes != null) {
    const perms = await Notifications.getPermissionsAsync();
    if (perms.granted) {
      const hour = Math.floor(prefs.reminder_minutes / 60);
      const minute = prefs.reminder_minutes % 60;
      for (const part of prefs.days.split(',')) {
        const day = parseInt(part, 10);
        if (!Number.isInteger(day) || day < 0 || day > 6) continue;
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '💪 Workout time',
              body: 'Time to train — your future self says thanks!',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: isoWeekday(day),
              hour,
              minute,
            },
          });
          ids.push(id);
        } catch {
          // skip invalid trigger
        }
      }
    }
  }
  await saveFitnessPrefs({ ...prefs, notification_id: ids.join(',') || null });
}

/**
 * Re-syncs the nightly bedtime reminder (a single DAILY trigger). The active
 * notification id lives on the sleep_prefs row, so this never touches other
 * reminders.
 */
export async function syncSleepReminder(): Promise<void> {
  if (!isNative) return;
  const prefs = await getSleepPrefs();
  await cancelScheduledNotification(prefs.notification_id);

  let id: string | null = null;
  if (prefs.reminder_minutes != null) {
    const perms = await Notifications.getPermissionsAsync();
    if (perms.granted) {
      try {
        id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '😴 Wind down',
            body: 'Time to get ready for bed — tomorrow will thank you.',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: Math.floor(prefs.reminder_minutes / 60),
            minute: prefs.reminder_minutes % 60,
          },
        });
      } catch {
        id = null;
      }
    }
  }
  await saveSleepPrefs({ ...prefs, notification_id: id });
}

const RC_WINDOW_START_MIN = 9 * 60;
const RC_WINDOW_END_MIN = 21 * 60;

/**
 * Re-syncs the reality-check reminders: `rc_per_day` DAILY triggers spread
 * across the waking window (9:00–21:00), rounded to :15. Ids live on the
 * lucid_prefs row so nothing else is touched.
 */
export async function syncLucidReminder(): Promise<void> {
  if (!isNative) return;
  const prefs = await getLucidPrefs();
  const oldIds = (prefs.notification_id ?? '').split(',').filter(Boolean);
  for (const oldId of oldIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(oldId);
    } catch {
      // already gone
    }
  }

  const ids: string[] = [];
  if (prefs.rc_per_day > 0) {
    const perms = await Notifications.getPermissionsAsync();
    if (perms.granted) {
      const span = RC_WINDOW_END_MIN - RC_WINDOW_START_MIN;
      const step = span / Math.max(1, prefs.rc_per_day - 1 || 1);
      for (let i = 0; i < prefs.rc_per_day; i++) {
        const raw =
          prefs.rc_per_day === 1
            ? RC_WINDOW_START_MIN + span / 2
            : RC_WINDOW_START_MIN + i * step;
        const minutes = Math.round(raw / 15) * 15;
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🌀 Reality check',
              body: 'Are you dreaming? Pinch your nose and try to breathe — look at your hands, re-read this text.',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: Math.floor(minutes / 60),
              minute: minutes % 60,
            },
          });
          ids.push(id);
        } catch {
          // skip invalid trigger
        }
      }
    }
  }
  await saveLucidPrefs({ ...prefs, notification_id: ids.join(',') || null });
}

/**
 * Re-syncs the water reminders: DAILY nudges every `reminder_interval` minutes
 * across the [reminder_start, reminder_end) window (capped at 12 per day).
 * Ids live on the water_prefs row so nothing else is touched.
 */
export async function syncWaterReminder(): Promise<void> {
  if (!isNative) return;
  const prefs = await getWaterPrefs();
  const oldIds = (prefs.notification_id ?? '').split(',').filter(Boolean);
  for (const oldId of oldIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(oldId);
    } catch {
      // already gone
    }
  }

  const ids: string[] = [];
  const start = prefs.reminder_start;
  const end = prefs.reminder_end;
  const interval = prefs.reminder_interval;
  if (start != null && end != null && interval != null && interval > 0 && end > start) {
    const perms = await Notifications.getPermissionsAsync();
    if (perms.granted) {
      const step = Math.max(15, Math.round(interval / 15) * 15);
      const count = Math.min(12, Math.floor((end - start) / step) + 1);
      for (let i = 0; i < count; i++) {
        const minutes = start + i * step;
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '💧 Drink up',
              body: 'Time for some water — stay hydrated!',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: Math.floor((minutes % 1440) / 60),
              minute: minutes % 60,
            },
          });
          ids.push(id);
        } catch {
          // skip invalid trigger
        }
      }
    }
  }
  await saveWaterPrefs({ ...prefs, notification_id: ids.join(',') || null });
}

/**
 * Schedules a one-shot local notification when a focus session ends (native only).
 * On web this is a no-op. Returns the notification id, or null.
 */
export async function scheduleFocusEndNotification(
  atMs: number,
  body: string,
): Promise<string | null> {
  if (!isNative) return null;
  if (atMs <= Date.now() + 500) return null;
  const perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '⏱ Focus complete',
      body,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(atMs) },
  });
}

