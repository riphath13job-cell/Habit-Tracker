import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { Completion, Habit } from '../types';
import { allCompletions, completionsBetween, listHabits } from '../db';
import {
  addDays,
  bestStreak,
  completionRate,
  currentStreak,
  dayKey,
  isScheduled,
  WEEKDAY_LETTERS,
} from '../date-utils';
import { useTheme } from '../theme';
import { CalendarView } from '../components/CalendarView';

export function StatsScreen() {
  const theme = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [doneMap, setDoneMap] = useState<Map<number, Set<string>>>(new Map());
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const now = new Date();
    const [allHabits, recent, everything] = await Promise.all([
      listHabits(),
      completionsBetween(dayKey(addDays(now, -400)), dayKey(now)),
      allCompletions(),
    ]);
    const map = new Map<number, Set<string>>();
    for (const h of allHabits) map.set(h.id, new Set());
    for (const c of recent) map.get(c.habit_id)?.add(c.day);
    setHabits(allHabits);
    setDoneMap(map);
    setTotalCheckins(everything.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const today = new Date();
  const todayK = dayKey(today);
  const scheduledToday = habits.filter((h) => isScheduled(h, today));
  const doneToday = scheduledToday.filter((h) => doneMap.get(h.id)?.has(todayK)).length;
  const avgRate30 =
    habits.length === 0
      ? 0
      : habits.reduce((sum, h) => sum + completionRate(h, doneMap.get(h.id) ?? new Set(), 30), 0) /
        habits.length;

  // Last 7 days: fraction of scheduled habits completed per day.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, -(6 - i));
    const scheduled = habits.filter((h) => isScheduled(h, d));
    const done = scheduled.filter((h) => doneMap.get(h.id)?.has(dayKey(d))).length;
    return {
      key: dayKey(d),
      letter: WEEKDAY_LETTERS[d.getDay()],
      fraction: scheduled.length === 0 ? 0 : done / scheduled.length,
      isToday: dayKey(d) === todayK,
    };
  });

  const statCards = [
    { label: 'Today', value: scheduledToday.length === 0 ? '—' : `${doneToday}/${scheduledToday.length}` },
    { label: '30-day rate', value: `${Math.round(avgRate30 * 100)}%` },
    { label: 'Check-ins', value: String(totalCheckins) },
    { label: 'Habits', value: String(habits.length) },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>

        <View style={styles.statRow}>
          {statCards.map((card) => (
            <View
              key={card.label}
              style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.text }]}>{card.value}</Text>
              <Text style={[styles.statLabel, { color: theme.sub }]}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>This week</Text>
          <View style={styles.chartRow}>
            {week.map((day) => (
              <View key={day.key} style={styles.chartColumn}>
                <View style={[styles.chartTrack, { backgroundColor: theme.chipBg }]}>
                  <View
                    style={[
                      styles.chartFill,
                      { backgroundColor: day.isToday ? theme.accent : theme.good },
                      { height: `${Math.max(day.fraction * 100, day.fraction > 0 ? 6 : 0)}%` },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.chartLetter,
                    { color: day.isToday ? theme.accent : theme.sub },
                    day.isToday && { fontWeight: '800' },
                  ]}>
                  {day.letter}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.listTitle, { color: theme.text }]}>Per habit</Text>
        {habits.map((habit) => {
          const done = doneMap.get(habit.id) ?? new Set();
          const current = currentStreak(habit, done);
          const best = bestStreak(habit, done);
          const rate = completionRate(habit, done, 30);
          const expanded = expandedId === habit.id;
          return (
            <View
              key={habit.id}
              style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text
                onPress={() => setExpandedId(expanded ? null : habit.id)}
                style={styles.habitRowHeader}>
                <Text style={[styles.habitRowName, { color: theme.text }]}>
                  {habit.emoji} {habit.name}{' '}
                </Text>
                <Text style={{ color: theme.sub, fontSize: 13 }}>
                  {expanded ? '▲' : '▼'} calendar
                </Text>
              </Text>
              <View style={styles.habitStats}>
                <View style={styles.habitStat}>
                  <Text style={[styles.habitStatValue, { color: habit.color }]}>🔥 {current}</Text>
                  <Text style={[styles.habitStatLabel, { color: theme.sub }]}>current</Text>
                </View>
                <View style={styles.habitStat}>
                  <Text style={[styles.habitStatValue, { color: theme.text }]}>🏆 {best}</Text>
                  <Text style={[styles.habitStatLabel, { color: theme.sub }]}>best</Text>
                </View>
                <View style={styles.habitStat}>
                  <Text style={[styles.habitStatValue, { color: theme.text }]}>
                    {Math.round(rate * 100)}%
                  </Text>
                  <Text style={[styles.habitStatLabel, { color: theme.sub }]}>30 days</Text>
                </View>
              </View>
              {expanded ? <CalendarView habit={habit} done={done} /> : null}
            </View>
          );
        })}

        {habits.length === 0 ? (
          <Text style={[styles.empty, { color: theme.sub }]}>
            Create some habits first — stats will appear here.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartTrack: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartFill: {
    width: '100%',
    borderRadius: 8,
  },
  chartLetter: {
    fontSize: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
  },
  habitRowHeader: {
    lineHeight: 24,
  },
  habitRowName: {
    fontSize: 16,
    fontWeight: '700',
  },
  habitStats: {
    flexDirection: 'row',
    marginTop: 10,
  },
  habitStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  habitStatValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  habitStatLabel: {
    fontSize: 11,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
  },
});
