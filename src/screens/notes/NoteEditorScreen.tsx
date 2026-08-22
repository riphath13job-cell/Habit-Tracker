import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { createNote, deleteNote, getNote, updateNote } from '../../db';
import { formatNoteDate } from '../../date-utils';
import { useTheme } from '../../theme';

const AUTOSAVE_MS = 600;

export function NoteEditorScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const noteId: number | null = route.params?.id ?? null;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [noteExists, setNoteExists] = useState(noteId !== null);
  const [editedAt, setEditedAt] = useState<number | null>(null);
  const idRef = useRef<number | null>(noteId);
  const skipSave = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing note once.
  useEffect(() => {
    let alive = true;
    if (noteId === null) {
      skipSave.current = false;
      return;
    }
    getNote(noteId).then((note) => {
      if (!alive) return;
      if (note) {
        setTitle(note.title);
        setBody(note.body);
        setEditedAt(note.updated_at);
      }
      skipSave.current = false;
    });
    return () => {
      alive = false;
    };
  }, [noteId]);

  async function persist() {
    if (skipSave.current) return;
    const t = title.trim();
    const b = body;
    if (idRef.current === null) {
      if (!t && !b.trim()) return; // don't create empty ghost notes
      const created = await createNote({ title: t, body: b });
      idRef.current = created.id;
      setNoteExists(true);
      setEditedAt(created.updated_at);
    } else {
      await updateNote(idRef.current, { title: t, body: b });
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
    persist();
  }

  // Save when leaving the screen; re-registered so it always sees fresh state.
  useEffect(() => {
    const unsub = navigation.addListener('blur', flush);
    return () => {
      unsub();
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, title, body]);

  function confirmDelete() {
    Alert.alert('Delete note?', 'This note will be removed permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          flush();
          if (idRef.current !== null) await deleteNote(idRef.current);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => { flush(); navigation.goBack(); }} hitSlop={8} style={styles.iconBtn}>
          <MaterialIcons name="chevron-left" size={26} color={theme.text} />
        </Pressable>
        <View style={styles.headerMiddle}>
          <Text style={[styles.headerTitle, { color: theme.sub }]}>
            {editedAt != null ? `Edited ${formatNoteDate(editedAt).toLowerCase()}` : 'New note'}
          </Text>
        </View>
        {noteExists ? (
          <Pressable onPress={confirmDelete} hitSlop={8} style={styles.iconBtn}>
            <MaterialIcons name="delete-outline" size={22} color={theme.danger} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <View style={styles.editor}>
        <TextInput
          value={title}
          onChangeText={(t) => onChangeText(t, 'title')}
          placeholder="Title"
          placeholderTextColor={theme.sub}
          style={[styles.titleInput, { color: theme.text }]}
          maxLength={120}
        />
        <TextInput
          value={body}
          onChangeText={(t) => onChangeText(t, 'body')}
          placeholder="Start writing…"
          placeholderTextColor={theme.sub}
          style={[styles.bodyInput, { color: theme.text }]}
          multiline
          textAlignVertical="top"
        />
      </View>
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
  editor: {
    flex: 1,
    paddingHorizontal: 20,
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
