import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../icons';
import type { Habit } from '../types';
import { allCompletions, listHabits, toggleCompletion } from '../db';
import { currentStreak, greeting, isScheduled, todayKey } from '../date-utils';
import { useTheme } from '../theme';
import { ProgressRing } from '../components/ProgressRing';
import { refreshTodayWidget } from '../widgets/refreshTodayWidget';

const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function TodayScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [doneMap, setDoneMap] = useState<Map<number, Set<string>>>(new Map());

  const load = useCallback(async () => {
    const [allHabits, completions] = await Promise.all([listHabits(), allCompletions()]);
    const map = new Map<number, Set<string>>();
    for (const h of allHabits) map.set(h.id, new Set());
    for (const c of completions) map.get(c.habit_id)?.add(c.day);
    setHabits(allHabits);
    setDoneMap(map);
    void refreshTodayWidget();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const today = todayKey();
  const scheduled = (habits ?? []).filter((h) => isScheduled(h, new Date()));
  const doneCount = scheduled.filter((h) => doneMap.get(h.id)?.has(today)).length;
  const total = scheduled.length;

  async function onToggle(habit: Habit) {
    await toggleCompletion(habit.id, today);
    load();
  }

  if (habits === null) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.content}>
        <View>
          <Text style={[styles.greeting, { color: theme.sub }]}>{greeting()} 👋</Text>
          <Text style={[styles.date, { color: theme.text }]}>{DATE_FMT.format(new Date())}</Text>
        </View>

        {total === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No habits yet</Text>
            <Text style={[styles.emptyText, { color: theme.sub }]}>
              Create your first habit and start building a streak today.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Habits', { add: true })}
              style={[styles.emptyButton, { backgroundColor: theme.accent }]}>
              <Text style={styles.emptyButtonText}>Add your first habit</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.ringRow}>
              <ProgressRing
                size={130}
                stroke={11}
                progress={total === 0 ? 0 : doneCount / total}
                label={`${doneCount}/${total}`}
                sub="today"
                color={theme.accent}
                trackColor={theme.border}
                textColor={theme.text}
              />
            </View>

            <View style={styles.list}>
              {scheduled.map((habit) => {
                const done = doneMap.get(habit.id)?.has(today) ?? false;
                const streak = currentStreak(habit, doneMap.get(habit.id) ?? new Set());
                return (
                  <View
                    key={habit.id}
                    style={[styles.habitCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.emojiBadge, { backgroundColor: `${habit.color}22` }]}>
                      <Text style={styles.emoji}>{habit.emoji}</Text>
                    </View>
                    <View style={styles.habitInfo}>
                      <Text style={[styles.habitName, { color: theme.text }]} numberOfLines={1}>
                        {habit.name}
                      </Text>
                      {streak > 0 ? (
                        <Text style={[styles.streak, { color: habit.color }]}>
                          🔥 {streak} day{streak === 1 ? '' : 's'} in a row
                        </Text>
                      ) : (
                        <Text style={[styles.streak, { color: theme.sub }]}>start your streak!</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => onToggle(habit)}
                      hitSlop={6}
                      style={[
                        styles.checkButton,
                        { borderColor: habit.color },
                        done && { backgroundColor: habit.color },
                      ]}>
                      {done ? <Icon name="check" size={26} color="#FFFFFF" /> : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  date: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  ringRow: {
    alignItems: 'center',
    marginVertical: 18,
  },
  list: {
    gap: 10,
    paddingBottom: 110,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  emojiBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '700',
  },
  streak: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '600',
  },
  checkButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    padding: 28,
    marginTop: 30,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 13,
    marginTop: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
