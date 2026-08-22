import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Note } from '../../types';
import { deleteNote, listNotes } from '../../db';
import { formatNoteDate } from '../../date-utils';
import { useTheme } from '../../theme';

export function NotesListScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [notes, setNotes] = useState<Note[] | null>(null);

  const load = useCallback(async () => {
    setNotes(await listNotes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function confirmDelete(note: Note) {
    Alert.alert('Delete note?', 'This note will be removed permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(note.id);
          load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.navigate('Launcher')} hitSlop={8} style={styles.iconBtn}>
          <MaterialIcons name="apps" size={24} color={theme.sub} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Notes</Text>
        <Pressable
          onPress={() => navigation.navigate('NoteEditor', {})}
          style={[styles.newButton, { backgroundColor: theme.accent }]}>
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.newButtonText}>New</Text>
        </Pressable>
      </View>

      <FlatList
        data={notes ?? []}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          notes === null ? null : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyText, { color: theme.sub }]}>
                No notes yet — tap "New" to write your first one.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('NoteEditor', { id: item.id })}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && { opacity: 0.7 },
            ]}>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                {item.title.trim() || 'Untitled'}
              </Text>
              <Text style={[styles.cardPreview, { color: theme.sub }]} numberOfLines={2}>
                {item.body.trim() || 'No additional text'}
              </Text>
              <Text style={[styles.cardDate, { color: theme.sub }]}>{formatNoteDate(item.updated_at)}</Text>
            </View>
            <Pressable onPress={() => confirmDelete(item)} hitSlop={10} style={styles.iconBtn}>
              <MaterialIcons name="delete-outline" size={20} color={theme.sub} />
            </Pressable>
          </Pressable>
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
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  iconBtn: {
    padding: 6,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardPreview: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  cardDate: {
    fontSize: 11.5,
    marginTop: 3,
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
