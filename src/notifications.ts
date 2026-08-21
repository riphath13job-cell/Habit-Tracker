import * as Notifications from 'expo-notifications';
import type { Habit } from './types';

export function configureNotifications(): void {
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
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Re-syncs local reminders: one daily local notification per habit that has a
 * reminder time. Scheduling is only possible when permission is granted.
 */
export async function syncReminders(habits: Habit[]): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const withReminder = habits.filter((h) => h.reminder_minutes != null);
  if (withReminder.length === 0) return 0;
  const perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) return 0;
  for (const habit of withReminder) {
    const hour = Math.floor((habit.reminder_minutes ?? 0) / 60);
    const minute = (habit.reminder_minutes ?? 0) % 60;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${habit.emoji} ${habit.name}`,
        body: 'Keep your streak alive!',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }
  return withReminder.length;
}
