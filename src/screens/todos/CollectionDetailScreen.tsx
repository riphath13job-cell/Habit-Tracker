import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Todo, TodoCollection } from '../../types';
import {
  createTodo,
  deleteCollection,
  deleteTodo,
  getCollection,
  setTodoDone,
  todosInCollection,
} from '../../db';
import { cancelScheduledNotification } from '../../notifications';
import { useTheme } from '../../theme';
import { AddTodoInput } from '../../components/AddTodoInput';
import { TodoRow } from '../../components/TodoRow';
import { CollectionForm } from '../../components/CollectionForm';

export function CollectionDetailScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const collectionId: number = route.params?.id;

  const [collection, setCollection] = useState<TodoCollection | null>(null);
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [text, setText] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    const [c, ts] = await Promise.all([getCollection(collectionId), todosInCollection(collectionId)]);
    setCollection(c);
    setTodos(ts);
  }, [collectionId]);

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
    await createTodo({ collection_id: collectionId, title });
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

  async function confirmDeleteList() {
    if (!collection) return;
    Alert.alert('Delete list?', `“${collection.name}” and all its tasks will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          for (const todo of (todos ?? []).filter((t) => !t.done)) {
            await cancelScheduledNotification(todo.notification_id);
          }
          await deleteCollection(collection.id);
          navigation.goBack();
        },
      },
    ]);
  }

  if (todos === null || !collection) {
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
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <Icon name="chevron-left" size={26} color={theme.text} />
        </Pressable>
        <View style={styles.headerMiddle}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {collection.emoji} {collection.name}
          </Text>
          <Text style={[styles.counter, { color: theme.sub }]}>
            {open.length > 0 ? `${open.length} open` : 'All done 🎉'}
          </Text>
        </View>
        <Pressable onPress={() => setFormOpen(true)} hitSlop={8} style={styles.iconBtn}>
          <Icon name="edit" size={20} color={theme.sub} />
        </Pressable>
        <Pressable onPress={confirmDeleteList} hitSlop={8} style={styles.iconBtn}>
          <Icon name="delete-outline" size={20} color={theme.danger} />
        </Pressable>
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
          <Text style={[styles.doneTitle, { color: theme.sub }]}>COMPLETED</Text>
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
            <Text style={styles.emptyEmoji}>{collection.emoji}</Text>
            <Text style={[styles.emptyText, { color: theme.sub }]}>
              Nothing in this list yet — add a task above.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <CollectionForm
        visible={formOpen}
        collection={collection}
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
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  iconBtn: {
    padding: 8,
  },
  headerMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  counter: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
    paddingBottom: 110,
  },
  doneTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 6,
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
