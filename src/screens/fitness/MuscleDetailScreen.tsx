import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Exercise } from '../../types';
import {
  addWorkoutExercise,
  createWorkout,
  exercisesForMuscle,
  getActiveWorkout,
  lastTrainedByMuscle,
} from '../../db';
import { MUSCLE_BY_KEY, MUSCLE_COLORS, MUSCLE_OUTLINE, type MuscleKey } from '../../fitness/muscle-data';
import { useTheme } from '../../theme';

export function MuscleDetailScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: { muscle: MuscleKey } }>();
  const group = MUSCLE_BY_KEY[route.params.muscle];

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recoveryFrac, setRecoveryFrac] = useState<number | null>(null);

  const load = useCallback(async () => {
    setExercises(await exercisesForMuscle(group.key));
    const lastTrained = await lastTrainedByMuscle();
    const last = lastTrained[group.key];
    if (last) {
      const hoursSince = (Date.now() - last) / 3600000;
      if (hoursSince < group.recoveryHours) {
        setRecoveryFrac(1 - hoursSince / group.recoveryHours);
        return;
      }
    }
    setRecoveryFrac(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.key]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function addToWorkout(exercise: Exercise) {
    const active = await getActiveWorkout();
    let workoutId: number;
    if (active) {
      workoutId = active.id;
    } else {
      workoutId = (await createWorkout('')).id;
    }
    await addWorkoutExercise(workoutId, exercise.id);
    navigation.navigate('ActiveWorkout', { workoutId });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{group.name}</Text>
        <View
          style={[
            styles.colorChip,
            { backgroundColor: MUSCLE_COLORS[group.key], borderColor: MUSCLE_OUTLINE },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.description, { color: theme.text }]}>{group.description}</Text>

        <View style={[styles.recoveryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.recoveryHeader}>
            <Icon
              name={recoveryFrac !== null ? 'autorenew' : 'check-circle'}
              size={18}
              color={recoveryFrac !== null ? '#22C55E' : theme.good}
            />
            <Text style={[styles.recoveryTitle, { color: theme.text }]}>
              {recoveryFrac !== null ? 'Recovering' : 'Ready to train'}
            </Text>
          </View>
          <View style={[styles.barTrack, { backgroundColor: theme.chipBg }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.max(4, Math.round((1 - (recoveryFrac ?? 0)) * 100))}%`,
                  backgroundColor: theme.good,
                },
              ]}
            />
          </View>
          <Text style={[styles.recoveryMeta, { color: theme.sub }]}>
            Typical recovery: ~{group.recoveryHours}h after your last session.
          </Text>
        </View>

        <View style={[styles.tipCard, { backgroundColor: theme.chipBg }]}>
          <Icon name="lightbulb" size={17} color="#F59E0B" />
          <Text style={[styles.tipText, { color: theme.sub }]}>{group.tip}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Exercises</Text>
        {exercises.map((exercise) => (
          <View
            key={exercise.id}
            style={[styles.exerciseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, { color: theme.text }]} numberOfLines={1}>
                  {exercise.name}
                </Text>
                {exercise.is_custom ? (
                  <View style={[styles.customBadge, { borderColor: theme.accent }]}>
                    <Text style={[styles.customBadgeText, { color: theme.accent }]}>Custom</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.exerciseTip, { color: theme.sub }]}>{exercise.tip}</Text>
            </View>
            <Pressable
              onPress={() => addToWorkout(exercise)}
              hitSlop={6}
              style={[styles.addBtn, { backgroundColor: theme.accent }]}>
              <Icon name="add" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  colorChip: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  description: {
    fontSize: 14.5,
    lineHeight: 21,
  },
  recoveryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
  },
  recoveryTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  recoveryMeta: {
    fontSize: 12,
    marginTop: 8,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    padding: 13,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 2,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  exerciseName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  customBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  exerciseTip: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
