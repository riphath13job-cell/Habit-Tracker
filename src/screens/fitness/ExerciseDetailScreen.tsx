import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Exercise } from '../../types';
import {
  addWorkoutExercise,
  createWorkout,
  getActiveWorkout,
  getExercise,
} from '../../db';
import { MUSCLE_BY_KEY, MUSCLE_COLORS, type MuscleKey } from '../../fitness/muscle-data';
import {
  getExerciseReference,
  youtubeSearchUrl,
  youtubeVideoUrl,
} from '../../fitness/exercise-book';
import { useTheme } from '../../theme';

export function ExerciseDetailScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: { exerciseId: number } }>();
  const exerciseId = route.params.exerciseId;

  const [exercise, setExercise] = useState<Exercise | null>(null);

  const load = useCallback(async () => {
    setExercise(await getExercise(exerciseId));
  }, [exerciseId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!exercise) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']} />;
  }

  const ref = getExerciseReference(exercise.key);
  const muscles: Array<{ muscle: MuscleKey; engagement: number }> = ref
    ? Object.entries(ref.muscles)
        .map(([muscle, engagement]) => ({ muscle: muscle as MuscleKey, engagement: engagement as number }))
        .sort((a, b) => b.engagement - a.engagement)
    : [{ muscle: exercise.muscle as MuscleKey, engagement: 100 }];

  const watchUrl = ref?.videoId ? youtubeVideoUrl(ref.videoId) : youtubeSearchUrl(exercise.name);

  async function addToWorkout() {
    if (!exercise) return;
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

  function openVideo() {
    Linking.openURL(watchUrl).catch(() =>
      Alert.alert('Could not open YouTube', 'Please check your connection.'),
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.titleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{exercise.name}</Text>
          <View style={styles.badgeRow}>
            {ref ? (
              <View style={[styles.badge, { backgroundColor: theme.chipBg }]}>
                <Text style={[styles.badgeText, { color: theme.sub }]}>{ref.difficulty}</Text>
              </View>
            ) : null}
            {exercise.is_custom ? (
              <View style={[styles.badge, { borderColor: theme.accent, borderWidth: 1 }]}>
                <Text style={[styles.badgeText, { color: theme.accent }]}>Custom</Text>
              </View>
            ) : null}
          </View>
        </View>

        {exercise.tip ? (
          <View style={[styles.tipCard, { backgroundColor: theme.chipBg }]}>
            <Icon name="lightbulb" size={17} color="#F59E0B" />
            <Text style={[styles.tipText, { color: theme.sub }]}>{exercise.tip}</Text>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Muscles worked</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {muscles.map(({ muscle, engagement }, index) => {
            const group = MUSCLE_BY_KEY[muscle];
            return (
              <View
                key={muscle}
                style={[
                  styles.muscleRow,
                  index < muscles.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}>
                <View
                  style={[styles.muscleDot, { backgroundColor: MUSCLE_COLORS[muscle] }]}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.muscleHeader}>
                    <Text style={[styles.muscleName, { color: theme.text }]}>{group?.name ?? muscle}</Text>
                    <Text style={[styles.musclePct, { color: theme.sub }]}>{engagement}%</Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: theme.chipBg }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.max(6, engagement)}%`, backgroundColor: MUSCLE_COLORS[muscle] },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {ref ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Equipment</Text>
            <View style={styles.chipRow}>
              {ref.equipment.map((e) => (
                <View key={e} style={[styles.equipChip, { backgroundColor: theme.chipBg }]}>
                  <Icon name="fitness-center" size={14} color={theme.sub} />
                  <Text style={[styles.equipChipText, { color: theme.text }]}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Pressable
          onPress={openVideo}
          style={[styles.videoButton, { backgroundColor: '#FF0000' }]}>
          <Icon name="play-circle-fill" size={22} color="#FFFFFF" />
          <Text style={styles.videoButtonText}>
            {ref?.videoId ? 'Watch how-to video' : 'Watch guides on YouTube'}
          </Text>
        </Pressable>

        {ref ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>How to do it</Text>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {ref.instructions.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: theme.chipBg }]}>
                    <Text style={[styles.stepNumText, { color: theme.sub }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Pressable onPress={addToWorkout} style={[styles.addButton, { backgroundColor: theme.accent }]}>
          <Icon name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add to workout</Text>
        </Pressable>
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
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  titleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  muscleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  muscleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  muscleName: {
    fontSize: 14,
    fontWeight: '700',
  },
  musclePct: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  barTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  equipChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 6,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
});