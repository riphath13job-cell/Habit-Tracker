import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { SetEntry } from '../../types';
import type { WorkoutSession } from '../../db';
import { deleteWorkoutCascade, getWorkoutSession } from '../../db';
import { useTheme } from '../../theme';

export function WorkoutDetailScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: { workoutId: number } }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setSession(await getWorkoutSession(route.params.workoutId));
      })();
    }, [route.params.workoutId]),
  );

  if (!session) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']} />;
  }

  const { workout, exercises } = session;
  const allSets = exercises.flatMap((e) => e.sets);
  const totalVolume = allSets
    .filter((s) => s.done)
    .reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
  const doneCount = allSets.filter((s) => s.done).length;
  const durationMin =
    workout.ended_at != null ? Math.max(1, Math.round((workout.ended_at - workout.started_at) / 60000)) : null;

  function setsFor(wexId: number): SetEntry[] {
    return exercises.find((e) => e.id === wexId)?.sets ?? [];
  }

  function confirmDelete() {
    Alert.alert('Delete workout?', 'This will permanently remove the workout and its sets.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteWorkoutCascade(workout.id);
            navigation.goBack();
          })(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {(workout.name || '').trim() || 'Workout'}
        </Text>
        <Pressable onPress={confirmDelete} hitSlop={8}>
          <Icon name="delete-outline" size={22} color={theme.danger} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.dateLine, { color: theme.sub }]}>
          {new Date(workout.started_at).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        <View style={styles.statRow}>
          <StatBox label="Duration" value={durationMin !== null ? `${durationMin}m` : '—'} theme={theme} />
          <StatBox label="Volume" value={`${Math.round(totalVolume)} kg`} theme={theme} />
          <StatBox label="Sets done" value={String(doneCount)} theme={theme} />
        </View>

        {exercises.map((exercise) => (
          <View key={exercise.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.exerciseName, { color: theme.text }]}>{exercise.name}</Text>
            {setsFor(exercise.id).map((set, i) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={[styles.setIndex, { color: theme.sub }]}>{i + 1}</Text>
                <Text style={[styles.setValue, { color: set.done ? theme.text : theme.sub, flex: 1 }]}>
                  {set.weight != null ? `${set.weight} kg` : '—'}
                </Text>
                <Text style={[styles.setValue, { color: set.done ? theme.text : theme.sub, flex: 1 }]}>
                  {set.reps != null ? `${set.reps} reps` : '—'}
                </Text>
                <Icon
                  name={set.done ? 'check-circle' : 'radio-button-unchecked'}
                  size={17}
                  color={set.done ? theme.good : theme.border}
                />
              </View>
            ))}
            {setsFor(exercise.id).length === 0 ? (
              <Text style={[styles.noSets, { color: theme.sub }]}>No sets logged</Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.statValue, { color: theme.accent }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.sub }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  dateLine: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 13,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11.5,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  exerciseName: {
    fontSize: 15.5,
    fontWeight: '800',
    marginBottom: 9,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  setIndex: {
    width: 34,
    fontSize: 13,
    fontWeight: '700',
  },
  setValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  noSets: {
    fontSize: 12.5,
  },
});
