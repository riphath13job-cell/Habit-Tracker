import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import type { Habit } from '../types';
import { createHabit, listHabits, updateHabit } from '../db';
import { syncReminders } from '../notifications';
import { useTheme } from '../theme';
import {
  DEFAULT_COLOR,
  DEFAULT_EMOJI,
  DEFAULT_REMINDER_MINUTES,
  HABIT_COLORS,
  HABIT_EMOJIS,
} from '../constants';
import { scheduledWeekdays, WEEKDAY_LETTERS } from '../date-utils';

export function HabitForm({
  visible,
  habit,
  onClose,
  onSaved,
}: {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [customDays, setCustomDays] = useState(false);
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set());
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(DEFAULT_REMINDER_MINUTES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (habit) {
      setName(habit.name);
      setEmoji(habit.emoji);
      setColor(habit.color);
      const days = scheduledWeekdays(habit);
      setCustomDays(days !== undefined);
      setWeekdays(new Set(days ?? []));
      setReminderOn(habit.reminder_minutes != null);
      setReminderMinutes(habit.reminder_minutes ?? DEFAULT_REMINDER_MINUTES);
    } else {
      setName('');
      setEmoji(DEFAULT_EMOJI);
      setColor(DEFAULT_COLOR);
      setCustomDays(false);
      setWeekdays(new Set());
      setReminderOn(false);
      setReminderMinutes(DEFAULT_REMINDER_MINUTES);
    }
  }, [visible, habit]);

  function toggleWeekday(day: number) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function onTimePicked(_event: DateTimePickerEvent, date?: Date) {
    if (date) {
      setReminderMinutes(date.getHours() * 60 + date.getMinutes());
    }
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name needed', 'Give your habit a name first.');
      return;
    }
    if (customDays && weekdays.size === 0) {
      Alert.alert('Pick days', 'Choose at least one day of the week, or switch to “Every day”.');
      return;
    }
    setSaving(true);
    try {
      const schedule = customDays ? [...weekdays].sort((a, b) => a - b).join(',') : 'daily';
      const base = {
        name: trimmed,
        emoji,
        color,
        schedule,
        reminder_minutes: reminderOn ? reminderMinutes : null,
        created_at: habit?.created_at ?? Date.now(),
      };
      if (habit) {
        await updateHabit({ ...base, id: habit.id });
      } else {
        await createHabit(base);
      }
      await syncReminders(await listHabits());
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const timeValue = (() => {
    const d = new Date();
    d.setHours(Math.floor(reminderMinutes / 60), reminderMinutes % 60, 0, 0);
    return d;
  })();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>
            {habit ? 'Edit habit' : 'New habit'}
          </Text>

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Drink water"
            placeholderTextColor={theme.sub}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            maxLength={60}
            autoFocus={!habit}
          />

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>ICON</Text>
          <View style={styles.emojiGrid}>
            {HABIT_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[
                  styles.emojiCell,
                  { backgroundColor: theme.chipBg },
                  emoji === e && { backgroundColor: color, transform: [{ scale: 1.1 }] },
                ]}>
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>COLOR</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}>
                {color === c ? (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                ) : null}
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>REPEAT</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setCustomDays(false)}
              style={[styles.chip, { backgroundColor: !customDays ? theme.accent : theme.chipBg }]}>
              <Text style={[styles.chipText, { color: !customDays ? '#FFFFFF' : theme.sub }]}>
                Every day
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setCustomDays(true)}
              style={[styles.chip, { backgroundColor: customDays ? theme.accent : theme.chipBg }]}>
              <Text style={[styles.chipText, { color: customDays ? '#FFFFFF' : theme.sub }]}>
                Pick days
              </Text>
            </Pressable>
          </View>
          {customDays ? (
            <View style={styles.chipRow}>
              {WEEKDAY_LETTERS.map((letter, day) => (
                <Pressable
                  key={day}
                  onPress={() => toggleWeekday(day)}
                  style={[
                    styles.dayChip,
                    { backgroundColor: theme.chipBg, borderColor: theme.border },
                    weekdays.has(day) && { backgroundColor: theme.accent, borderColor: theme.accent },
                  ]}>
                  <Text
                    style={[
                      styles.dayChipText,
                      { color: weekdays.has(day) ? '#FFFFFF' : theme.sub },
                    ]}>
                    {letter}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>REMINDER</Text>
          <View style={[styles.rowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <MaterialIcons name="notifications" size={22} color={theme.sub} />
            <Text style={[styles.rowCardText, { color: theme.text }]}>Daily reminder</Text>
            <Switch
              value={reminderOn}
              onValueChange={setReminderOn}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          {reminderOn ? (
            <View style={[styles.rowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.rowCardText, { color: theme.text }]}>Remind me at</Text>
              <DateTimePicker mode="time" value={timeValue} onChange={onTimePicked} />
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onClose}
              style={[styles.button, { backgroundColor: theme.chipBg }]}>
              <Text style={[styles.buttonText, { color: theme.sub }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              style={[styles.button, { backgroundColor: theme.accent }, saving && { opacity: 0.6 }]}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {saving ? 'Saving…' : 'Save habit'}
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
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    transform: [{ scale: 1.15 }],
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rowCardText: {
    flex: 1,
    fontSize: 15,
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
