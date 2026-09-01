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
import type { Exercise } from '../../types';
import { createCustomExercise } from '../../db';
import { MUSCLE_GROUPS } from '../../fitness/muscle-data';
import { useTheme } from '../../theme';

export function CustomExerciseForm({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (exercise: Exercise) => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<string>('chest');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setMuscle('chest');
    }
  }, [visible]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name needed', 'Give the exercise a name first.');
      return;
    }
    setSaving(true);
    try {
      const created = await createCustomExercise({ name: trimmed, muscle });
      onCreated(created);
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
          <Text style={[styles.title, { color: theme.text }]}>New exercise</Text>

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Zottman Curl"
            placeholderTextColor={theme.sub}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.card },
            ]}
            maxLength={60}
            autoFocus
          />

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>MUSCLE GROUP</Text>
          <View style={styles.chipWrap}>
            {MUSCLE_GROUPS.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setMuscle(m.key)}
                style={[
                  styles.chip,
                  { backgroundColor: muscle === m.key ? theme.accent : theme.chipBg },
                ]}>
                <Text style={[styles.chipText, { color: muscle === m.key ? '#FFFFFF' : theme.sub }]}>
                  {m.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={[styles.button, { backgroundColor: theme.chipBg }]}>
              <Text style={[styles.buttonText, { color: theme.sub }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              style={[styles.button, { backgroundColor: theme.accent }, saving && { opacity: 0.6 }]}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Add exercise</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '600',
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
});
