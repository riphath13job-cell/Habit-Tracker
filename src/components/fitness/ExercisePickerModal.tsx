import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../icons';
import type { Exercise } from '../../types';
import { deleteCustomExercise, listExercises } from '../../db';
import { MUSCLE_GROUPS, type MuscleKey } from '../../fitness/muscle-data';
import { useTheme } from '../../theme';
import { CustomExerciseForm } from './CustomExerciseForm';

export function ExercisePickerModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
}) {
  const theme = useTheme();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [expanded, setExpanded] = useState<MuscleKey | null>('chest');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setExercises(await listExercises());
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  function confirmDeleteCustom(exercise: Exercise) {
    Alert.alert(
      'Delete exercise?',
      `“${exercise.name}” will be removed from the picker. Past workouts keep their history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomExercise(exercise.id);
            load();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={[styles.headerRow, { paddingTop: 54 }]}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.iconBtn}>
            <Icon name="chevron-left" size={26} color={theme.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Add exercise</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {exercises === null ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.accent} />
          ) : (
            MUSCLE_GROUPS.map((group) => {
              const items = exercises.filter((e) => e.muscle === group.key);
              if (items.length === 0) return null;
              const open = expanded === group.key;
              return (
                <View key={group.key} style={styles.sectionCard}>
                  <Pressable
                    onPress={() => setExpanded(open ? null : group.key)}
                    style={({ pressed }) => [
                      styles.sectionHeader,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      pressed && { opacity: 0.7 },
                    ]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{group.name}</Text>
                    <Text style={[styles.sectionMeta, { color: theme.sub }]}>
                      {items.length} · {group.recoveryHours}h recovery
                    </Text>
                  </Pressable>
                  {open
                    ? items.map((exercise) => (
                        <Pressable
                          key={exercise.id}
                          onPress={() => onPick(exercise)}
                          onLongPress={() =>
                            exercise.is_custom === 1 ? confirmDeleteCustom(exercise) : undefined
                          }
                          style={({ pressed }) => [
                            styles.row,
                            { borderColor: theme.border },
                            pressed && { opacity: 0.6 },
                          ]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.rowName, { color: theme.text }]}>{exercise.name}</Text>
                            {exercise.tip ? (
                              <Text style={[styles.rowTip, { color: theme.sub }]} numberOfLines={1}>
                                {exercise.tip}
                              </Text>
                            ) : null}
                          </View>
                          {exercise.is_custom === 1 ? (
                            <Text style={[styles.customTag, { color: theme.accent }]}>custom</Text>
                          ) : null}
                          <Icon name="add-circle-outline" size={22} color={theme.accent} />
                        </Pressable>
                      ))
                    : null}
                </View>
              );
            })
          )}

          <Pressable
            onPress={() => setCreating(true)}
            style={[styles.createButton, { borderColor: theme.accent }]}>
            <Icon name="add" size={20} color={theme.accent} />
            <Text style={[styles.createButtonText, { color: theme.accent }]}>Create custom exercise</Text>
          </Pressable>
        </ScrollView>
      </View>

      <CustomExerciseForm
        visible={creating}
        onClose={() => setCreating(false)}
        onCreated={(exercise) => {
          setCreating(false);
          onPick(exercise);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  iconBtn: {
    padding: 8,
    minWidth: 42,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowTip: {
    fontSize: 12,
    marginTop: 1,
  },
  customTag: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 13,
    marginTop: 4,
  },
  createButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
});
