import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Book, BookStatus } from '../../types';
import { adjustBookPagesRead, listBooks } from '../../db';
import { useTheme } from '../../theme';
import { BookForm } from '../../components/books/BookForm';
import { BookListItem } from '../../components/books/BookListItem';

const EMPTY_BY_STATUS: Record<BookStatus, { emoji: string; text: string }> = {
  reading: { emoji: '📖', text: 'Nothing being read right now.\nTap + to start tracking a book.' },
  finished: { emoji: '✅', text: 'No finished books yet.\nBooks you complete will live here.' },
  wishlist: { emoji: '🌱', text: 'Your want-to-read list is empty.\nTap + to save a book you want to buy.' },
};

export function BookListScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const status: BookStatus = route.params?.status ?? 'wishlist';
  const screenTitle: string = route.params?.title ?? 'Books';

  const [books, setBooks] = useState<Book[] | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formBook, setFormBook] = useState<Book | null>(null);

  const load = useCallback(async () => {
    setBooks(await listBooks(status));
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const trimmed = query.trim().toLowerCase();
  const visible = (books ?? []).filter(
    (b) => !trimmed || b.title.toLowerCase().includes(trimmed) || b.author.toLowerCase().includes(trimmed),
  );
  const emptyText = EMPTY_BY_STATUS[status];

  async function bumpRead(book: Book, delta: number) {
    await adjustBookPagesRead(book.id, delta);
    load();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.text }]}>{screenTitle}</Text>
          <Text style={[styles.count, { color: theme.sub }]}>
            {books === null ? '' : `${books.length} ${books.length === 1 ? 'book' : 'books'}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setSearchOpen((open) => !open)}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: theme.chipBg }]}>
            <Icon name={searchOpen ? 'close' : 'search'} size={20} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => {
              setFormBook(null);
              setFormOpen(true);
            }}
            style={[styles.newButton, { backgroundColor: theme.accent }]}>
            <Icon name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {searchOpen ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search title or author…"
          placeholderTextColor={theme.sub}
          autoFocus
          style={[
            styles.searchInput,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.card },
          ]}
        />
      ) : null}

      <FlatList
        data={visible}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          books === null ? null : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>{trimmed ? '🔍' : emptyText.emoji}</Text>
              <Text style={[styles.emptyText, { color: theme.sub }]}>
                {trimmed ? `No matches for "${query.trim()}".` : emptyText.text}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <BookListItem
            book={item}
            onReadChange={status === 'reading' ? (d) => bumpRead(item, d) : undefined}
            onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
          />
        )}
      />

      <BookForm
        visible={formOpen}
        book={formBook}
        presetStatus={status}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 110,
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