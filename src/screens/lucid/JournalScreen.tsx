import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { DreamEntry } from '../../types';
import { deleteDreamEntry, listDreamEntries, saveDreamEntry } from '../../db';
import { addDays, dayKey } from '../../date-utils';
import { useTheme } from '../../theme';

function labelForDay(day: string): string {
  const today = dayKey(new Date());
  const yesterday = dayKey(addDays(new Date(), -1));
  if (day === today) return 'This morning';
  if (day === yesterday) return 'Yesterday morning';
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function JournalScreen() {
  const theme = useTheme();
  const [entries, setEntries] = useState<DreamEntry[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [lucid, setLucid] = useState(false);

  const load = useCallback(async () => {
    setEntries(await listDreamEntries());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = entries.length;
  const lucidCount = entries.filter((e) => e.lucid).length;
  const lucidPct = total === 0 ? 0 : Math.round((lucidCount / total) * 100);

  let streak = 0;
  {
    const days = new Set(entries.map((e) => e.day));
    let cursor = new Date();
    if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
    for (let guard = 0; guard < 400; guard++) {
      if (!days.has(dayKey(cursor))) break;
      streak += 1;
      cursor = addDays(cursor, -1);
    }
  }

  function openNew() {
    setEditingId(null);
    setTitle('');
    setBody('');
    setLucid(false);
    setEditorOpen(true);
  }

  function openEdit(entry: DreamEntry) {
    setEditingId(entry.id);
    setTitle(entry.title);
    setBody(entry.body);
    setLucid(!!entry.lucid);
    setEditorOpen(true);
  }

  async function save() {
    if (!title.trim() && !body.trim()) return;
    await saveDreamEntry(
      { day: dayKey(new Date()), title: title.trim(), body: body.trim(), lucid },
      editingId,
    );
    setEditorOpen(false);
    load();
  }

  function confirmDelete(entry: DreamEntry) {
    Alert.alert('Delete dream?', `“${entry.title || 'Untitled'}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteDreamEntry(entry.id);
            load();
          })(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Dream Journal</Text>
        <Text style={[styles.subtitle, { color: theme.sub }]}>
          Write every morning — recall is the #1 predictor of lucidity.
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{total}</Text>
            <Text style={[styles.statLabel, { color: theme.sub }]}>dreams</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statValue, { color: theme.accent }]}>{lucidPct}%</Text>
            <Text style={[styles.statLabel, { color: theme.sub }]}>lucid ({lucidCount})</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statValue, { color: theme.good }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: theme.sub }]}>day streak</Text>
          </View>
        </View>

        <Pressable
          onPress={openNew}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, styles.logButton]}>
          <LinearGradient colors={['#A78BFA', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logGrad}>
            <Icon name="add" size={22} color="#FFFFFF" />
            <Text style={styles.logButtonText}>Log a dream</Text>
          </LinearGradient>
        </Pressable>

        {entries.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => openEdit(entry)}
            onLongPress={() => confirmDelete(entry)}
            style={({ pressed }) => [
              styles.entryCard,
              { backgroundColor: theme.card },
              pressed && { opacity: 0.7 },
            ]}
            android_ripple={{ color: theme.border }}>
            <View style={styles.entryTopRow}>
              <Text style={[styles.entryDay, { color: theme.sub }]}>{labelForDay(entry.day)}</Text>
              {entry.lucid ? (
                <View style={styles.lucidBadge}>
                  <Text style={styles.lucidBadgeText}>🌀 Lucid</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.entryTitle, { color: theme.text }]} numberOfLines={1}>
              {entry.title || 'Untitled dream'}
            </Text>
            {entry.body ? (
              <Text style={[styles.entryPreview, { color: theme.sub }]} numberOfLines={2}>
                {entry.body}
              </Text>
            ) : null}
          </Pressable>
        ))}

        {total === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="auto-stories" size={40} color={theme.sub} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No dreams yet</Text>
            <Text style={[styles.emptyText, { color: theme.sub }]}>
              Tomorrow morning, capture whatever you remember — even “no recall” counts as practice.
            </Text>
          </View>
        ) : null}
        <Text style={[styles.hint, { color: theme.sub }]}>Long-press an entry to delete it.</Text>
      </ScrollView>

      <RNModal visible={editorOpen} transparent animationType="fade" onRequestClose={() => setEditorOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setEditorOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {editingId === null ? 'Log a dream' : 'Edit dream'}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title (e.g. Flying over the old school)"
              placeholderTextColor={theme.sub}
              style={[styles.input, { backgroundColor: theme.chipBg, borderColor: theme.border, color: theme.text }]}
            />
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="What happened? Who was there? How did it feel?"
              placeholderTextColor={theme.sub}
              multiline
              style={[
                styles.input,
                styles.bodyInput,
                { backgroundColor: theme.chipBg, borderColor: theme.border, color: theme.text },
              ]}
            />
            <View style={[styles.lucidRow, { backgroundColor: theme.chipBg }]}>
              <Text style={{ fontSize: 30 }}>🌀</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lucidRowTitle, { color: theme.text }]}>I became lucid</Text>
                <Text style={[styles.lucidRowSub, { color: theme.sub }]}>You knew you were dreaming</Text>
              </View>
              <Switch
                value={lucid}
                onValueChange={setLucid}
                trackColor={{ false: theme.border, true: '#7C3AED' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => setEditorOpen(false)}
                style={[styles.button, { backgroundColor: theme.chipBg }]}>
                <Text style={[styles.buttonText, { color: theme.sub }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void save()} style={[styles.button, { backgroundColor: '#7C3AED' }]}>
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </RNModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 110, gap: 10 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11.5 },
  logButton: { borderRadius: 18, overflow: 'hidden', marginTop: 2 },
  logGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 15 },
  logButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15.5 },
  entryCard: { borderRadius: 18, padding: 16, gap: 4 },
  entryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryDay: { fontSize: 12, fontWeight: '600' },
  lucidBadge: { backgroundColor: '#7C3AED33', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  lucidBadgeText: { color: '#C4B5FD', fontSize: 11.5, fontWeight: '700' },
  entryTitle: { fontSize: 16, fontWeight: '700' },
  entryPreview: { fontSize: 13, lineHeight: 18 },
  emptyState: { alignItems: 'center', gap: 6, paddingVertical: 26, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyText: { fontSize: 13.5, textAlign: 'center', lineHeight: 19 },
  hint: { fontSize: 11.5, textAlign: 'center', marginTop: 6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    paddingTop: 14,
    gap: 12,
  },
  sheetTitle: { fontSize: 19, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  bodyInput: { minHeight: 130, textAlignVertical: 'top', lineHeight: 21 },
  lucidRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16 },
  lucidRowTitle: { fontSize: 15, fontWeight: '700' },
  lucidRowSub: { fontSize: 12.5 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  button: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
  buttonText: { fontWeight: '700', fontSize: 15 },
});
