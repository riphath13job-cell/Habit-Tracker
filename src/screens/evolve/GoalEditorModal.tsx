import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '../../icons';
import type { Goal, Habit, LifeSphere } from '../../types';
import { LIFE_SPHERES } from '../../types';
import { createGoal, deleteGoal, goalHabitIds, linkGoalHabit, listHabits, unlinkGoalHabit, updateGoal } from '../../db';
import { dayKey, todayKey } from '../../date-utils';
import { EVO, EVO_STYLES, EVO_SPHERE_COLORS, neon } from '../../evolve/palette';
import { scheduleLabel } from '../../date-utils';
import { PlatformDateTimePicker } from '../../components/PlatformDateTimePicker';

function shiftDay(key: string, delta: number): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return dayKey(d);
}

function fmtTarget(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function GoalEditorModal({
  goal,
  visible,
  onClose,
  onSaved,
}: {
  goal: Goal | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [sphere, setSphere] = useState<LifeSphere>('body');
  const [targetDay, setTargetDay] = useState<string>(shiftDay(todayKey(), 90));
  const [linked, setLinked] = useState<Set<number>>(new Set());
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    if (!visible) return;
    setHabits([]);
    void (async () => {
      const hs = await listHabits();
      setHabits(hs);
      if (goal) {
        setTitle(goal.title);
        setSphere(goal.sphere);
        setTargetDay(goal.target_day);
        const ids = await goalHabitIds(goal.id);
        setLinked(new Set(ids));
      } else {
        setTitle('');
        setSphere('body');
        setTargetDay(shiftDay(todayKey(), 90));
        setLinked(new Set());
      }
    })();
  }, [visible, goal]);

  function onDateChange(_event: unknown, date?: Date) {
    if (date) setTargetDay(dayKey(date));
  }

  function toggleHabit(id: number) {
    setLinked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) return;
    let current: Goal;
    if (goal) {
      await updateGoal({ ...goal, title: trimmed, sphere, target_day: targetDay });
      current = { ...goal, title: trimmed, sphere, target_day: targetDay };
    } else {
      current = await createGoal({ title: trimmed, sphere, target_day: targetDay });
    }
    const prior = await goalHabitIds(current.id);
    for (const id of prior) {
      if (!linked.has(id)) await unlinkGoalHabit(current.id, id);
    }
    for (const id of linked) {
      if (!prior.includes(id)) await linkGoalHabit(current.id, id);
    }
    onSaved();
    onClose();
  }

  async function remove() {
    if (!goal) return;
    await deleteGoal(goal.id);
    onSaved();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[EVO_STYLES.card, styles.card, neon(EVO.accent, 18)]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{goal ? 'Edit Goal' : 'New Goal'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="close" size={20} color={EVO.sub} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            <Text style={[EVO_STYLES.section, { marginTop: 2 }]}>TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Read 12 books this year"
              placeholderTextColor={EVO.sub}
              style={[styles.input, { borderColor: EVO.border }]}
              maxLength={80}
            />

            <Text style={EVO_STYLES.section}>TARGET DATE</Text>
            <View style={[styles.input, styles.rowInput, { borderColor: EVO.border }]}>
              <Text style={styles.targetText}>Due {fmtTarget(targetDay)}</Text>
            </View>
            <View style={[styles.pickerWrap, { paddingHorizontal: 6, backgroundColor: EVO.cardAlt, borderRadius: 14, paddingVertical: 10 }]}>
              <PlatformDateTimePicker
                value={new Date(`${targetDay}T12:00:00`)}
                mode="date"
                onChange={onDateChange}
                minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </View>

            <Text style={EVO_STYLES.section}>LIFE SPHERE</Text>
            <View style={styles.sphereRow}>
              {LIFE_SPHERES.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setSphere(s.id)}
                  style={[
                    styles.sphereChip,
                    { borderColor: sphere === s.id ? EVO_SPHERE_COLORS[s.id] : EVO.border },
                  ]}>
                  <View style={[styles.sphereDot, { backgroundColor: EVO_SPHERE_COLORS[s.id] }]} />
                  <Text style={[styles.sphereText, { color: sphere === s.id ? EVO.text : EVO.sub }]}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={EVO_STYLES.section}>LINKED HABITS ({linked.size})</Text>
            {habits.length === 0 ? (
              <Text style={[EVO_STYLES.sub, styles.noHabits]}>
                No habits yet. Add habits in the Routine tab first.
              </Text>
            ) : (
              habits.map((h) => {
                const on = linked.has(h.id);
                return (
                  <Pressable key={h.id} onPress={() => toggleHabit(h.id)} style={[styles.habitRow, { borderColor: EVO.border }]}>
                    <View style={[styles.check, on && { backgroundColor: EVO.accent, borderColor: EVO.accent }, neon(on ? EVO.accent : 'transparent', 10)]}>
                      {on ? <Icon name="check" size={13} color="#03121A" /> : null}
                    </View>
                    <Text style={styles.habitEmoji}>{h.emoji ?? '✅'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.habitName}>{h.name}</Text>
                      <Text style={[EVO_STYLES.sub, styles.habitSub]}>{scheduleLabel(h)}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <View style={styles.actions}>
            {goal ? (
              <Pressable onPress={remove} style={[styles.deleteBtn, neon(EVO.red, 10)]}>
                <Icon name="delete" size={17} color={EVO.red} />
              </Pressable>
            ) : null}
            <Pressable onPress={save} style={[styles.saveBtn, neon(EVO.accent, 16)]}>
              <Text style={styles.saveText}>{goal ? 'SAVE' : 'CREATE'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3,4,9,0.8)',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    color: EVO.text,
    fontSize: 20,
    fontWeight: '800',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: EVO.cardAlt,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: EVO.text,
    fontSize: 14.5,
    marginBottom: 12,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerWrap: {
    marginBottom: 12,
  },
  targetText: {
    color: EVO.text,
    fontSize: 14.5,
    fontWeight: '600',
  },
  sphereRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sphereChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sphereDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  sphereText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noHabits: {
    marginBottom: 10,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 7,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: EVO.sub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: {
    fontSize: 18,
  },
  habitName: {
    color: EVO.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  habitSub: {
    fontSize: 11.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  deleteBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,84,112,0.12)',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: EVO.accent,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#03121A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});