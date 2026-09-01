import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { MoodEntry } from '../../types';
import { listMoodEntries } from '../../db';
import { dayKey, todayKey } from '../../date-utils';
import { useTheme } from '../../theme';

const RANGES = [7, 14, 30] as const;
const MOOD_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#F59E0B',
  4: '#84CC16',
  5: '#22C55E',
};

export function MoodStatsScreen() {
  const theme = useTheme();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [range, setRange] = useState<number>(14);

  const load = useCallback(async () => {
    setEntries(await listMoodEntries(999));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const today = todayKey();
  const byDay = useMemo(() => {
    const map = new Map<string, MoodEntry>();
    for (const e of entries) map.set(e.day, e);
    return map;
  }, [entries]);

  const bars = buildBars(byDay, today, range);
  const valid = bars.filter((b) => b.mood != null);
  const avg = valid.length ? valid.reduce((a, b) => a + (b.mood ?? 0), 0) / valid.length : null;
  const loggedDays = [...byDay.keys()].length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sumValue, { color: theme.text }]}>
              {avg == null ? '—' : avg.toFixed(1)}
            </Text>
            <Text style={[styles.sumLabel, { color: theme.sub }]}>avg mood</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sumValue, { color: theme.text }]}>{loggedDays}</Text>
            <Text style={[styles.sumLabel, { color: theme.sub }]}>days logged</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sumValue, { color: theme.text }]}>
              {findBest(byDay) ?? '—'}
            </Text>
            <Text style={[styles.sumLabel, { color: theme.sub }]}>best day</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Mood trend</Text>
            <View style={styles.rangeRow}>
              {RANGES.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRange(r)}
                  style={[styles.rangeChip, { backgroundColor: r === range ? theme.accent : theme.chipBg }]}>
                  <Text style={[styles.rangeText, { color: r === range ? '#FFFFFF' : theme.sub }]}>{r}d</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.chart}>
            {bars.map((b, i) => {
              const isToday = b.day === today;
              const color = b.mood != null ? MOOD_COLORS[b.mood] : theme.chipBg;
              return (
                <View key={b.day} style={styles.barCol}>
                  {b.mood != null ? (
                    <Text style={[styles.barVal, { color }]}>{b.mood}</Text>
                  ) : (
                    <Text style={[styles.barVal, { color: theme.sub }]}>·</Text>
                  )}
                  <View style={[styles.bar, { backgroundColor: color }]} />
                  <Text style={[styles.barDay, { color: isToday ? theme.text : theme.sub }]}>
                    {i % 2 === 0 || b.day === today ? b.dayLabel : ''}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={[styles.hint, { color: theme.sub }]}>
            Mood is on a 1–5 scale (1 = terrible, 5 = amazing).
          </Text>
        </View>

        <View style={[styles.legend, { backgroundColor: theme.chipBg }]}>
          {[1, 2, 3, 4, 5].map((v) => (
            <View key={v} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: MOOD_COLORS[v] }]} />
              <Text style={[styles.legendText, { color: theme.sub }]}>{v}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function findBest(byDay: Map<string, MoodEntry>): number | null {
  let best: number | null = null;
  for (const e of byDay.values()) {
    if (best == null || e.mood > best) best = e.mood;
  }
  return best;
}

function buildBars(
  byDay: Map<string, MoodEntry>,
  today: string,
  days: number,
): Array<{ day: string; dayLabel: string; mood: number | null }> {
  const out: Array<{ day: string; dayLabel: string; mood: number | null }> = [];
  const start = new Date(today + 'T00:00:00');
  start.setDate(start.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    out.push({ day: key, dayLabel: String(d.getDate()), mood: byDay.get(key)?.mood ?? null });
  }
  return out;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 110, gap: 14 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 6,
  },
  divider: { width: 1, alignSelf: 'stretch' },
  sumValue: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sumLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  rangeRow: { flexDirection: 'row', gap: 6 },
  rangeChip: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  rangeText: { fontSize: 12.5, fontWeight: '800' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, marginTop: 18, gap: 6 },
  barCol: { flex: 1, alignItems: 'center' },
  barVal: { fontSize: 9.5, fontWeight: '700', marginBottom: 3 },
  bar: { width: '62%', height: 26, borderRadius: 6 },
  barDay: { fontSize: 9.5, marginTop: 5 },
  hint: { fontSize: 12.5, marginTop: 14 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 12, paddingVertical: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '700' },
});
