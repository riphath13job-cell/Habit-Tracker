import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { MoodEntry } from '../../types';
import { deleteMoodEntry, getMoodEntry, listMoodEntries, saveMoodEntry } from '../../db';
import { formatNoteDate, todayKey } from '../../date-utils';
import { useTheme } from '../../theme';

const MOODS = [
  { v: 1, emoji: '😞', label: 'Terrible' },
  { v: 2, emoji: '😕', label: 'Meh' },
  { v: 3, emoji: '😐', label: 'Okay' },
  { v: 4, emoji: '🙂', label: 'Good' },
  { v: 5, emoji: '🤩', label: 'Amazing' },
];

export function MoodScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const today = todayKey();
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [history, setHistory] = useState<MoodEntry[]>([]);

  const load = useCallback(async () => {
    const [submitted, entries] = await Promise.all([getMoodEntry(today), listMoodEntries(60)]);
    setTodayMood(submitted?.mood ?? null);
    setNote(submitted?.note ?? '');
    setHistory(entries);
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function pick(mood: number) {
    setTodayMood(mood);
    await saveMoodEntry({ day: today, mood, note });
    load();
  }

  async function saveNote() {
    await saveMoodEntry({ day: today, mood: todayMood ?? 3, note });
    load();
  }

  function confirmClear() {
    if (todayMood == null && !note) return;
    Alert.alert('Clear today?', 'Your mood and note for today will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteMoodEntry(today);
            setTodayMood(null);
            setNote('');
            load();
          })(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Mood</Text>
        {(todayMood != null || note) ? (
          <Pressable onPress={confirmClear} hitSlop={8}>
            <Icon name="delete-outline" size={22} color={theme.sub} />
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.date, { color: theme.sub }]}>{formatNoteDate(Date.now())}</Text>

        <View style={[styles.moodCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>How are you feeling?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <Pressable
                key={m.v}
                onPress={() => pick(m.v)}
                style={[
                  styles.moodBtn,
                  {
                    backgroundColor: todayMood === m.v ? theme.accent : theme.chipBg,
                    borderWidth: 1,
                    borderColor: todayMood === m.v ? theme.accent : theme.border,
                  },
                ]}>
                <Text style={[styles.moodEmoji, { transform: todayMood === m.v ? [{ scale: 1.15 }] : [] }]}>
                  {m.emoji}
                </Text>
                <Text style={[styles.moodLabel, { color: todayMood === m.v ? '#FFFFFF' : theme.sub }]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.noteLabel, { color: theme.sub }]}>A NOTE FOR TODAY</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            onEndEditing={() => void saveNote().catch(() => {})}
            placeholder="What made today feel this way?"
            placeholderTextColor={theme.sub}
            multiline
            style={[
              styles.noteInput,
              { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border },
            ]}
          />
          <Pressable onPress={() => void saveNote()} style={[styles.saveNoteBtn, { backgroundColor: theme.accent }]}>
            <Text style={styles.saveNoteText}>Save note</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent days</Text>
        {history.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>
            Log your first mood to start tracking your emotional trend.
          </Text>
        ) : (
          history.map((e) => {
            const m = MOODS.find((x) => x.v === e.mood);
            const isToday = e.day === today;
            return (
              <View
                key={e.day}
                style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.historyEmoji, { opacity: isToday ? 1 : 0.85 }]}>{m?.emoji ?? '😐'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyDay, { color: theme.text }]}>
                    {isToday ? 'Today' : formatDayLabel(e.day)}
                  </Text>
                  {e.note ? (
                    <Text style={[styles.historyNote, { color: theme.sub }]} numberOfLines={2}>
                      {e.note}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.historyMood, { color: theme.sub }]}>{m?.label ?? 'Okay'}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDayLabel(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' }),
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 6,
  },
  title: { fontSize: 24, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 110 },
  date: { fontSize: 13, fontWeight: '700', marginBottom: 14 },
  moodCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: {
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 10,
    width: 60,
  },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 10, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  noteLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 6,
  },
  noteInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveNoteBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveNoteText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  hint: { fontSize: 13.5 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  historyEmoji: { fontSize: 24 },
  historyDay: { fontSize: 14, fontWeight: '700' },
  historyNote: { fontSize: 12.5, marginTop: 2 },
  historyMood: { fontSize: 12.5, fontWeight: '600' },
});
