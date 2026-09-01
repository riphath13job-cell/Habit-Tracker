import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../icons';
import type { Book } from '../../types';
import { useTheme } from '../../theme';
import { BookCover } from './BookCover';
import { RatingStars } from './RatingStars';

/** Row for any book list; shows status-specific meta and quick actions. */
export function BookListItem({
  book,
  onPress,
  onReadChange,
}: {
  book: Book;
  onPress: () => void;
  /** Renders +1/+10 steppers for the reading tab. */
  onReadChange?: (delta: number) => void;
}) {
  const theme = useTheme();
  const canTrack = book.total_pages != null && book.total_pages > 0;
  const progress = canTrack ? Math.min(1, book.pages_read / (book.total_pages as number)) : null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable onPress={onPress} style={styles.main}>
        <BookCover uri={book.cover_uri} title={book.title} width={48} />
        <View style={styles.info}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {book.title}
          </Text>
          {book.author ? (
            <Text style={[styles.author, { color: theme.sub }]} numberOfLines={1}>
              {book.author}
            </Text>
          ) : null}
          {book.status === 'reading' ? (
            <View style={styles.progressRow}>
              {progress != null ? (
                <>
                  <View style={[styles.progressTrack, { backgroundColor: theme.chipBg }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: theme.accent,
                          width: `${Math.round(progress * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: theme.sub }]} numberOfLines={1}>
                    {book.pages_read} / {book.total_pages}
                  </Text>
                </>
              ) : (
                <Text style={[styles.progressText, { color: theme.sub }]} numberOfLines={1}>
                  {book.pages_read > 0 ? `${book.pages_read} pages read` : 'Set total pages to track progress'}
                </Text>
              )}
            </View>
          ) : book.status === 'finished' ? (
            book.rating ? (
              <RatingStars value={book.rating} size={14} />
            ) : (
              <Text style={[styles.meta, { color: theme.sub }]}>Finished</Text>
            )
          ) : (
            <Text style={[styles.meta, { color: theme.sub }]}>Want to read</Text>
          )}
        </View>
      </Pressable>

      {book.status === 'reading' && onReadChange ? (
        <View style={styles.steppers}>
          <Pressable
            onPress={() => onReadChange(1)}
            style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}
            hitSlop={4}>
            <Text style={[styles.stepText, { color: theme.accent }]}>+1</Text>
          </Pressable>
          <Pressable
            onPress={() => onReadChange(10)}
            style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}
            hitSlop={4}>
            <Text style={[styles.stepText, { color: theme.accent }]}>+10</Text>
          </Pressable>
        </View>
      ) : book.status === 'wishlist' && book.buy_url ? (
        <Pressable
          onPress={() => {
            if (book.buy_url) void Linking.openURL(book.buy_url);
          }}
          style={[styles.buyBtn, { backgroundColor: theme.chipBg }]}
          hitSlop={6}>
          <Icon name="shopping-cart" size={15} color={theme.accent} />
          <Text style={[styles.buyText, { color: theme.accent }]}>Buy</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onPress} hitSlop={8} style={styles.chevron}>
          <Icon name="chevron-right" size={22} color={theme.sub} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  author: {
    fontSize: 13,
  },
  meta: {
    fontSize: 12.5,
    marginTop: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 64,
    textAlign: 'right',
  },
  steppers: {
    gap: 6,
  },
  stepBtn: {
    width: 42,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  buyText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  chevron: {
    paddingHorizontal: 4,
  },
});