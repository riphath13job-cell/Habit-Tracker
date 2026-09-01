import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import type { Exercise } from '../../types';
import { getRoutine, getRoutineItems, saveRoutine } from '../../db';
import { useTheme } from '../../theme';
import { ExercisePickerModal } from './ExercisePickerModal';

interface DraftItem {
  exercise_id: number;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
}

export function RoutineForm({
  visible,
  routineId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  routineId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      if (routineId !== null) {
        const routine = await getRoutine(routineId);
        setName(routine?.name ?? '');
        const rows = await getRoutineItems(routineId);
        setItems(
          rows.map((row) => ({
            exercise_id: row.exercise_id,
            exercise_name: row.exercise_name,
            target_sets: row.target_sets,
            target_reps: row.target_reps,
          })),
        );
      } else {
        setName('');
        setItems([]);
      }
    })();
  }, [visible, routineId]);

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function moveItem(index: number, delta: number) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name needed', 'Give your routine a name first.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise to the routine.');
      return;
    }
    setSaving(true);
    try {
      await saveRoutine(routineId, trimmed, items);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>
            {routineId !== null ? 'Edit routine' : 'New routine'}
          </Text>

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Push Day"
            placeholderTextColor={theme.sub}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.card },
            ]}
            maxLength={60}
          />

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>EXERCISES</Text>
          {items.map((item, index) => (
            <View key={`${item.exercise_id}-${index}`} style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.orderCol}>
                <Pressable onPress={() => moveItem(index, -1)} hitSlop={6}>
                  <Icon name="expand-less" size={20} color={theme.sub} />
                </Pressable>
                <Pressable onPress={() => moveItem(index, 1)} hitSlop={6}>
                  <Icon name="expand-more" size={20} color={theme.sub} />
                </Pressable>
              </View>
              <View style={styles.itemMain}>
                <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                  {item.exercise_name}
                </Text>
                <View style={styles.stepperRow}>
                  <Stepper
                    label="sets"
                    value={item.target_sets}
                    onChange={(v) => updateItem(index, { target_sets: v })}
                    min={1}
                    max={10}
                  />
                  <Stepper
                    label="reps"
                    value={item.target_reps}
                    onChange={(v) => updateItem(index, { target_reps: v })}
                    min={1}
                    max={50}
                  />
                </View>
              </View>
              <Pressable
                onPress={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                hitSlop={8}
                style={styles.removeBtn}>
                <Icon name="close" size={20} color={theme.danger} />
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[styles.addButton, { borderColor: theme.accent }]}>
            <Icon name="add" size={20} color={theme.accent} />
            <Text style={[styles.addButtonText, { color: theme.accent }]}>Add exercise</Text>
          </Pressable>

          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={[styles.button, { backgroundColor: theme.chipBg }]}>
              <Text style={[styles.buttonText, { color: theme.sub }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              style={[styles.button, { backgroundColor: theme.accent }, saving && { opacity: 0.6 }]}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {saving ? 'Saving…' : 'Save routine'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(exercise: Exercise) => {
          setPickerOpen(false);
          if (items.some((i) => i.exercise_id === exercise.id)) return;
          setItems((prev) => [
            ...prev,
            {
              exercise_id: exercise.id,
              exercise_name: exercise.name,
              target_sets: 3,
              target_reps: 10,
            },
          ]);
        }}
      />
    </Modal>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stepper}>
      <Text style={[styles.stepperLabel, { color: theme.sub }]}>{label}</Text>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
        <Icon name="remove" size={16} color={theme.text} />
      </Pressable>
      <Text style={[styles.stepValue, { color: theme.text }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
        <Icon name="add" size={16} color={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  orderCol: {
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 18,
  },
  removeBtn: {
    padding: 4,
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
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 30,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
});
