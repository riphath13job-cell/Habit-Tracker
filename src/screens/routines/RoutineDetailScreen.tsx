import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { DailyRoutine, DailyRoutineItem } from '../../types';
import {
  addDailyRoutineItem,
  dailyRoutineCompletions,
  deleteDailyRoutine,
  deleteDailyRoutineItem,
  getDailyRoutine,
  listDailyRoutineItems,
  resetDailyRoutine,
  toggleDailyRoutineItem,
} from '../../db';
import { useTheme } from '../../theme';
import { formatReminder, ROUTINE_RESET_MINUTES, routineDayKey } from '../../date-utils';
import { AddTodoInput } from '../../components/AddTodoInput';
import { TodoRow } from '../../components/TodoRow';
import { RoutineForm } from '../../components/RoutineForm';

export function RoutineDetailScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const routineId: number = route.params?.id;

  const [routine, setRoutine] = useState<DailyRoutine | null>(null);
  const [items, setItems] = useState<DailyRoutineItem[] | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [day, setDay] = useState(routineDayKey());
  const [text, setText] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    const [r, its, completions] = await Promise.all([
      getDailyRoutine(routineId),
      listDailyRoutineItems(routineId),
      dailyRoutineCompletions(routineDayKey()),
    ]);
    setRoutine(r);
    setItems(its);
    setDay(routineDayKey());
    setDone(new Set(completions.map((c) => c.item_id)));
  }, [routineId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function add() {
    const title = text.trim();
    if (!title) return;
    await addDailyRoutineItem(routineId, title);
    setText('');
    load();
  }

  async function toggle(item: DailyRoutineItem) {
    await toggleDailyRoutineItem(item.id, day);
    load();
  }

  async function remove(item: DailyRoutineItem) {
    await deleteDailyRoutineItem(item.id);
    load();
  }

  function confirmReset() {
    Alert.alert(
      'Reset checklist?',
      `Everything in “${routine?.name ?? 'this routine'}” will be unchecked for now. It still resets on its own at ${formatReminder(ROUTINE_RESET_MINUTES)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => { await resetDailyRoutine(routineId, day); load(); } },
      ],
    );
  }

  function confirmDeleteRoutine() {
    Alert.alert('Delete routine?', `“${routine?.name}” and all its tasks will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDailyRoutine(routineId);
          navigation.goBack();
        },
      },
    ]);
  }

  if (items === null || !routine) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const doneCount = items.filter((i) => done.has(i.id)).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <Icon name="chevron-left" size={26} color={theme.text} />
        </Pressable>
        <View style={styles.headerMiddle}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {routine.emoji} {routine.name}
          </Text>
          <Text style={[styles.counter, { color: theme.sub }]}>
            {items.length === 0
              ? `Resets at ${formatReminder(ROUTINE_RESET_MINUTES)}`
              : doneCount === items.length
                ? `All done 🎉`
                : `${doneCount}/${items.length} done`}
          </Text>
        </View>
        <Pressable onPress={() => setFormOpen(true)} hitSlop={8} style={styles.iconBtn}>
          <Icon name="edit" size={20} color={theme.sub} />
        </Pressable>
        <Pressable onPress={confirmDeleteRoutine} hitSlop={8} style={styles.iconBtn}>
          <Icon name="delete-outline" size={20} color={theme.danger} />
        </Pressable>
      </View>

      <Pressable onPress={confirmReset} style={[styles.resetPill, { backgroundColor: theme.chipBg }]}>
        <Icon name="restart-alt" size={16} color={theme.sub} />
        <Text style={[styles.resetPillText, { color: theme.sub }]}>
          Reset checklist now · auto-resets at {formatReminder(ROUTINE_RESET_MINUTES)}
        </Text>
      </Pressable>

      <AddTodoInput value={text} onChangeText={setText} onSubmit={add} />

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {items.map((item) => (
          <TodoRow
            key={item.id}
            title={item.title}
            done={done.has(item.id)}
            onToggle={() => toggle(item)}
            onDelete={() => remove(item)}
          />
        ))}

        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>{routine.emoji}</Text>
            <Text style={[styles.emptyText, { color: theme.sub }]}>
              Add the things you need to do each day, like brush your teeth or take a cold shower.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <RoutineForm
        visible={formOpen}
        routine={routine}
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
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  iconBtn: {
    padding: 8,
  },
  headerMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  counter: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 1,
  },
  resetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  resetPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
    paddingBottom: 110,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
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