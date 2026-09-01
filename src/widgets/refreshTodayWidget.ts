import { Platform } from 'react-native';

import { allCompletions, listHabits } from '../db';
import { currentStreak, isScheduled, todayKey } from '../date-utils';
import type { TodayWidgetProps } from './TodayWidgetProps';

/**
 * Refreshes the "Today" home-screen widget with the current habit progress.
 *
 * This is a no-op on any platform other than iOS, and the widget module is
 * only required lazily inside the iOS guard so `@expo/ui/swift-ui` never
 * executes on web/desktop builds.
 */
export async function refreshTodayWidget(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  try {
    const [allHabits, completions] = await Promise.all([listHabits(), allCompletions()]);
    const map = new Map<number, Set<string>>();
    for (const habit of allHabits) map.set(habit.id, new Set());
    for (const completion of completions) map.get(completion.habit_id)?.add(completion.day);

    const today = todayKey();
    const scheduled = allHabits.filter((habit) => isScheduled(habit, new Date()));
    const doneCount = scheduled.filter((habit) => map.get(habit.id)?.has(today)).length;
    const bestStreak = scheduled.reduce(
      (best, habit) => Math.max(best, currentStreak(habit, map.get(habit.id) ?? new Set())),
      0,
    );

    const props: TodayWidgetProps = {
      done: doneCount,
      total: scheduled.length,
      streak: bestStreak,
      habits: scheduled.map((habit) => ({
        id: habit.id,
        name: habit.name,
        emoji: habit.emoji,
        done: map.get(habit.id)?.has(today) ?? false,
      })),
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TodayWidget = require('./TodayWidget') as typeof import('./TodayWidget');
    TodayWidget.default.updateSnapshot(props);
  } catch (error) {
    console.warn('[widgets] Failed to refresh Today widget', error);
  }
}