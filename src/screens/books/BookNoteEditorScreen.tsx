import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Book, BookNote } from '../../types';
import { createBookNote, deleteBookNote, getBook, getBookNote, updateBookNote } from '../../db';
import { formatNoteDate } from '../../date-utils';
import { useTheme } from '../../theme';
import { BookCover } from '../../components/books/BookCover';
import { BookPickerModal } from '../../components/books/BookPickerModal';

const AUTOSAVE_MS = 600;

export function BookNoteEditorScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const noteId: number | null = route.params?.noteId ?? null;
  const presetBookId: number | null = route.params?.bookId ?? null;

  const [book, setBook] = useState<Book | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [noteExists, setNoteExists] = useState(noteId !== null);
  const [editedAt, setEditedAt] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const idRef = useRef<number | null>(noteId);
  const skipSave = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (noteId !== null) {
        const note: BookNote | null = await getBookNote(noteId);
        if (!alive || !note) return;
        setTitle(note.title);
        setBody(note.body);
        setEditedAt(note.updated_at);
        setBook(await getBook(note.book_id));
      } else if (presetBookId !== null) {
        const preset = await getBook(presetBookId);
        if (!alive || !preset) return;
        setBook(preset);
      }
      skipSave.current = false;
    })();
    return () => {
      alive = false;
    };
  }, [noteId, presetBookId]);

  async function persist() {
    if (skipSave.current) return;
    const t = title.trim();
    const b = body;
    if (idRef.current === null) {
      if (!book) return;
      const created = await createBookNote({ book_id: book.id, title: t, body: b });
      idRef.current = created.id;
      setNoteExists(true);
      setEditedAt(created.updated_at);
    } else {
      await updateBookNote({
        id: idRef.current,
        book_id: book?.id ?? idRef.current,
        title: t,
        body: b,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      setEditedAt(Date.now());
    }
  }

  function onChangeText(next: string, kind: 'title' | 'body') {
    if (kind === 'title') setTitle(next);
    else setBody(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(persist, AUTOSAVE_MS);
  }

  function flush() {
    if (timer.current) clearTimeout(timer.current);
    void persist();
  }

  useEffect(() => {
    const unsub = navigation.addListener('blur', flush);
    return () => {
      unsub();
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, title, body, book]);

  function confirmDelete() {
    Alert.alert('Delete this note?', 'It will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          flush();
          if (idRef.current !== null) await deleteBookNote(idRef.current);
          navigation.goBack();
        },
      },
    ]);
  }

  const needsBook = !noteExists && !book;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => { flush(); navigation.goBack(); }} hitSlop={8} style={styles.iconBtn}>
          <Icon name="chevron-left" size={26} color={theme.text} />
        </Pressable>
        <View style={styles.headerMiddle}>
          <Text style={[styles.headerTitle, { color: theme.sub }]} numberOfLines={1}>
            {editedAt != null ? `Edited ${formatNoteDate(editedAt).toLowerCase()}` : 'New note'}
          </Text>
        </View>
        {noteExists ? (
          <Pressable onPress={confirmDelete} hitSlop={8} style={styles.iconBtn}>
            <Icon name="delete-outline" size={22} color={theme.danger} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <Text style={[styles.sectionLabel, { color: theme.sub }]}>BOOK</Text>
      <Pressable
        onPress={() => setPickerOpen(true)}
        style={[
          styles.bookRow,
          { backgroundColor: theme.card, borderColor: theme.border },
          needsBook && { borderColor: theme.accent },
        ]}>
        {book ? (
          <>
            <BookCover uri={book.cover_uri} title={book.title} width={40} />
            <View style={styles.bookInfo}>
              <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={1}>
                {book.title}
              </Text>
              {book.author ? (
                <Text style={[styles.bookAuthor, { color: theme.sub }]} numberOfLines={1}>
                  {book.author}
                </Text>
              ) : null}
            </View>
            <Icon name="chevron-right" size={22} color={theme.sub} />
          </>
        ) : (
          <View style={styles.bookEmpty}>
            <Icon name="menu-book" size={18} color={theme.accent} />
            <Text style={[styles.bookEmptyText, { color: theme.accent }]}>
              {needsBook ? 'Choose a book to write about' : 'Choose a book'}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.editor}>
        <TextInput
          value={title}
          onChangeText={(t) => onChangeText(t, 'title')}
          placeholder={needsBook ? 'First choose a book' : 'Note title'}
          placeholderTextColor={theme.sub}
          editable={!needsBook}
          style={[styles.titleInput, { color: theme.text }]}
          maxLength={120}
        />
        <TextInput
          value={body}
          onChangeText={(t) => onChangeText(t, 'body')}
          placeholder={needsBook ? 'Then write your note…' : 'Write your note…'}
          placeholderTextColor={theme.sub}
          editable={!needsBook}
          style={[styles.bodyInput, { color: theme.text }]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <BookPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(picked) => {
          setBook(picked);
          setPickerOpen(false);
          if (idRef.current !== null) void persist();
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
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  headerMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 8,
    minWidth: 38,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginHorizontal: 20,
    marginTop: 4,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 20,
  },
  bookInfo: {
    flex: 1,
    gap: 1,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bookAuthor: {
    fontSize: 13,
  },
  bookEmpty: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  bookEmptyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  editor: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '800',
    paddingVertical: 10,
  },
  bodyInput: {
    flex: 1,
    fontSize: 16.5,
    lineHeight: 24,
    paddingTop: 6,
  },
});