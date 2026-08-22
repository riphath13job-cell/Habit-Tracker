import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Note } from '../../types';
import { deleteNote, emptyTrash, listTrashedNotes, restoreNote } from '../../db';
import { useTheme } from '../../theme';
import { NoteCard } from '../../components/NoteCard';

export function TrashScreen() {
  const theme = useTheme();
  const [notes, setNotes] = useState<Note[] | null>(null);

  const load = useCallback(async () => {
    setNotes(await listTrashedNotes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function confirmDeleteForever(note: Note) {
    Alert.alert('Delete forever?', 'This note cannot be restored afterwards.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete forever',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(note.id);
          load();
        },
      },
    ]);
  }

  function confirmEmpty() {
    Alert.alert('Empty Trash?', 'All notes in Trash will be deleted permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Empty Trash',
        style: 'destructive',
        onPress: async () => {
          await emptyTrash();
          load();
        },
      },
    ]);
  }

  const count = notes?.length ?? 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Trash 🗑️</Text>
        {count > 0 ? (
          <Pressable
            onPress={confirmEmpty}
            style={({ pressed }) => [
              styles.emptyButton,
              { borderColor: theme.danger },
              pressed && { opacity: 0.6 },
            ]}>
            <Text style={[styles.emptyButtonText, { color: theme.danger }]}>Empty Trash</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={notes ?? []}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          notes === null ? null : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🗑️</Text>
              <Text style={[styles.emptyText, { color: theme.sub }]}>Trash is empty.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            actions={
              <>
                <Pressable
                  onPress={async () => {
                    await restoreNote(item.id);
                    load();
                  }}
                  hitSlop={8}
                  style={styles.iconBtn}>
                  <MaterialIcons name="restore" size={20} color={theme.accent} />
                </Pressable>
                <Pressable onPress={() => confirmDeleteForever(item)} hitSlop={8} style={styles.iconBtn}>
                  <MaterialIcons name="delete-forever" size={20} color={theme.danger} />
                </Pressable>
              </>
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  emptyButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 110,
  },
  iconBtn: {
    padding: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 70,
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
