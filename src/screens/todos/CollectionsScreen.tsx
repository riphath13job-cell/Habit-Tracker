import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Todo, TodoCollection } from '../../types';
import { listAllTodos, listCollections } from '../../db';
import { useTheme } from '../../theme';
import { CollectionForm } from '../../components/CollectionForm';

export function CollectionsScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [collections, setCollections] = useState<TodoCollection[] | null>(null);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TodoCollection | null>(null);

  const load = useCallback(async () => {
    const [cs, ts] = await Promise.all([listCollections(), listAllTodos()]);
    setCollections(cs);
    setAllTodos(ts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function stats(collection: TodoCollection) {
    const items = allTodos.filter((t) => t.collection_id === collection.id);
    return { open: items.filter((t) => !t.done).length, total: items.length };
  }

  if (collections === null) {
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
        <Text style={[styles.title, { color: theme.text }]}>Lists</Text>
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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {collections.map((collection) => {
            const s = stats(collection);
            return (
              <Pressable
                key={collection.id}
                onPress={() => navigation.navigate('CollectionDetail', { id: collection.id })}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  pressed && { opacity: 0.7 },
                ]}>
                <View style={[styles.tileBadge, { backgroundColor: theme.chipBg }]}>
                  <Text style={styles.tileEmoji}>{collection.emoji}</Text>
                </View>
                <Text style={[styles.tileName, { color: theme.text }]} numberOfLines={1}>
                  {collection.name}
                </Text>
                <Text style={[styles.tileMeta, { color: theme.sub }]}>
                  {s.total === 0 ? 'Empty' : `${s.open} open · ${s.total}`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {collections.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🗂️</Text>
            <Text style={[styles.emptyText, { color: theme.sub }]}>
              No lists yet — tap “New” to group tasks like Grocery or Morning routine.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <CollectionForm
        visible={formOpen}
        collection={editing}
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
  content: {
    paddingBottom: 110,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  tile: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  tileBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: {
    fontSize: 22,
  },
  tileName: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  tileMeta: {
    fontSize: 12,
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
