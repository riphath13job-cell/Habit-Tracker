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
import { Icon } from '../icons';
import type { Todo } from '../types';
import { createTodo, setTodoNotificationId, setTodoReminder, updateTodoContent } from '../db';
import {
  cancelScheduledNotification,
  requestNotificationPermission,
  scheduleTodoReminder,
} from '../notifications';
import { useTheme } from '../theme';
import { PlatformDateTimePicker } from './PlatformDateTimePicker';

const DATE_FMT = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

function defaultDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function ScheduledTodoForm({
  visible,
  todo,
  onClose,
  onSaved,
}: {
  visible: boolean;
  todo: Todo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(() => defaultDate());
  const [remind, setRemind] = useState(true);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (todo && todo.due_at != null) {
      setTitle(todo.title);
      setDate(new Date(todo.due_at));
      setRemind(todo.remind_at != null);
    } else {
      setTitle('');
      setDate(defaultDate());
      setRemind(true);
    }
    setShowDate(false);
    setShowTime(false);
  }, [visible, todo]);

  function onDatePicked(_event: { type: string }, picked?: Date) {
    setShowDate(false);
    if (picked) {
      setDate((prev) => {
        const next = new Date(picked);
        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
        return next;
      });
    }
  }

  function onTimePicked(_event: { type: string }, picked?: Date) {
    setShowTime(false);
    if (picked) {
      setDate((prev) => {
        const next = new Date(prev);
        next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
        return next;
      });
    }
  }

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Title needed', 'Give your task a title first.');
      return;
    }
    setSaving(true);
    try {
      const dueAt = date.getTime();
      if (todo) {
        await cancelScheduledNotification(todo.notification_id);
        await updateTodoContent(todo.id, { title: trimmed, due_at: dueAt });
        let notificationId: string | null = null;
        if (remind) {
          const granted = await requestNotificationPermission();
          if (granted) {
            notificationId = await scheduleTodoReminder(todo.id, trimmed, dueAt);
          } else {
            Alert.alert(
              'Reminders blocked',
              'Enable notifications in iOS Settings to get reminded.',
            );
          }
        }
        await setTodoReminder(todo.id, notificationId != null ? dueAt : null);
        await setTodoNotificationId(todo.id, notificationId);
      } else {
        const created = await createTodo({ collection_id: null, title: trimmed, due_at: dueAt });
        if (remind) {
          const granted = await requestNotificationPermission();
          if (granted) {
            const notificationId = await scheduleTodoReminder(created.id, trimmed, dueAt);
            await setTodoNotificationId(created.id, notificationId);
            await setTodoReminder(created.id, dueAt);
          } else {
            Alert.alert(
              'Reminders blocked',
              'Enable notifications in iOS Settings to get reminded.',
            );
          }
        }
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
            {todo ? 'Edit scheduled task' : 'New scheduled task'}
          </Text>

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>TASK</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Pay rent"
            placeholderTextColor={theme.sub}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.card },
            ]}
            maxLength={200}
            autoFocus={!todo}
          />

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>WHEN</Text>
          <Pressable
            onPress={() => {
              setShowDate((v) => !v);
              setShowTime(false);
            }}
            style={[styles.rowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Icon name="event" size={22} color={theme.sub} />
            <Text style={[styles.rowCardText, { color: theme.text }]}>{DATE_FMT.format(date)}</Text>
            <Icon name={showDate ? 'expand-less' : 'expand-more'} size={22} color={theme.sub} />
          </Pressable>
          {showDate ? (
            <PlatformDateTimePicker mode="date" value={date} onChange={onDatePicked} />
          ) : null}
          <Pressable
            onPress={() => {
              setShowTime((v) => !v);
              setShowDate(false);
            }}
            style={[styles.rowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Icon name="schedule" size={22} color={theme.sub} />
            <Text style={[styles.rowCardText, { color: theme.text }]}>
              {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </Text>
            <Icon name={showTime ? 'expand-less' : 'expand-more'} size={22} color={theme.sub} />
          </Pressable>
          {showTime ? (
            <PlatformDateTimePicker mode="time" value={date} onChange={onTimePicked} />
          ) : null}

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>REMINDER</Text>
          <View style={[styles.rowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Icon name="notifications" size={22} color={remind ? theme.accent : theme.sub} />
            <View style={styles.rowCardTextWrap}>
              <Text style={[styles.rowCardText, { color: theme.text }]}>Notify me</Text>
              {remind ? (
                <Text style={[styles.reminderHint, { color: theme.sub }]}>
                  Fires when the task is due.
                </Text>
              ) : null}
            </View>
            <Switch
              value={remind}
              onValueChange={setRemind}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
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
                {saving ? 'Saving…' : 'Save task'}
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
  rowCardTextWrap: {
    flex: 1,
  },
  rowCardText: {
    flex: 1,
    fontSize: 15,
  },
  reminderHint: {
    fontSize: 12,
    marginTop: 2,
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
