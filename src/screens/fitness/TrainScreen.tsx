import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { RoutineWithCount } from '../../db';
import {
  createWorkout,
  deleteRoutine,
  getActiveWorkout,
  getFitnessPrefs,
  listRoutines,
  listWorkoutSummaries,
  saveFitnessPrefs,
  startWorkoutFromRoutine,
} from '../../db';
import { requestNotificationPermission, syncFitnessReminder } from '../../notifications';
import { WEEKDAY_LETTERS, formatReminder } from '../../date-utils';
import { useTheme } from '../../theme';
import { RoutineForm } from '../../components/fitness/RoutineForm';

function fmtDuration(ms: number): string {
  const totalMin = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDay(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  if (key === todayKey) return `Today · ${fmtDuration(Date.now() - ts)}`;
  if (key === yKey) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TrainScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [active, setActive] = useState<Awaited<ReturnType<typeof getActiveWorkout>>>(null);
  const [routines, setRoutines] = useState<RoutineWithCount[]>([]);
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof listWorkoutSummaries>>>([]);
  const [routineFormOpen, setRoutineFormOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<number | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);

  const load = useCallback(async () => {
    setActive(await getActiveWorkout());
    setRoutines(await listRoutines());
    setRecent((await listWorkoutSummaries(5)).slice(0, 5));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openRoutineForm(id: number | null) {
    setEditingRoutineId(id);
    setRoutineFormOpen(true);
  }

  async function startEmpty() {
    if (active) {
      navigation.navigate('ActiveWorkout', { workoutId: active.id });
      return;
    }
    const workout = await createWorkout('');
    navigation.navigate('ActiveWorkout', { workoutId: workout.id });
  }

  async function startRoutine(routineId: number) {
    const existing = await getActiveWorkout();
    if (existing) {
      Alert.alert(
        'Workout in progress',
        'Finish or discard your current workout before starting a routine.',
      );
      return;
    }
    const workoutId = await startWorkoutFromRoutine(routineId);
    if (workoutId !== null) navigation.navigate('ActiveWorkout', { workoutId });
  }

  function confirmDeleteRoutine(routine: RoutineWithCount) {
    Alert.alert('Delete routine?', `“${routine.name}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRoutine(routine.id);
            load();
          },
        },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Train</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate('ExerciseBook')}
            hitSlop={8}
            style={styles.gearBtn}>
            <Icon name="menu-book" size={22} color={theme.sub} />
          </Pressable>
          <Pressable onPress={() => setReminderOpen(true)} hitSlop={8} style={styles.gearBtn}>
            <Icon name="notifications" size={22} color={theme.sub} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {active ? (
          <Pressable
            onPress={() => navigation.navigate('ActiveWorkout', { workoutId: active.id })}
            style={[styles.activeCard, { backgroundColor: theme.card, borderColor: theme.accent }]}>
            <View style={[styles.pulseDot, { backgroundColor: theme.good }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeTitle, { color: theme.text }]}>Workout in progress</Text>
              <Text style={[styles.activeSub, { color: theme.sub }]}>
                {(active.name || '').trim() || 'Untitled workout'} · started{' '}
                {new Date(active.started_at).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={theme.sub} />
          </Pressable>
        ) : (
          <Pressable
            onPress={startEmpty}
            style={[styles.startButton, { backgroundColor: theme.accent }]}>
            <Icon name="play-arrow" size={26} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start empty workout</Text>
          </Pressable>
        )}

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Routines</Text>
          <Pressable onPress={() => openRoutineForm(null)} hitSlop={6}>
            <Icon name="add" size={22} color={theme.accent} />
          </Pressable>
        </View>
        {routines.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>
            Save repeatable workouts like “Push Day” to start them in one tap.
          </Text>
        ) : (
          routines.map((routine) => (
            <View
              key={routine.id}
              style={[styles.routineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Pressable style={styles.routineMain} onPress={() => startRoutine(routine.id)}>
                <Icon name="bookmark" size={20} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.routineName, { color: theme.text }]} numberOfLines={1}>
                    {routine.name}
                  </Text>
                  <Text style={[styles.routineMeta, { color: theme.sub }]}>
                    {routine.exercise_count} exercise{routine.exercise_count === 1 ? '' : 's'}
                  </Text>
                </View>
              </Pressable>
              <Pressable onPress={() => openRoutineForm(routine.id)} hitSlop={8} style={styles.iconBtn}>
                <Icon name="edit" size={19} color={theme.sub} />
              </Pressable>
              <Pressable
                onPress={() => confirmDeleteRoutine(routine)}
                hitSlop={8}
                style={styles.iconBtn}>
                <Icon name="delete-outline" size={19} color={theme.sub} />
              </Pressable>
            </View>
          ))
        )}

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent workouts</Text>
          <Pressable onPress={() => navigation.navigate('FitnessTab', { screen: 'History' })} hitSlop={6}>
            <Text style={[styles.seeAll, { color: theme.accent }]}>See all</Text>
          </Pressable>
        </View>
        {recent.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>Your finished workouts will show up here.</Text>
        ) : (
          recent.map((workout) => (
            <Pressable
              key={workout.id}
              onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
              style={[styles.recentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recentName, { color: theme.text }]} numberOfLines={1}>
                  {(workout.name || '').trim() || 'Workout'}
                </Text>
                <Text style={[styles.recentMeta, { color: theme.sub }]}>
                  {fmtDay(workout.started_at)} · {workout.exercise_count} exercises ·{' '}
                  {Math.round(workout.volume)} kg
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color={theme.sub} />
            </Pressable>
          ))
        )}
      </ScrollView>

      <RoutineForm
        visible={routineFormOpen}
        routineId={editingRoutineId}
        onClose={() => setRoutineFormOpen(false)}
        onSaved={() => {
          setRoutineFormOpen(false);
          load();
        }}
      />

      <ReminderModal
        visible={reminderOpen}
        onClose={() => setReminderOpen(false)}
      />
    </SafeAreaView>
  );
}

function ReminderModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [minutes, setMinutes] = useState<number | null>(null);
  const [days, setDays] = useState<Set<number>>(new Set([1, 3, 5]));

  React.useEffect(() => {
    if (!visible) return;
    (async () => {
      const prefs = await getFitnessPrefs();
      setMinutes(prefs.reminder_minutes);
      setDays(new Set(prefs.days.split(',').map((p) => parseInt(p, 10)).filter((n) => n >= 0 && n <= 6)));
    })();
  }, [visible]);

  function toggleDay(day: number) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function save() {
    if (days.size === 0 && minutes !== null) {
      Alert.alert('Pick days', 'Choose at least one day for the reminder.');
      return;
    }
    if (minutes !== null) await requestNotificationPermission();
    await saveFitnessPrefs({
      reminder_minutes: minutes,
      days: [...days].sort((a, b) => a - b).join(','),
      notification_id: null,
    });
    await syncFitnessReminder();
    onClose();
  }

  const timeLabel =
    minutes != null ? formatReminder(minutes) : 'Off';

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: theme.text }]}>Workout reminders</Text>

      <View style={[styles.remindCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Icon name="notifications" size={22} color={minutes != null ? theme.accent : theme.sub} />
        <Text style={[styles.remindText, { color: theme.text }]}>Weekly reminder</Text>
        <Switch
          value={minutes != null}
          onValueChange={(on) =>
            setMinutes(on ? 18 * 60 : null)
          }
          trackColor={{ false: theme.border, true: theme.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      {minutes != null ? (
        <>
          <View style={styles.chipRow}>
            {[8 * 60, 12 * 60, 17 * 60, 18 * 60, 20 * 60].map((m) => (
              <Pressable
                key={m}
                onPress={() => setMinutes(m)}
                style={[
                  styles.timeChip,
                  { backgroundColor: minutes === m ? theme.accent : theme.chipBg },
                ]}>
                <Text style={[styles.timeChipText, { color: minutes === m ? '#FFFFFF' : theme.sub }]}>
                  {formatReminder(m)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.dayRow}>
            {WEEKDAY_LETTERS.map((letter, day) => (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                style={[
                  styles.dayChip,
                  { backgroundColor: theme.chipBg, borderColor: theme.border },
                  days.has(day) && { backgroundColor: theme.accent, borderColor: theme.accent },
                ]}>
                <Text style={[styles.dayChipText, { color: days.has(day) ? '#FFFFFF' : theme.sub }]}>
                  {letter}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.remindHint, { color: theme.sub }]}>Reminds you at {timeLabel}.</Text>
        </>
      ) : null}

      <View style={styles.buttonRow}>
        <Pressable onPress={onClose} style={[styles.button, { backgroundColor: theme.chipBg }]}>
          <Text style={[styles.buttonText, { color: theme.sub }]}>Cancel</Text>
        </Pressable>
        <Pressable onPress={save} style={[styles.button, { backgroundColor: theme.accent }]}>
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save</Text>
        </Pressable>
      </View>
    </ModalShell>
  );
}

function ModalShell({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
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
  gearBtn: {
    padding: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 10,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeTitle: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  activeSub: {
    fontSize: 12.5,
    marginTop: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 10,
    gap: 4,
  },
  routineMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routineName: {
    fontSize: 15,
    fontWeight: '700',
  },
  routineMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  iconBtn: {
    padding: 7,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  recentMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  remindCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  remindText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  timeChip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    justifyContent: 'center',
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  remindHint: {
    fontSize: 12.5,
    marginTop: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
