import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { PersonalRecord, WorkoutSummary } from '../../db';
import {
  deleteWorkoutCascade,
  listWorkoutSummaries,
  personalRecords,
  volumeByDay,
  workoutDays,
} from '../../db';
import { dayKey, addDays } from '../../date-utils';
import { useTheme } from '../../theme';

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function HistoryScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [summaries, setSummaries] = useState<WorkoutSummary[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [weeks, setWeeks] = useState<Array<{ label: string; total: number }>>([]);
  const [weekStreak, setWeekStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setSummaries(await listWorkoutSummaries(60));
        setRecords(await personalRecords(8));

        const days = await workoutDays();

        const thisWeekStart = startOfWeek(new Date());
        const bars: Array<{ label: string; total: number }> = [];
        for (let i = 7; i >= 0; i--) {
          const ws = addDays(thisWeekStart, -7 * i);
          const we = addDays(ws, 6);
          const map = await volumeByDay(dayKey(ws), dayKey(we));
          let total = 0;
          for (const value of Object.values(map)) total += value;
          bars.push({
            label: `${ws.getMonth() + 1}/${ws.getDate()}`,
            total,
          });
        }
        setWeeks(bars);

        let streak = 0;
        let cursor = startOfWeek(new Date());
        if (!days.some((day) => day >= dayKey(cursor))) {
          cursor = addDays(cursor, -7);
        }
        while (true) {
          const weekEnd = addDays(cursor, 6);
          const has = days.some((day) => day >= dayKey(cursor) && day <= dayKey(weekEnd));
          if (!has) break;
          streak += 1;
          cursor = addDays(cursor, -7);
          if (streak > 260) break;
        }
        setWeekStreak(streak);
      })();
    }, []),
  );

  const maxVolume = Math.max(1, ...weeks.map((w) => w.total));

  function confirmDelete(workout: WorkoutSummary) {
    Alert.alert('Delete workout?', 'This will permanently remove the workout and its sets.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteWorkoutCascade(workout.id);
            setSummaries(await listWorkoutSummaries(60));
          })(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.accent }]}>{summaries.length}</Text>
            <Text style={[styles.statLabel, { color: theme.sub }]}>Total workouts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.accent }]}>{weekStreak}</Text>
            <Text style={[styles.statLabel, { color: theme.sub }]}>Week streak</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly volume</Text>
        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.barsRow}>
            {weeks.map((week, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={[styles.barValue, { color: theme.sub }]}>
                  {week.total >= 1000 ? `${(week.total / 1000).toFixed(1)}k` : Math.round(week.total)}
                </Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, Math.round((week.total / maxVolume) * 90)),
                      backgroundColor: week.total > 0 ? theme.accent : theme.border,
                    },
                  ]}
                />
                <Text style={[styles.barLabel, { color: theme.sub }]}>{week.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {records.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal records</Text>
            {records.map((record) => (
              <View
                key={record.name}
                style={[styles.prCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Icon name="emoji-events" size={20} color="#F59E0B" />
                <Text style={[styles.prName, { color: theme.text }]} numberOfLines={1}>
                  {record.name}
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.prValue, { color: theme.text }]}>{Math.round(record.best_weight)} kg</Text>
                  <Text style={[styles.prSub, { color: theme.sub }]}>
                    e1RM {Math.round(record.best_e1rm)} kg
                  </Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>All workouts</Text>
        {summaries.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>
            No workouts yet — finish your first session on the Train tab.
          </Text>
        ) : (
          summaries.map((workout) => (
            <Pressable
              key={workout.id}
              onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
              onLongPress={() => confirmDelete(workout)}
              style={[styles.workoutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.workoutName, { color: theme.text }]} numberOfLines={1}>
                  {(workout.name || '').trim() || 'Workout'}
                </Text>
                <Text style={[styles.workoutMeta, { color: theme.sub }]}>
                  {new Date(workout.started_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' · '}
                  {workout.exercise_count} ex · {Math.round(workout.volume)} kg ·{' '}
                  {Math.max(1, Math.round((workout.ended_at! - workout.started_at) / 60000))}m
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color={theme.sub} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12.5,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 2,
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barValue: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  bar: {
    width: 18,
    borderRadius: 5,
  },
  barLabel: {
    fontSize: 9.5,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 8,
  },
  prName: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
  },
  prValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  prSub: {
    fontSize: 11,
  },
  hint: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '700',
  },
  workoutMeta: {
    fontSize: 12,
    marginTop: 1,
  },
});
