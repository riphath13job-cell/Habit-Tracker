import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { DailyRoutine, DailyRoutineItem } from '../../types';
import {
  dailyRoutineCompletions,
  listAllDailyRoutineItems,
  listDailyRoutines,
} from '../../db';
import { useTheme } from '../../theme';
import { formatReminder, ROUTINE_RESET_MINUTES, routineDayKey } from '../../date-utils';
import { RoutineForm } from '../../components/RoutineForm';

export function RoutinesHomeScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [routines, setRoutines] = useState<DailyRoutine[] | null>(null);
  const [items, setItems] = useState<DailyRoutineItem[]>([]);
  const [doneForDay, setDoneForDay] = useState<Set<number>>(new Set());
  const [day, setDay] = useState(routineDayKey());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DailyRoutine | null>(null);

  const load = useCallback(async () => {
    const [rs, its, completions] = await Promise.all([
      listDailyRoutines(),
      listAllDailyRoutineItems(),
      dailyRoutineCompletions(routineDayKey()),
    ]);
    setRoutines(rs);
    setItems(its);
    setDay(routineDayKey());
    setDoneForDay(new Set(completions.map((c) => c.item_id)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (routines === null) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  function stats(routine: DailyRoutine) {
    const its = items.filter((i) => i.routine_id === routine.id);
    const done = its.filter((i) => doneForDay.has(i.id)).length;
    return { done, total: its.length };
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Routines</Text>
          <Text style={[styles.subtitle, { color: theme.sub }]}>
            Resets at {formatReminder(ROUTINE_RESET_MINUTES)} · {day}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          style={[styles.addButton, { backgroundColor: theme.accent }]}>
          <Icon name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {routines.map((routine) => {
            const s = stats(routine);
            return (
              <Pressable
                key={routine.id}
                onPress={() => navigation.navigate('RoutineDetail', { id: routine.id })}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  pressed && { opacity: 0.7 },
                ]}>
                <View style={[styles.tileBadge, { backgroundColor: theme.chipBg }]}>
                  <Text style={styles.tileEmoji}>{routine.emoji}</Text>
                </View>
                <Text style={[styles.tileName, { color: theme.text }]} numberOfLines={1}>
                  {routine.name}
                </Text>
                <Text style={[styles.tileMeta, { color: theme.sub }]}>
                  {s.total === 0
                    ? 'No tasks yet'
                    : s.done === s.total
                      ? 'All done 🎉'
                      : `${s.done}/${s.total} done`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {routines.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🔁</Text>
            <Text style={[styles.emptyText, { color: theme.sub }]}>
              No routines yet — tap “New” to make one, like a Morning routine with brushing your
              teeth and a cold shower.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <RoutineForm
        visible={formOpen}
        routine={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    paddingBottom: 110,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  tile: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  tileBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: {
    fontSize: 22,
  },
  tileName: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  tileMeta: {
    fontSize: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});