import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { WaterLog, WaterPrefs } from '../../types';
import { allWaterLogs, getWaterPrefs } from '../../db';
import { todayKey, WEEKDAY_LETTERS } from '../../date-utils';
import {
  bestWaterStreak,
  currentWaterStreak,
  dayRangeTotals,
  formatMl,
  hitRate,
  rollupByDay,
  shiftDay,
} from '../../water/stats';
import { useTheme } from '../../theme';

function dayLetter(day: string): string {
  return WEEKDAY_LETTERS[new Date(`${day}T12:00:00`).getDay()];
}

function litersLabel(ml: number): string {
  const l = ml / 1000;
  return l >= 10 ? `${Math.round(l)}` : l.toFixed(1).replace('.0', '');
}

export function WaterStatsScreen() {
  const theme = useTheme();
  const [allLogs, setAllLogs] = useState<WaterLog[]>([]);
  const [prefs, setPrefs] = useState<WaterPrefs>({
    target_ml: 2500,
    reminder_start: null,
    reminder_end: null,
    reminder_interval: null,
    notification_id: null,
  });

  const load = useCallback(async () => {
    const [logs, storedPrefs] = await Promise.all([allWaterLogs(), getWaterPrefs()]);
    setAllLogs(logs);
    setPrefs(storedPrefs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = rollupByDay(allLogs);
  const target = prefs.target_ml;
  const today = todayKey();
  const days = dayRangeTotals(totals, shiftDay(today, -6), today);
  const totalMl = [...totals.values()].reduce((sum, n) => sum + n, 0);
  const rate = hitRate(totals, target, shiftDay(today, -29), today);

  const maxScale = Math.max(target, ...days.map((d) => d.total), 1) * 1.2;

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Current streak', value: `${currentWaterStreak(totals, target, today)} days` },
    { label: 'Best streak', value: `${bestWaterStreak(totals, target)} days` },
    { label: 'Hit rate · 30d', value: rate === null ? '—' : `${Math.round(rate * 100)}%` },
    { label: 'Lifetime', value: formatMl(totalMl) },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Stats</Text>
        <Text style={[styles.headerSub, { color: theme.sub }]}>Target {formatMl(target)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.sub }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.barsWrap}>
            <View
              pointerEvents="none"
              style={[
                styles.goalLine,
                {
                  bottom: `${Math.min(96, (target / maxScale) * 100)}%` as `${number}%`,
                  borderTopColor: theme.danger,
                },
              ]}
            />
            {days.map((d) => (
              <View key={d.day} style={styles.barCol}>
                <Text style={[styles.barValue, { color: theme.sub }]}>
                  {d.total > 0 ? litersLabel(d.total) : ''}
                </Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max((d.total / maxScale) * 100, 1.5)}%` as `${number}%`,
                      backgroundColor:
                        d.total > 0 ? (d.total >= target ? theme.good : theme.accent) : theme.border,
                    },
                  ]}
                />
                <Text style={[styles.barLabel, { color: theme.sub }]}>{dayLetter(d.day)}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.chartHint, { color: theme.sub }]}>
            Dashed line = your target ({formatMl(target)})
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent days</Text>
        {days
          .filter((d) => d.total > 0)
          .slice(-7)
          .reverse()
          .map((d) => (
            <View key={d.day} style={[styles.recentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.recentDay, { color: theme.text }]}>
                {d.day === today ? 'Today' : dayForLabel(d.day)}
              </Text>
              <Text style={[styles.recentMl, { color: d.total >= target ? theme.good : theme.text }]}>
                {formatMl(d.total)} {d.total >= target ? '✓' : ''}
              </Text>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function dayForLabel(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
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
  headerSub: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 14,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 15,
    borderWidth: 1,
    padding: 14,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 3,
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  barsWrap: {
    flexDirection: 'row',
    height: 130,
    alignItems: 'stretch',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barValue: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  bar: {
    width: 20,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
  },
  chartHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 7,
  },
  recentDay: {
    fontSize: 14,
    fontWeight: '700',
  },
  recentMl: {
    fontSize: 15,
    fontWeight: '800',
  },
});