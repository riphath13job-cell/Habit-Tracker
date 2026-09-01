import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Exercise, SetEntry } from '../../types';
import type { WorkoutSession } from '../../db';
import {
  addSetToWorkoutExercise,
  addWorkoutExercise,
  deleteWorkoutCascade,
  finishWorkout,
  getWorkoutSession,
  removeSet,
  removeWorkoutExercise,
  updateSet,
  updateWorkoutName,
} from '../../db';
import { useTheme } from '../../theme';
import { ExercisePickerModal } from '../../components/fitness/ExercisePickerModal';
import { RestTimer } from '../../components/fitness/RestTimer';

interface Drafts {
  [setId: number]: { reps?: string; weight?: string };
}

type SessionExercise = WorkoutSession['exercises'][number];

const REST_SECONDS = 90;

export function ActiveWorkoutScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: { workoutId: number } }>();
  const workoutId = route.params.workoutId;

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState<Drafts>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    const data = await getWorkoutSession(workoutId);
    if (!data) {
      navigation.goBack();
      return;
    }
    setSession(data);
    setName(data.workout.name ?? '');
  }, [workoutId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const exercises = useMemo(() => session?.exercises ?? [], [session]);

  async function commitDrafts() {
    const pending: Array<Promise<void>> = [];
    for (const exercise of exercises) {
      for (const set of exercise.sets) {
        const draft = drafts[set.id];
        if (!draft) continue;
        const reps =
          draft.reps !== undefined && draft.reps.trim() !== '' ? parseInt(draft.reps, 10) : set.reps;
        const weight =
          draft.weight !== undefined && draft.weight.trim() !== ''
            ? parseFloat(draft.weight)
            : set.weight;
        const validReps = reps !== null && Number.isFinite(reps) ? Math.max(0, Math.trunc(reps)) : null;
        const validWeight = weight !== null && Number.isFinite(weight) ? Math.max(0, weight) : null;
        if (validReps !== set.reps || validWeight !== set.weight) {
          pending.push(updateSet(set.id, { reps: validReps, weight: validWeight }));
        }
      }
    }
    if (pending.length > 0) {
      await Promise.all(pending);
      setDrafts({});
      await load();
    }
  }

  function toggleDone(set: SetEntry) {
    void (async () => {
      await commitDrafts();
      const newDone = !set.done;
      await updateSet(set.id, { done: newDone });
      if (newDone) setRestEndsAt(Date.now() + REST_SECONDS * 1000);
      await load();
    })();
  }

  async function addSet(wexId: number) {
    await commitDrafts();
    await addSetToWorkoutExercise(wexId);
    await load();
  }

  async function deleteSet(set: SetEntry) {
    await removeSet(set.id);
    await load();
  }

  function confirmRemoveExercise(exercise: SessionExercise) {
    Alert.alert('Remove exercise?', `“${exercise.name}” and its sets will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await removeWorkoutExercise(exercise.id);
            await load();
          })(),
      },
    ]);
  }

  async function pickExercise(exercise: Exercise) {
    setPickerOpen(false);
    await addWorkoutExercise(workoutId, exercise.id);
    await load();
  }

  function saveName() {
    void updateWorkoutName(workoutId, name.trim());
  }

  function confirmFinish() {
    const allSets = exercises.flatMap((e) => e.sets);
    const doneCount = allSets.filter((s) => s.done).length;
    if (doneCount === 0) {
      Alert.alert('Nothing logged', 'Check off at least one set before finishing.');
      return;
    }
    Alert.alert('Finish workout?', `${doneCount} completed set${doneCount === 1 ? '' : 's'} will be saved to history.`, [
      { text: 'Keep training', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () =>
          void (async () => {
            await commitDrafts();
            await finishWorkout(workoutId);
            navigation.goBack();
          })(),
      },
    ]);
  }

  function confirmDiscard() {
    Alert.alert('Discard workout?', 'All sets logged in this workout will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteWorkoutCascade(workoutId);
            navigation.goBack();
          })(),
      },
    ]);
  }

  if (!session) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']} />;
  }

  const elapsedMs = now - new Date(session.workout.started_at).getTime();
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <Pressable onPress={confirmDiscard} hitSlop={8}>
            <Icon name="close" size={24} color={theme.danger} />
          </Pressable>
          <View style={styles.headerCenter}>
            <TextInput
              value={name}
              onChangeText={setName}
              onEndEditing={saveName}
              placeholder="Workout name"
              placeholderTextColor={theme.sub}
              style={[styles.nameInput, { color: theme.text }]}
              maxLength={60}
            />
            <Text style={[styles.elapsed, { color: theme.accent }]}>
              {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
            </Text>
          </View>
          <Pressable onPress={confirmFinish} hitSlop={8}>
            <Icon name="check-circle" size={26} color={theme.good} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {exercises.length === 0 ? (
            <Text style={[styles.hint, { color: theme.sub }]}>
              Tap “Add exercise” below to start logging sets.
            </Text>
          ) : (
            exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                index={index + 1}
                exercise={exercise}
                sets={exercise.sets}
                drafts={drafts}
                setDraft={(
                  setId: number,
                  field: 'reps' | 'weight',
                  value: string,
                ) => setDrafts((prev) => ({ ...prev, [setId]: { ...prev[setId], [field]: value } }))}
                onToggleDone={toggleDone}
                onDeleteSet={deleteSet}
                onAddSet={() => addSet(exercise.id)}
                onRemove={() => confirmRemoveExercise(exercise)}
              />
            ))
          )}

          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[styles.addButton, { borderColor: theme.accent }]}>
            <Icon name="add" size={20} color={theme.accent} />
            <Text style={[styles.addButtonText, { color: theme.accent }]}>Add exercise</Text>
          </Pressable>

          <View style={styles.footerButtons}>
            <Pressable
              onPress={confirmFinish}
              style={[styles.finishButton, { backgroundColor: theme.accent }]}>
              <Text style={styles.finishButtonText}>Finish</Text>
            </Pressable>
            <Pressable
              onPress={confirmDiscard}
              style={[styles.discardButton, { backgroundColor: theme.chipBg }]}>
              <Text style={[styles.discardButtonText, { color: theme.danger }]}>Discard</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {restEndsAt !== null && (
        <RestTimer
          totalSec={REST_SECONDS}
          endsAt={restEndsAt}
          onAdd15={() => setRestEndsAt((prev) => (prev ?? Date.now()) + 15000)}
          onCancel={() => setRestEndsAt(null)}
        />
      )}

      <ExercisePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={pickExercise}
      />
    </SafeAreaView>
  );
}

function ExerciseCard({
  index,
  exercise,
  sets,
  drafts,
  setDraft,
  onToggleDone,
  onDeleteSet,
  onAddSet,
  onRemove,
}: {
  index: number;
  exercise: SessionExercise;
  sets: SetEntry[];
  drafts: Drafts;
  setDraft: (setId: number, field: 'reps' | 'weight', value: string) => void;
  onToggleDone: (set: SetEntry) => void;
  onDeleteSet: (set: SetEntry) => void;
  onAddSet: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.exerciseIndex, { color: theme.sub }]}>{index}</Text>
        <Text style={[styles.exerciseName, { color: theme.text }]} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
          <Icon name="close" size={18} color={theme.sub} />
        </Pressable>
      </View>

      <View style={styles.setColumnHeader}>
        <Text style={[styles.colLabel, { color: theme.sub, width: 34 }]}>SET</Text>
        <Text style={[styles.colLabel, { color: theme.sub, flex: 1 }]}>KG</Text>
        <Text style={[styles.colLabel, { color: theme.sub, flex: 1 }]}>REPS</Text>
        <View style={{ width: 66 }} />
      </View>

      {sets.map((set, i) => {
        const draft = drafts[set.id] ?? {};
        return (
          <View key={set.id} style={styles.setRow}>
            <Text style={[styles.setIndex, { color: theme.sub }]}>{i + 1}</Text>
            <TextInput
              value={draft.weight ?? (set.weight != null ? String(set.weight) : '')}
              onChangeText={(text) => setDraft(set.id, 'weight', text)}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={theme.border}
              style={[
                styles.setInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg },
              ]}
            />
            <TextInput
              value={draft.reps ?? (set.reps != null ? String(set.reps) : '')}
              onChangeText={(text) => setDraft(set.id, 'reps', text)}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={theme.border}
              style={[
                styles.setInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg },
              ]}
            />
            <Pressable
              onPress={() => onToggleDone(set)}
              style={[
                styles.doneBtn,
                {
                  borderColor: set.done ? theme.good : theme.border,
                  backgroundColor: set.done ? theme.good : 'transparent',
                },
              ]}>
              <Icon
                name="check"
                size={18}
                color={set.done ? '#FFFFFF' : theme.sub}
              />
            </Pressable>
            <Pressable onPress={() => onDeleteSet(set)} hitSlop={6} style={styles.deleteSetBtn}>
              <Icon name="delete-outline" size={17} color={theme.sub} />
            </Pressable>
          </View>
        );
      })}

      <Pressable onPress={onAddSet} style={styles.addSetBtn}>
        <Icon name="add" size={18} color={theme.accent} />
        <Text style={[styles.addSetText, { color: theme.accent }]}>Add set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  nameInput: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 2,
    maxWidth: 220,
  },
  elapsed: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 30,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 10,
  },
  exerciseIndex: {
    fontSize: 13,
    fontWeight: '800',
  },
  exerciseName: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '800',
  },
  removeBtn: {
    padding: 4,
  },
  setColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 4,
  },
  colLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  setIndex: {
    width: 34,
    fontSize: 13,
    fontWeight: '700',
  },
  setInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 15,
    marginRight: 6,
    textAlign: 'center',
  },
  doneBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  deleteSetBtn: {
    padding: 6,
    marginLeft: 2,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  addSetText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 13,
  },
  addButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  finishButton: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  discardButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  discardButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
