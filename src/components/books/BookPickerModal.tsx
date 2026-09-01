import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import type { Book } from '../../types';
import { listBooks } from '../../db';
import { useTheme } from '../../theme';
import { BookCover } from './BookCover';

/** Full-screen list of the central book database, used to attach a note to a book. */
export function BookPickerModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (book: Book) => void;
}) {
  const theme = useTheme();
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    if (!visible) return;
    setBooks(null);
    void listBooks().then(setBooks);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Choose a book</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Icon name="close" size={24} color={theme.sub} />
          </Pressable>
        </View>

        <FlatList
          data={books ?? []}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            books === null ? null : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>📚</Text>
                <Text style={[styles.emptyText, { color: theme.sub }]}>
                  No books yet — add a book first from one of the book tabs.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.card, borderColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}>
              <BookCover uri={item.cover_uri} title={item.title} width={40} />
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.author ? (
                  <Text style={[styles.rowAuthor, { color: theme.sub }]} numberOfLines={1}>
                    {item.author}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
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
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 40,
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
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowAuthor: {
    fontSize: 13,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 70,
    gap: 8,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});