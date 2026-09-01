import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { BodyEntry, BodyMetric } from '../../types';
import { deleteBodyEntry, listBodyEntries, saveBodyEntry } from '../../db';
import { todayKey } from '../../date-utils';
import { useTheme } from '../../theme';
import { LineChart } from '../../components/fitness/LineChart';

const METRICS: Array<{ key: BodyMetric; label: string; unit: string }> = [
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'chest', label: 'Chest', unit: 'cm' },
  { key: 'arms', label: 'Arms', unit: 'cm' },
  { key: 'hips', label: 'Hips', unit: 'cm' },
  { key: 'thighs', label: 'Thighs', unit: 'cm' },
];

export function BodyScreen() {
  const theme = useTheme();
  const [metric, setMetric] = useState<BodyMetric>('weight');
  const [entries, setEntries] = useState<BodyEntry[]>([]);
  const [input, setInput] = useState('');

  const activeMetric = METRICS.find((m) => m.key === metric)!;

  const load = useCallback(async () => {
    setEntries(await listBodyEntries(metric));
  }, [metric]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const chartData = useMemo(
    () =>
      entries
        .slice()
        .sort((a, b) => a.day.localeCompare(b.day))
        .map((entry) => ({ x: new Date(`${entry.day}T12:00:00`).getTime(), y: entry.value })),
    [entries],
  );

  const latest = entries[0];
  const previous = entries[1];
  const delta =
    latest && previous ? Math.round((latest.value - previous.value) * 10) / 10 : null;

  async function saveValue() {
    const value = parseFloat(input.replace(',', '.'));
    if (!Number.isFinite(value)) {
      Alert.alert('Invalid number', `Enter your ${activeMetric.label.toLowerCase()} in ${activeMetric.unit}.`);
      return;
    }
    await saveBodyEntry(metric, value, todayKey());
    setInput('');
    load();
  }

  function confirmDelete(entry: BodyEntry) {
    Alert.alert('Delete entry?', `${entry.day} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void (async () => {
          await deleteBodyEntry(entry.id);
          load();
        })(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Body</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {METRICS.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => setMetric(m.key)}
              style={[
                styles.chip,
                { backgroundColor: m.key === metric ? theme.accent : theme.chipBg },
              ]}>
              <Text style={[styles.chipText, { color: m.key === metric ? '#FFFFFF' : theme.sub }]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {chartData.length >= 2 ? (
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <LineChart
              points={chartData.map((p) => ({ label: new Date(p.x).toLocaleDateString(), value: p.y }))}
              color={theme.accent}
            />
          </View>
        ) : (
          <Text style={[styles.hint, { color: theme.sub }]}>
            Log at least two days to see the trend.
          </Text>
        )}

        {latest ? (
          <View style={[styles.latestCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View>
              <Text style={[styles.latestLabel, { color: theme.sub }]}>Latest · {latest.day}</Text>
              <Text style={[styles.latestValue, { color: theme.text }]}>
                {latest.value} {activeMetric.unit}
              </Text>
            </View>
            {delta !== null ? (
              <Text
                style={[
                  styles.delta,
                  { color: delta === 0 ? theme.sub : delta > 0 ? theme.danger : theme.good },
                ]}>
                {delta > 0 ? '+' : ''}
                {delta} vs prev
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.entryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.entryLabel, { color: theme.text }]}>
            Today's {activeMetric.label.toLowerCase()} ({activeMetric.unit})
          </Text>
          <View style={styles.entryRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={theme.sub}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
            />
            <Pressable onPress={saveValue} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
              <Icon name="check" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={[styles.entryHint, { color: theme.sub }]}>Measured at home? Same time of day works best.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{activeMetric.label} history</Text>
        {entries.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>No entries yet.</Text>
        ) : (
          entries.map((entry) => (
            <Pressable
              key={entry.id}
              onLongPress={() => confirmDelete(entry)}
              style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.historyDay, { color: theme.sub }]}>{entry.day}</Text>
              <Text style={[styles.historyValue, { color: theme.text }]}>
                {entry.value} {activeMetric.unit}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 14,
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  hint: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
  },
  latestLabel: {
    fontSize: 12.5,
  },
  latestValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  delta: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  entryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
  },
  entryLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 10,
  },
  entryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  saveBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  entryHint: {
    fontSize: 12,
    marginTop: 9,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 7,
  },
  historyDay: {
    fontSize: 13.5,
  },
  historyValue: {
    fontSize: 14.5,
    fontWeight: '700',
  },
});
