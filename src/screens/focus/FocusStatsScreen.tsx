import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { FocusSession } from '../../types';
import { listFocusSessions } from '../../db';
import { dayKey, todayKey } from '../../date-utils';
import { useTheme } from '../../theme';

const RANGES = [7, 14, 30] as const;

export function FocusStatsScreen() {
  const theme = useTheme();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [range, setRange] = useState<number>(14);

  const load = useCallback(async () => {
    setSessions(await listFocusSessions(99999));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const today = todayKey();
  const stats = useMemo(() => {
    const totals = new Map<string, number>();
    const countByDay = new Map<string, number>();
    for (const s of sessions) {
      if (s.completed !== 1) continue;
      const d = dayKey(new Date(s.started_at));
      totals.set(d, (totals.get(d) ?? 0) + s.focus_minutes);
      countByDay.set(d, (countByDay.get(d) ?? 0) + 1);
    }
    const totalMinutes = [...totals.values()].reduce((a, b) => a + b, 0);
    const totalSessions = sessions.filter((s) => s.completed === 1).length;
    const streak = countFocusStreak(totals, today);
    const best = bestFocusStreak(totals, today);
    return { totals, countByDay, totalMinutes, totalSessions, streak, best };
  }, [sessions, today]);

  const bars = buildBars(stats.totals, today, range);

  const maxVal = Math.max(1, ...bars.map((b) => b.minutes));
  const daysWithData = [...stats.totals.keys()].length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sumValue, { color: theme.text }]}>{stats.totalMinutes}</Text>
            <Text style={[styles.sumLabel, { color: theme.sub }]}>min focused</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sumValue, { color: theme.text }]}>{stats.totalSessions}</Text>
            <Text style={[styles.sumLabel, { color: theme.sub }]}>sessions</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sumValue, { color: theme.text }]}>{stats.streak}</Text>
            <Text style={[styles.sumLabel, { color: theme.sub }]}>day streak</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Daily focus</Text>
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
              const h = Math.max(3, Math.round((b.minutes / maxVal) * 90));
              const isToday = b.day === today;
              return (
                <View key={b.day} style={styles.barCol}>
                  <Text style={[styles.barVal, { color: theme.sub }]}>{b.minutes > 0 ? b.minutes : ''}</Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: h,
                        backgroundColor: isToday ? theme.accent : b.minutes > 0 ? theme.blue : theme.chipBg,
                      },
                    ]}
                  />
                  <Text style={[styles.barDay, { color: isToday ? theme.text : theme.sub }]}>
                    {i % 2 === 0 || b.day === today ? b.dayLabel : ''}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={[styles.hint, { color: theme.sub }]}>
            {daysWithData === 0
              ? 'Complete a focus session to see your chart.'
              : `${daysWithData} day${daysWithData === 1 ? '' : 's'} with focus · best streak ${stats.best}`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function countFocusStreak(totals: Map<string, number>, today: string): number {
  let streak = 0;
  let d = new Date(today + 'T00:00:00');
  const todayVal = totals.get(today) ?? 0;
  if (todayVal === 0) d.setDate(d.getDate() - 1); // allow starting from today if focused
  while (totals.get(dayKey(d)) !== undefined) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function bestFocusStreak(totals: Map<string, number>, today: string): number {
  const keys = [...totals.keys()].sort();
  if (keys.length === 0) return 0;
  let best = 0;
  let run = 0;
  let cur = new Date(keys[0] + 'T00:00:00');
  const end = new Date(today + 'T00:00:00');
  while (cur <= end) {
    if (totals.has(dayKey(cur))) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return best;
}

function buildBars(
  totals: Map<string, number>,
  today: string,
  days: number,
): Array<{ day: string; dayLabel: string; minutes: number }> {
  const out: Array<{ day: string; dayLabel: string; minutes: number }> = [];
  const start = new Date(today + 'T00:00:00');
  start.setDate(start.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    out.push({ day: key, dayLabel: String(d.getDate()), minutes: totals.get(key) ?? 0 });
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
  barVal: { fontSize: 9.5, marginBottom: 3 },
  bar: { width: '68%', borderRadius: 4, minHeight: 3 },
  barDay: { fontSize: 9.5, marginTop: 5 },
  hint: { fontSize: 12.5, marginTop: 14 },
});
