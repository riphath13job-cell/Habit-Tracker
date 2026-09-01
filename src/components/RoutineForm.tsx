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
import type { DailyRoutine } from '../types';
import { createDailyRoutine, renameDailyRoutine } from '../db';
import { useTheme } from '../theme';
import { ROUTINE_EMOJIS, DEFAULT_ROUTINE_EMOJI } from '../constants';

export function RoutineForm({
  visible,
  routine,
  onClose,
  onSaved,
}: {
  visible: boolean;
  routine: DailyRoutine | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(DEFAULT_ROUTINE_EMOJI);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (routine) {
      setName(routine.name);
      setEmoji(routine.emoji);
    } else {
      setName('');
      setEmoji(DEFAULT_ROUTINE_EMOJI);
    }
  }, [visible, routine]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name needed', 'Give your routine a name first.');
      return;
    }
    setSaving(true);
    try {
      if (routine) {
        await renameDailyRoutine(routine.id, trimmed, emoji);
      } else {
        await createDailyRoutine(trimmed, emoji);
      }
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
            {routine ? 'Edit routine' : 'New routine'}
          </Text>

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning routine"
            placeholderTextColor={theme.sub}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.card },
            ]}
            maxLength={40}
            autoFocus={!routine}
          />

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>ICON</Text>
          <View style={styles.emojiGrid}>
            {ROUTINE_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[
                  styles.emojiCell,
                  { backgroundColor: theme.chipBg },
                  emoji === e && { backgroundColor: theme.accent, transform: [{ scale: 1.1 }] },
                ]}>
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.hintRow}>
            <Text style={[styles.hint, { color: theme.sub }]}>
              Checklists reset automatically at 12 PM every day.
            </Text>
          </View>

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
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiCell: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  hintRow: {
    marginTop: 18,
  },
  hint: {
    fontSize: 13,
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