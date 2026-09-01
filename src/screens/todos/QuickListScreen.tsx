import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { Todo } from '../../types';
import {
  clearDoneQuickTodos,
  createTodo,
  deleteTodo,
  listQuickTodos,
  setTodoDone,
} from '../../db';
import { cancelScheduledNotification } from '../../notifications';
import { useTheme } from '../../theme';
import { AddTodoInput } from '../../components/AddTodoInput';
import { TodoRow } from '../../components/TodoRow';

export function QuickListScreen() {
  const theme = useTheme();
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [text, setText] = useState('');

  const load = useCallback(async () => {
    setTodos(await listQuickTodos());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const open = (todos ?? []).filter((t) => !t.done);
  const done = (todos ?? [])
    .filter((t) => !!t.done)
    .sort((a, b) => (b.completed_at ?? 0) - (a.completed_at ?? 0));

  async function add() {
    const title = text.trim();
    if (!title) return;
    await createTodo({ collection_id: null, title });
    setText('');
    load();
  }

  async function toggle(todo: Todo) {
    await setTodoDone(todo.id, !todo.done);
    if (!todo.done) await cancelScheduledNotification(todo.notification_id);
    load();
  }

  async function remove(todo: Todo) {
    await cancelScheduledNotification(todo.notification_id);
    await deleteTodo(todo.id);
    load();
  }

  async function clearDone() {
    await clearDoneQuickTodos();
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>To-Dos</Text>
        <Text style={[styles.counter, { color: theme.sub }]}>
          {open.length > 0 ? `${open.length} open` : 'All done 🎉'}
        </Text>
      </View>

      <AddTodoInput value={text} onChangeText={setText} onSubmit={add} />

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {open.map((todo) => (
          <TodoRow
            key={todo.id}
            title={todo.title}
            done={false}
            onToggle={() => toggle(todo)}
            onDelete={() => remove(todo)}
          />
        ))}

        {done.length > 0 ? (
          <View style={styles.doneHeader}>
            <Text style={[styles.doneTitle, { color: theme.sub }]}>Completed</Text>
            <Pressable onPress={clearDone} hitSlop={6}>
              <Text style={[styles.clearText, { color: theme.danger }]}>Clear done</Text>
            </Pressable>
          </View>
        ) : null}
        {done.map((todo) => (
          <TodoRow
            key={todo.id}
            title={todo.title}
            done
            onToggle={() => toggle(todo)}
            onDelete={() => remove(todo)}
          />
        ))}

        {todos.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>⚡</Text>
            <Text style={[styles.emptyText, { color: theme.sub }]}>
              Nothing yet — add your first task above.
            </Text>
          </View>
        ) : null}
      </ScrollView>
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
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
    paddingBottom: 110,
  },
  doneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  doneTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
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
