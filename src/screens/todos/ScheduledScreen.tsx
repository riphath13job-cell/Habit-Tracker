import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Todo } from '../../types';
import {
  deleteTodo,
  scheduledTodos,
  setTodoDone,
  setTodoNotificationId,
} from '../../db';
import {
  cancelScheduledNotification,
  scheduleTodoReminder,
} from '../../notifications';
import { useTheme } from '../../theme';
import { TodoRow } from '../../components/TodoRow';
import { ScheduledTodoForm } from '../../components/ScheduledTodoForm';

interface Section {
  key: string;
  label: string;
  accent?: string;
  items: Todo[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_FMT = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function ScheduledScreen() {
  const theme = useTheme();
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);

  const load = useCallback(async () => {
    setTodos(await scheduledTodos());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggle(todo: Todo) {
    const next = !todo.done;
    await setTodoDone(todo.id, next);
    if (next) {
      await cancelScheduledNotification(todo.notification_id);
      await setTodoNotificationId(todo.id, null);
    } else if (todo.remind_at != null && todo.remind_at > Date.now()) {
      const id = await scheduleTodoReminder(todo.id, todo.title, todo.remind_at);
      await setTodoNotificationId(todo.id, id);
    }
    load();
  }

  async function remove(todo: Todo) {
    await cancelScheduledNotification(todo.notification_id);
    await deleteTodo(todo.id);
    load();
  }

  if (todos === null) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const now = Date.now();
  const todayStart = startOfDay(now);

  const sections: Section[] = [];
  const byKey = new Map<string, Section>();
  for (const todo of todos) {
    const due = todo.due_at ?? 0;
    const dayStart = startOfDay(due);
    let label: string;
    let accent: string | undefined;
    if (dayStart < todayStart) {
      label = 'Overdue';
      accent = theme.danger;
    } else if (dayStart === todayStart) {
      label = 'Today';
    } else if (dayStart === todayStart + DAY_MS) {
      label = 'Tomorrow';
    } else {
      label = DAY_FMT.format(new Date(dayStart));
    }
    const key = `${label}-${dayStart}`;
    let section = byKey.get(key);
    if (!section) {
      section = { key, label, accent, items: [] };
      byKey.set(key, section);
      sections.push(section);
    }
    section.items.push(todo);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Scheduled</Text>
        <Pressable
          onPress={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          style={[styles.addButton, { backgroundColor: theme.accent }]}>
          <Icon name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: section.accent ?? theme.sub },
              ]}>
              {section.label.toUpperCase()}
            </Text>
            {section.items.map((todo) => {
              const time = new Date(todo.due_at ?? 0).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              });
              return (
                <TodoRow
                  key={todo.id}
                  title={todo.title}
                  sub={`${time}${todo.remind_at != null ? '  🔔' : ''}`}
                  done={!!todo.done}
                  onToggle={() => toggle(todo)}
                  onDelete={() => remove(todo)}
                  onPress={() => {
                    setEditing(todo);
                    setFormOpen(true);
                  }}
                />
              );
            })}
          </View>
        ))}

        {todos.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={[styles.emptyText, { color: theme.sub }]}>
              Nothing scheduled — tap “New” to plan a task with a reminder.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <ScheduledTodoForm
        visible={formOpen}
        todo={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    gap: 14,
    paddingBottom: 110,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
