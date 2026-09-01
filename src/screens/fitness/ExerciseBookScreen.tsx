import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Exercise } from '../../types';
import { listExercises } from '../../db';
import { MUSCLE_BY_KEY, MUSCLE_COLORS, type MuscleKey } from '../../fitness/muscle-data';
import {
  EXERCISE_DIFFICULTIES,
  EXERCISE_EQUIPMENT,
  type ExerciseBookReference,
  type ExerciseDifficulty,
  getExerciseReference,
} from '../../fitness/exercise-book';
import { useTheme } from '../../theme';

interface BookRow {
  exercise: Exercise;
  ref: ExerciseBookReference | undefined;
}

export function ExerciseBookScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  const [rows, setRows] = useState<BookRow[]>([]);
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleKey | 'all'>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<ExerciseDifficulty | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const exercises = await listExercises();
        setRows(exercises.map((exercise) => ({ exercise, ref: getExerciseReference(exercise.key) })));
      })();
    }, []),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ exercise, ref }) => {
      if (muscleFilter !== 'all') {
        const muscles = ref ? Object.keys(ref.muscles) : [exercise.muscle];
        if (!muscles.includes(muscleFilter)) return false;
      }
      if (difficultyFilter !== 'all' && (!ref || ref.difficulty !== difficultyFilter)) return false;
      if (equipmentFilter !== 'all' && (!ref || !ref.equipment.includes(equipmentFilter))) return false;
      if (!q) return true;
      const nameMatch = exercise.name.toLowerCase().includes(q);
      const muscleMatch = MUSCLE_BY_KEY[
        (ref ? (Object.keys(ref.muscles)[0] as MuscleKey) : exercise.muscle) as MuscleKey
      ]?.name.toLowerCase().includes(q);
      const equipmentMatch = ref?.equipment.some((e) => e.includes(q));
      return nameMatch || muscleMatch || equipmentMatch;
    });
  }, [rows, query, muscleFilter, equipmentFilter, difficultyFilter]);

  const muscleLabels: Array<{ key: MuscleKey | 'all'; label: string }> = [
    { key: 'all', label: 'All muscles' },
    ...(Object.values(MUSCLE_BY_KEY).map((m) => ({ key: m.key, label: m.name })) as Array<{
      key: MuscleKey;
      label: string;
    }>),
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Exercise Book</Text>
        <Text style={[styles.headerCount, { color: theme.sub }]}>{rows.length}</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.chipBg }]}>
        <Icon name="search" size={20} color={theme.sub} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises…"
          placeholderTextColor={theme.sub}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.exercise.id)}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.chipSection}>
              <FlatList
                horizontal
                data={muscleLabels}
                keyExtractor={(item) => item.key}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                renderItem={({ item }) => (
                  <FilterChip
                    label={item.label}
                    active={muscleFilter === item.key}
                    accent={theme.accent}
                    chipBg={theme.chipBg}
                    sub={theme.sub}
                    onPress={() => setMuscleFilter(item.key)}
                  />
                )}
              />
            </View>
            <View style={styles.chipSection}>
              <FlatList
                horizontal
                data={['all', ...EXERCISE_EQUIPMENT]}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                renderItem={({ item }) => (
                  <FilterChip
                    label={item === 'all' ? 'All equipment' : item}
                    active={equipmentFilter === item}
                    accent={theme.accent}
                    chipBg={theme.chipBg}
                    sub={theme.sub}
                    onPress={() => setEquipmentFilter(item)}
                  />
                )}
              />
            </View>
            <View style={styles.chipSection}>
              <FlatList
                horizontal
                data={['all', ...EXERCISE_DIFFICULTIES]}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                renderItem={({ item }) => (
                  <FilterChip
                    label={item === 'all' ? 'All levels' : item}
                    active={difficultyFilter === item}
                    accent={theme.accent}
                    chipBg={theme.chipBg}
                    sub={theme.sub}
                    onPress={() => setDifficultyFilter(item as ExerciseDifficulty | 'all')}
                  />
                )}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.sub }]}>
            No exercises match your search.
          </Text>
        }
        renderItem={({ item }) => <ExerciseRow theme={theme} row={item} onPress={() => navigateDetail(navigation, item)} />}
      />
    </SafeAreaView>
  );
}

function navigateDetail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any,
  row: BookRow,
) {
  navigation.navigate('ExerciseDetail', { exerciseId: row.exercise.id });
}

function FilterChip({
  label,
  active,
  accent,
  chipBg,
  sub,
  onPress,
}: {
  label: string;
  active: boolean;
  accent: string;
  chipBg: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        { backgroundColor: active ? accent : chipBg },
      ]}>
      <Text style={[styles.filterChipText, { color: active ? '#FFFFFF' : sub }]}>{label}</Text>
    </Pressable>
  );
}

function ExerciseRow({
  theme,
  row,
  onPress,
}: {
  theme: ReturnType<typeof useTheme>;
  row: BookRow;
  onPress: () => void;
}) {
  const { exercise, ref } = row;
  const primary = ref
    ? (Object.keys(ref.muscles)[0] as MuscleKey)
    : (exercise.muscle as MuscleKey);
  const primaryColor = MUSCLE_COLORS[primary] ?? theme.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.exerciseCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && { opacity: 0.85 },
      ]}>
      <View
        style={[
          styles.muscleDot,
          { backgroundColor: primaryColor, borderColor: theme.border },
        ]}
      />
      <View style={{ flex: 1 }}>
        <View style={styles.exerciseTitleRow}>
          <Text style={[styles.exerciseName, { color: theme.text }]} numberOfLines={1}>
            {exercise.name}
          </Text>
          {ref ? (
            <Text style={[styles.difficultyTag, { color: theme.sub }]}>{ref.difficulty}</Text>
          ) : (
            <Text style={[styles.difficultyTag, { color: theme.sub }]}>Custom</Text>
          )}
        </View>
        <Text style={[styles.exerciseMeta, { color: theme.sub }]} numberOfLines={1}>
          {ref
            ? ref.equipment.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(' · ')
            : (MUSCLE_BY_KEY[primary]?.name ?? exercise.muscle)}
        </Text>
      </View>
      <Icon name="chevron-right" size={22} color={theme.sub} />
    </Pressable>
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
  headerCount: {
    fontSize: 15,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 4,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 10,
  },
  chipSection: {
    marginBottom: 10,
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  muscleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  difficultyTag: {
    fontSize: 11,
    fontWeight: '700',
  },
  exerciseMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});