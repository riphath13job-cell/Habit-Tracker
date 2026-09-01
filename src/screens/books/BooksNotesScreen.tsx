import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Book, BookNote } from '../../types';
import { deleteBookNote, listBookNotes, listBooks } from '../../db';
import { useTheme } from '../../theme';
import { formatNoteDate } from '../../date-utils';
import { BookCover } from '../../components/books/BookCover';

export function BooksNotesScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [notes, setNotes] = useState<BookNote[] | null>(null);
  const [booksById, setBooksById] = useState<Record<number, Book>>({});

  const load = useCallback(async () => {
    const all = await listBookNotes();
    setNotes(all);
    const books = await listBooks();
    setBooksById(Object.fromEntries(books.map((b) => [b.id, b])));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function confirmDelete(note: BookNote) {
    Alert.alert('Delete note?', 'This note will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBookNote(note.id);
          load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.text }]}>Notes</Text>
          <Text style={[styles.count, { color: theme.sub }]}>
            {notes === null ? '' : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('BookNoteEditor', {})}
          style={[styles.newButton, { backgroundColor: theme.accent }]}>
          <Icon name="add" size={22} color="#FFFFFF" />
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
                No notes yet — tap + and pick a book from your library to write about.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const book = booksById[item.book_id];
          return (
            <Pressable
              onPress={() => navigation.navigate('BookNoteEditor', { noteId: item.id })}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.card, borderColor: theme.border },
                pressed && { opacity: 0.8 },
              ]}>
              <BookCover uri={book?.cover_uri ?? null} title={book?.title ?? '?'} width={38} />
              <View style={styles.rowInfo}>
                <Text style={[styles.bookTitle, { color: theme.sub }]} numberOfLines={1}>
                  {book?.title ?? 'Deleted book'}
                </Text>
                <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>
                  {item.title.trim() || 'Untitled note'}
                </Text>
                <Text style={[styles.preview, { color: theme.sub }]} numberOfLines={1}>
                  {item.body.trim().split('\n')[0] || formatNoteDate(item.updated_at)}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.date, { color: theme.sub }]}>{formatNoteDate(item.updated_at)}</Text>
                <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={styles.iconBtn}>
                  <Icon name="delete-outline" size={20} color={theme.sub} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
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
  headerLeft: {
    gap: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  count: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  newButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 110,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  rowInfo: {
    flex: 1,
    gap: 1,
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  preview: {
    fontSize: 12.5,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 4,
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