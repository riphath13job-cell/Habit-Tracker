import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Book, BookNote, BookStatus } from '../../types';
import { adjustBookPagesRead, deleteBook, getBook, listBookNotes, setBookStatus } from '../../db';
import { useTheme } from '../../theme';
import { formatNoteDate } from '../../date-utils';
import { BookCover } from '../../components/books/BookCover';
import { RatingStars } from '../../components/books/RatingStars';
import { BookForm } from '../../components/books/BookForm';

const STATUS_LABEL: Record<BookStatus, string> = {
  reading: 'Now reading',
  finished: 'Finished',
  wishlist: 'Want to read',
};

export function BookDetailScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const bookId: number = route.params?.bookId;

  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<BookNote[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setBook(await getBook(bookId));
    setNotes(await listBookNotes(bookId));
  }, [bookId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function confirmDelete() {
    Alert.alert('Delete book?', '“' + (book?.title ?? '') + '” and all its notes will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBook(bookId);
          navigation.goBack();
        },
      },
    ]);
  }

  async function changeStatus(status: BookStatus) {
    await setBookStatus(bookId, status);
    load();
  }

  async function bump(delta: number) {
    await adjustBookPagesRead(bookId, delta);
    load();
  }

  if (!book) {
    return <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']} />;
  }

  const canTrack = book.total_pages != null && book.total_pages > 0;
  const progress = canTrack ? Math.min(1, book.pages_read / (book.total_pages as number)) : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <Icon name="chevron-left" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {book.title}
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setFormOpen(true)}
            hitSlop={8}
            style={styles.iconBtn}>
            <Icon name="edit" size={22} color={theme.sub} />
          </Pressable>
          <Pressable onPress={confirmDelete} hitSlop={8} style={styles.iconBtn}>
            <Icon name="delete-outline" size={22} color={theme.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <BookCover uri={book.cover_uri} title={book.title} width={118} radius={12} />
          <View style={styles.heroInfo}>
            <Text style={[styles.title, { color: theme.text }]}>{book.title}</Text>
            {book.author ? (
              <Text style={[styles.author, { color: theme.sub }]}>{book.author}</Text>
            ) : null}
            <View style={[styles.statusChip, { backgroundColor: theme.chipBg, borderColor: theme.border }]}>
              <Text style={[styles.statusText, { color: theme.accent }]}>
                {STATUS_LABEL[book.status]}
              </Text>
            </View>
            {book.status === 'finished' && book.rating ? (
              <RatingStars value={book.rating} size={18} />
            ) : null}
          </View>
        </View>

        {book.status === 'reading' ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.sub }]}>READING PROGRESS</Text>
            <View style={styles.readCountRow}>
              <Text style={[styles.readCount, { color: theme.text }]}>{book.pages_read}</Text>
              <Text style={[styles.readTotal, { color: theme.sub }]}>
                {canTrack ? ` of ${book.total_pages} pages` : ' pages read'}
              </Text>
            </View>
            {progress != null ? (
              <>
                <View style={[styles.progressTrack, { backgroundColor: theme.chipBg }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: theme.accent, width: `${Math.round(progress * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.percent, { color: theme.sub }]}>
                  {Math.round(progress * 100)}% · {book.total_pages! - book.pages_read} pages left
                </Text>
              </>
            ) : (
              <Text style={[styles.percent, { color: theme.sub }]}>
                No total page count yet — edit the book to add one.
              </Text>
            )}
            <View style={styles.stepperRow}>
              {[-10, -1, 1, 10].map((delta) => (
                <Pressable
                  key={delta}
                  onPress={() => bump(delta)}
                  style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
                  <Text style={[styles.stepText, { color: theme.text }]}>
                    {delta > 0 ? `+${delta}` : delta}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => changeStatus('finished')} style={[styles.action, { backgroundColor: theme.good }]}>
              <Icon name="check-circle" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Mark as finished</Text>
            </Pressable>
          </View>
        ) : book.status === 'wishlist' ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.sub }]}>ON YOUR WANT-TO-READ LIST</Text>
            {book.buy_url ? (
              <>
                <Text style={[styles.percent, { color: theme.sub }]} numberOfLines={2}>
                  {book.buy_url}
                </Text>
                <Pressable
                  onPress={() => void Linking.openURL(book.buy_url!)}
                  style={[styles.action, { backgroundColor: theme.accent }]}>
                  <Icon name="shopping-cart" size={18} color="#FFFFFF" />
                  <Text style={styles.actionText}>Buy this book</Text>
                </Pressable>
              </>
            ) : (
              <Text style={[styles.percent, { color: theme.sub }]}>
                No buy link yet — tap ✏️ to paste one, then come back here to buy it.
              </Text>
            )}
            <Pressable
              onPress={() => changeStatus('reading')}
              style={[styles.action, { backgroundColor: theme.accent }]}>
              <Icon name="auto-stories" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Start reading</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.sub }]}>READ ✓</Text>
            {book.rating ? (
              <View style={styles.finishedRow}>
                <RatingStars value={book.rating} size={22} />
                <Text style={[styles.percent, { color: theme.sub }]}>
                  {book.finished_at ? `Finished ${formatNoteDate(book.finished_at).toLowerCase()}` : 'Finished'}
                </Text>
              </View>
            ) : (
              <Text style={[styles.percent, { color: theme.sub }]}>
                Finished — tap ✏️ to add a rating.
              </Text>
            )}
            <Pressable
              onPress={() => changeStatus('reading')}
              style={[styles.action, { backgroundColor: theme.accent }]}>
              <Icon name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Read again</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.notesHeader}>
          <Text style={[styles.notesTitle, { color: theme.text }]}>Notes</Text>
          <Text style={[styles.notesCount, { color: theme.sub }]}>
            {notes === null ? '' : `${notes.length}`}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('BookNoteEditor', { bookId })}
            style={[styles.notesNew, { backgroundColor: theme.accent }]}>
            <Icon name="add" size={16} color="#FFFFFF" />
            <Text style={styles.notesNewText}>New note</Text>
          </Pressable>
        </View>

        {notes !== null && notes.length > 0 ? (
          notes.map((note) => (
            <Pressable
              key={note.id}
              onPress={() => navigation.navigate('BookNoteEditor', { noteId: note.id })}
              style={({ pressed }) => [
                styles.noteRow,
                { backgroundColor: theme.card, borderColor: theme.border },
                pressed && { opacity: 0.8 },
              ]}>
              <View style={styles.noteInfo}>
                <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>
                  {note.title.trim() || 'Untitled note'}
                </Text>
                <Text style={[styles.notePreview, { color: theme.sub }]} numberOfLines={2}>
                  {note.body.trim().split('\n')[0] || '…'}
                </Text>
              </View>
              <Text style={[styles.noteDate, { color: theme.sub }]}>{formatNoteDate(note.updated_at)}</Text>
            </Pressable>
          ))
        ) : (
          notes !== null && (
            <Text style={[styles.noNotes, { color: theme.sub }]}>
              {book.status === 'wishlist'
                ? 'Add a note once you start reading this book.'
                : 'No notes yet — tap "New note" to capture an idea, quote or thought.'}
            </Text>
          )
        )}
      </ScrollView>

      <BookForm
        visible={formOpen}
        book={book}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconBtn: {
    padding: 8,
    minWidth: 38,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  hero: {
    flexDirection: 'row',
    gap: 18,
  },
  heroInfo: {
    flex: 1,
    gap: 8,
    paddingTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  author: {
    fontSize: 15,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 18,
    gap: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  readCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  readCount: {
    fontSize: 30,
    fontWeight: '800',
  },
  readTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percent: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  stepBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '700',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 2,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  finishedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  notesCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesNew: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  notesNewText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  noteInfo: {
    flex: 1,
    gap: 2,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  notePreview: {
    fontSize: 12.5,
  },
  noteDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  noNotes: {
    fontSize: 13.5,
    lineHeight: 20,
  },
});