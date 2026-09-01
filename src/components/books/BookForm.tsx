import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '../../icons';
import * as ImagePicker from 'expo-image-picker';
import type { Book, BookStatus } from '../../types';
import { createBook, updateBook } from '../../db';
import { useTheme } from '../../theme';
import { persistCoverImage, pickAndCropCover } from '../../books/cover';
import { BookCover } from './BookCover';
import { RatingStars } from './RatingStars';

const STATUSES: Array<{ value: BookStatus; label: string }> = [
  { value: 'reading', label: 'Reading' },
  { value: 'finished', label: 'Read' },
  { value: 'wishlist', label: 'Want to read' },
];

export function BookForm({
  visible,
  book,
  presetStatus,
  onClose,
  onSaved,
}: {
  visible: boolean;
  /** Book being edited, or null to create a new one. */
  book: Book | null;
  /** Default status for a new book. */
  presetStatus?: BookStatus;
  onClose: () => void;
  onSaved: (book: Book) => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>(presetStatus ?? 'wishlist');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState('');
  const [pagesRead, setPagesRead] = useState('');
  const [buyUrl, setBuyUrl] = useState('');
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(book?.title ?? '');
    setAuthor(book?.author ?? '');
    setStatus(book?.status ?? presetStatus ?? 'wishlist');
    setCoverUri(book?.cover_uri ?? null);
    setTotalPages(book?.total_pages != null ? String(book.total_pages) : '');
    setPagesRead(book?.pages_read != null && book.pages_read > 0 ? String(book.pages_read) : '');
    setBuyUrl(book?.buy_url ?? '');
    setRating(book?.rating ?? 0);
  }, [visible, book, presetStatus]);

  async function chooseCover() {
    Alert.alert('Add cover', 'Where is the cover image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [2, 3],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) setCoverUri(persistCoverImage(result.assets[0].uri));
        },
      },
      { text: 'Photo library', onPress: async () => setCoverUri(await pickAndCropCover()) },
    ]);
  }

  function parsePage(text: string): number {
    const v = parseInt(text, 10);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Title needed', 'Give the book a title first.');
      return;
    }
    setSaving(true);
    try {
      const now = Date.now();
      const total = totalPages.trim() === '' ? null : parsePage(totalPages);
      const read = total !== null ? Math.min(parsePage(pagesRead), total) : parsePage(pagesRead);
      const url = buyUrl.trim();
      const finishedAt = status === 'finished' ? (book?.finished_at ?? now) : null;
      const payload = {
        title: trimmed,
        author: author.trim(),
        status,
        cover_uri: coverUri,
        total_pages: total,
        pages_read: read,
        buy_url: url ? url : null,
        rating: status === 'finished' ? (rating > 0 ? rating : null) : null,
        finished_at: finishedAt,
      };
      if (book) {
        const updated: Book = { ...book, ...payload, updated_at: now };
        await updateBook(updated);
        onSaved(updated);
      } else {
        const created = await createBook({ ...payload, created_at: now, updated_at: now });
        onSaved(created);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>
            {book ? 'Edit book' : status === 'reading' ? 'Add to Now Reading' : 'Add a book'}
          </Text>

          <View style={styles.coverRow}>
            <BookCover uri={coverUri} title={title || '?'} width={64} />
            <View style={styles.coverCol}>
              <Pressable
                onPress={chooseCover}
                style={[styles.coverButton, { backgroundColor: theme.chipBg }]}>
                <Icon name="photo" size={16} color={theme.accent} />
                <Text style={[styles.coverButtonText, { color: theme.accent }]}>
                  {coverUri ? 'Change cover' : 'Add cover'}
                </Text>
              </Pressable>
              {coverUri ? (
                <Pressable
                  onPress={() => setCoverUri(null)}
                  hitSlop={6}
                  style={styles.removeCover}>
                  <Text style={[styles.removeCoverText, { color: theme.danger }]}>Remove cover</Text>
                </Pressable>
              ) : null}
              <Text style={[styles.coverHint, { color: theme.sub }]}>
                Cropped automatically to a 2:3 book cover
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Book title"
            placeholderTextColor={theme.sub}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            maxLength={100}
          />

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>AUTHOR (OPTIONAL)</Text>
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="e.g. J.K. Rowling"
            placeholderTextColor={theme.sub}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            maxLength={80}
          />

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>STATUS</Text>
          <View style={styles.chipRow}>
            {STATUSES.map((s) => {
              const active = status === s.value;
              return (
                <Pressable
                  key={s.value}
                  onPress={() => setStatus(s.value)}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.chipBg, borderColor: theme.border },
                    active && { backgroundColor: theme.accent, borderColor: theme.accent },
                  ]}>
                  <Text
                    style={[styles.chipText, { color: theme.sub }, active && { color: '#FFFFFF' }]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {status === 'reading' ? (
            <>
              <Text style={[styles.sectionLabel, { color: theme.sub }]}>PAGES</Text>
              <View style={styles.pagesRow}>
                <View style={styles.pageField}>
                  <Text style={[styles.fieldLabel, { color: theme.sub }]}>TOTAL</Text>
                  <TextInput
                    value={totalPages}
                    onChangeText={setTotalPages}
                    placeholder="—"
                    placeholderTextColor={theme.sub}
                    keyboardType="number-pad"
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                  />
                </View>
                <View style={styles.pageField}>
                  <Text style={[styles.fieldLabel, { color: theme.sub }]}>READ</Text>
                  <TextInput
                    value={pagesRead}
                    onChangeText={setPagesRead}
                    placeholder="0"
                    placeholderTextColor={theme.sub}
                    keyboardType="number-pad"
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                  />
                </View>
              </View>
            </>
          ) : null}

          {status === 'finished' ? (
            <>
              <Text style={[styles.sectionLabel, { color: theme.sub }]}>RATING</Text>
              <View style={[styles.ratingBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <RatingStars value={rating} size={26} onChange={setRating} />
                <Text style={[styles.ratingHint, { color: theme.sub }]}>
                  Tap a star to rate — tap again to clear
                </Text>
              </View>
            </>
          ) : null}

          <Text style={[styles.sectionLabel, { color: theme.sub }]}>BUY LINK (OPTIONAL)</Text>
          <TextInput
            value={buyUrl}
            onChangeText={setBuyUrl}
            placeholder={
              status === 'wishlist'
                ? 'https://… where you can buy it'
                : 'Paste a link to buy this book'
            }
            placeholderTextColor={theme.sub}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            maxLength={500}
          />

          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={[styles.button, { backgroundColor: theme.chipBg }]}>
              <Text style={[styles.buttonText, { color: theme.sub }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              style={[styles.button, { backgroundColor: theme.accent }, saving && { opacity: 0.6 }]}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {saving ? 'Saving…' : 'Save book'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

async function pickCoverFromCamera(): Promise<string | null> {
  const { launchCameraAsync } = await import('expo-image-picker');
  const result = await launchCameraAsync({
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  const { persistCoverImage } = await import('../../books/cover');
  return persistCoverImage(result.assets[0].uri);
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 18,
  },
  coverRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
  coverCol: {
    flex: 1,
    gap: 8,
    alignItems: 'flex-start',
  },
  coverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  coverButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  removeCover: {
    paddingVertical: 2,
  },
  removeCoverText: {
    fontSize: 13,
    fontWeight: '600',
  },
  coverHint: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 9,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pageField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  ratingBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  ratingHint: {
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});