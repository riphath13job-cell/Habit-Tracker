import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Note } from '../../types';
import { listFavoriteNotes, setNoteFavorite, trashNote } from '../../db';
import { useTheme } from '../../theme';
import { NoteCard } from '../../components/NoteCard';

export function FavoritesScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [notes, setNotes] = useState<Note[] | null>(null);

  const load = useCallback(async () => {
    setNotes(await listFavoriteNotes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function confirmTrash(note: Note) {
    Alert.alert('Move to Trash?', `“${note.title.trim() || 'Untitled'}” will be moved to Trash.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Move to Trash', style: 'destructive', onPress: async () => { await trashNote(note.id); load(); } },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Favorites ⭐</Text>
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
              <Text style={styles.emptyEmoji}>⭐</Text>
              <Text style={[styles.emptyText, { color: theme.sub }]}>
                No favorites yet — tap the star on a note to pin it here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => navigation.navigate('NoteEditor', { id: item.id })}
            actions={
              <>
                <Pressable onPress={async () => { await setNoteFavorite(item.id, false); load(); }} hitSlop={8} style={styles.iconBtn}>
                  <MaterialIcons name="star" size={20} color="#F59E0B" />
                </Pressable>
                <Pressable onPress={() => confirmTrash(item)} hitSlop={8} style={styles.iconBtn}>
                  <MaterialIcons name="delete-outline" size={20} color={theme.sub} />
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
