import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Habit } from '../types';
import { deleteHabit, listHabits } from '../db';
import { syncReminders } from '../notifications';
import { formatReminder, scheduleLabel } from '../date-utils';
import { useTheme } from '../theme';
import { HabitForm } from '../components/HabitForm';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function HabitsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const load = useCallback(async () => {
    setHabits(await listHabits());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Open the "new habit" form when arriving from the Today screen's empty state.
  useEffect(() => {
    const params = route.params as { add?: boolean } | undefined;
    if (params?.add) {
      (navigation as unknown as { setParams: (p: { add?: boolean }) => void }).setParams({
        add: undefined,
      });
      setEditing(null);
      setFormOpen(true);
    }
  }, [route.params, navigation]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(habit: Habit) {
    setEditing(habit);
    setFormOpen(true);
  }

  function confirmDelete(habit: Habit) {
    Alert.alert('Delete habit?', `“${habit.name}” and its whole history will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteHabit(habit.id);
          await syncReminders(await listHabits());
          load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Your habits</Text>
        <Pressable
          onPress={openNew}
          style={[styles.addButton, { backgroundColor: theme.accent }]}>
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {habits.map((habit) => (
          <View
            key={habit.id}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable style={styles.cardMain} onPress={() => openEdit(habit)}>
              <View style={[styles.emojiBadge, { backgroundColor: `${habit.color}22` }]}>
                <Text style={styles.emoji}>{habit.emoji}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {habit.name}
                </Text>
                <Text style={[styles.meta, { color: theme.sub }]}>
                  {scheduleLabel(habit)}
                  {habit.reminder_minutes != null
                    ? `  ·  🔔 ${formatReminder(habit.reminder_minutes)}`
                    : ''}
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => openEdit(habit)} hitSlop={8} style={styles.iconBtn}>
              <MaterialIcons name="edit" size={20} color={theme.sub} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(habit)} hitSlop={8} style={styles.iconBtn}>
              <MaterialIcons name="delete-outline" size={20} color={theme.sub} />
            </Pressable>
          </View>
        ))}

        {habits.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={[styles.emptyText, { color: theme.sub }]}>
              Nothing here yet — tap “New” to create a habit.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <HabitForm
        visible={formOpen}
        habit={editing}
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
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 21,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12.5,
    marginTop: 2,
  },
  iconBtn: {
    padding: 8,
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
