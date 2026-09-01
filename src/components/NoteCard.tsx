import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import type { Note } from '../types';
import { formatNoteDate } from '../date-utils';
import { useTheme } from '../theme';

/** Note card used by the Notes, Favorites and Trash lists. */
export function NoteCard({
  note,
  onPress,
  actions,
}: {
  note: Note;
  onPress?: () => void;
  actions?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.7 }]}>
        <View style={styles.titleRow}>
          {note.favorite === 1 ? (
            <Icon name="star" size={14} color="#F59E0B" style={styles.star} />
          ) : null}
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {note.title.trim() || 'Untitled'}
          </Text>
        </View>
        <Text style={[styles.preview, { color: theme.sub }]} numberOfLines={2}>
          {note.body.trim() || 'No additional text'}
        </Text>
        <Text style={[styles.date, { color: theme.sub }]}>
          {note.deleted_at != null
            ? `Deleted ${formatNoteDate(note.deleted_at).toLowerCase()}`
            : formatNoteDate(note.updated_at)}
        </Text>
      </Pressable>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    marginTop: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  preview: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  date: {
    fontSize: 11.5,
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
