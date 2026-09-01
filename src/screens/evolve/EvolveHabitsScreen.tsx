import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Completion, Habit } from '../../types';
import { allCompletions, listHabits, toggleCompletion } from '../../db';
import { currentStreak, formatReminder, scheduleLabel, todayKey } from '../../date-utils';
import { completedSet, longestStreak, perHabitDone } from '../../evolve/stats';
import { EVO, EVO_GAP, EVO_STYLES, neon } from '../../evolve/palette';
import { HabitForm } from '../../components/HabitForm';
import { LIFE_SPHERES } from '../../types';

export function EvolveHabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const load = useCallback(async () => {
    const [hs, cs] = await Promise.all([listHabits(), allCompletions()]);
    setHabits(hs);
    setCompletions(cs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const today = todayKey();
  const done = completedSet(completions);
  const doneByHabit = perHabitDone(completions);
  const topStreak = longestStreak(habits, completions);

  async function toggleDone(habit: Habit) {
    await toggleCompletion(habit.id, today);
    load();
  }

  function openEdit(habit: Habit) {
    setEditing(habit);
    setFormOpen(true);
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  const uncheckedToday = habits.filter((h) => isDueToday(h, done, today));

  return (
    <SafeAreaView style={EVO_STYLES.safe} edges={['top']}>
      <View style={EVO_STYLES.headerRow}>
        <Text style={EVO_STYLES.title}>Routine</Text>
        <View style={styles.headerActions}>
          {habits.length > 0 ? (
            <Text style={[EVO_STYLES.sub, styles.dueChip]}>
              {uncheckedToday.length > 0 ? `${uncheckedToday.length} left today` : 'All done'}
            </Text>
          ) : null}
          <Pressable onPress={openNew} hitSlop={8} style={styles.addBtn}>
            <Icon name="add" size={22} color={EVO.accent} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: EVO_GAP }}>
        {habits.length === 0 ? (
          <View style={[EVO_STYLES.card, styles.empty, EVO_STYLES.content]}>
            <View style={[styles.emptyBadge, neon(EVO.orange, 14)]}>
              <Icon name="fitness-center" size={30} color={EVO.orange} />
            </View>
            <Text style={[EVO_STYLES.title, styles.emptyTitle]}>No habits yet</Text>
            <Text style={[EVO_STYLES.sub, styles.emptyText]}>
              Add your first habit to start building streaks. Assign a Life Sphere so Performance can track it.
            </Text>
            <Pressable onPress={openNew} style={[styles.emptyBtn, neon(EVO.accent, 16)]}>
              <Text style={styles.emptyBtnText}>ADD HABIT</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[EVO_STYLES.card, styles.streakHero, { ...neon(EVO.orange, 14) }]}>
              <View style={styles.streakLeft}>
                <View style={[styles.streakBadge, neon(EVO.orange, 16)]}>
                  <Text style={styles.streakFire}>🔥</Text>
                </View>
              </View>
              <View style={styles.streakCenter}>
                <View style={styles.streakLabelRow}>
                  <View style={styles.streakTitleRow}>
                    <Text style={styles.streakLabel}>HABIT STREAK</Text>
                    <Text style={styles.streakEmoji}>🔥</Text>
                  </View>
                  <Text style={[styles.streakDays, neon(EVO.orange, 14)]}>
                    {topStreak} day{topStreak === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text style={styles.streakSub}>Nice momentum — keep the chain alive.</Text>
              </View>
            </View>

            <View style={styles.listWrap}>
              <View style={[EVO_STYLES.card, styles.listCard, styles.listCardFill, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
                <Text style={[EVO_STYLES.section, { marginBottom: 10 }]}>TODAY</Text>
                {habits.map((h) => {
                  const isDone = done.has(`${h.id}:${today}`);
                  const streak = currentStreak(h, doneByHabit.get(h.id) ?? new Set());
                  return (
                    <Pressable
                      key={h.id}
                      onPress={() => openEdit(h)}
                      style={styles.habitRow}>
                      <Pressable
                        onPress={() => void toggleDone(h)}
                        hitSlop={6}
                        style={[
                          styles.toggle,
                          isDone && [styles.toggleOn, neon(EVO.green, 12)],
                        ]}>
                        {isDone ? <Icon name="check" size={18} color="#04120A" /> : null}
                      </Pressable>
                      <View style={[styles.habitIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                        <Text style={styles.habitEmoji}>{h.emoji ?? '✅'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.habitName}>{h.name}</Text>
                        <Text style={styles.habitMeta}>{habitSubtitle(h)}</Text>
                      </View>
                      {streak > 0 ? (
                        <View style={[styles.pill, { ...neon(EVO.orange, 10) }]}>
                          <Text style={styles.pillText}>🔥 {streak}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              <View style={[EVO_STYLES.card, styles.filterCard]}>
                {LIFE_SPHERES.map((s) => (
                  <View key={s.id} style={styles.filterRow}>
                    <View style={styles.filterRowLeft}>
                      <View style={styles.filterDot} />
                      <Text style={styles.filterLabel}>{s.label}</Text>
                    </View>
                    <Text style={styles.filterCount}>
                      {habits.filter((h) => (h.sphere ?? 'body') === s.id).length}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Pressable onPress={openNew} style={styles.addHabitRow}>
              <Icon name="add" size={16} color={EVO.accent} />
              <Text style={styles.addHabitText}>Add a new habit</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <HabitForm
        visible={formOpen}
        habit={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </SafeAreaView>
  );
}

function isDueToday(habit: Habit, done: Set<string>, today: string): boolean {
  const weekday = new Date(`${today}T12:00:00`).getDay();
  const days = habit.schedule && habit.schedule !== 'daily' ? habit.schedule.split(',').map(Number) : null;
  const due = days === null ? true : days.includes(weekday);
  return due && !done.has(`${habit.id}:${today}`);
}

function habitSubtitle(h: Habit): string {
  const parts = [scheduleLabel(h)];
  if (h.reminder_minutes != null) parts.push(`Reminder ${formatReminder(h.reminder_minutes)}`);
  return parts.join(' · ');
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dueChip: {
    backgroundColor: 'rgba(0,217,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,217,255,0.12)',
  },
  listWrap: {
    gap: 0,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 44,
  },
  emptyBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,159,28,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: EVO.accent,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyBtnText: {
    color: '#03121A',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streakHero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  streakLeft: {
    flexDirection: 'row',
  },
  streakBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,159,28,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakFire: {
    fontSize: 26,
  },
  streakCenter: {
    flex: 1,
  },
  streakLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakLabel: {
    color: EVO.sub,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  streakEmoji: {
    fontSize: 13,
  },
  streakDays: {
    color: EVO.orange,
    fontSize: 24,
    fontWeight: '800',
  },
  streakSub: {
    fontSize: 12.5,
    marginTop: 4,
  },
  listCard: {
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 4,
  },
  listCardFill: {
    backgroundColor: EVO.card,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
    borderBottomColor: EVO.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 2,
  },
  toggle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: EVO.sub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOn: {
    borderColor: EVO.green,
    backgroundColor: EVO.green,
  },
  habitIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: {
    fontSize: 19,
  },
  habitName: {
    color: EVO.text,
    fontSize: 15,
    fontWeight: '700',
  },
  habitMeta: {
    color: EVO.sub,
    fontSize: 12,
    marginTop: 1,
  },
  pill: {
    backgroundColor: 'rgba(255,159,28,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillText: {
    color: EVO.orange,
    fontSize: 12.5,
    fontWeight: '800',
  },
  filterCard: {
    padding: 14,
    gap: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EVO.accent,
  },
  filterLabel: {
    color: EVO.text,
    fontSize: 13.5,
    fontWeight: '600',
  },
  filterCount: {
    color: EVO.sub,
    fontSize: 13,
    fontWeight: '700',
  },
  addHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: EVO.border,
    borderStyle: 'dashed',
  },
  addHabitText: {
    color: EVO.accent,
    fontSize: 13.5,
    fontWeight: '700',
  },
});