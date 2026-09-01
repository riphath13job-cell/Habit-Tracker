import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { Transaction } from '../../types';
import { getTransactionsBetween } from '../../db';
import { todayKey } from '../../date-utils';
import { useTheme } from '../../theme';
import {
  byCategory,
  currentMonthKey,
  formatMoney,
  monthRange,
  monthKey,
  shiftMonth,
  totalSpent,
} from '../../spend/stats';

export function SpendStatsScreen() {
  const theme = useTheme();
  const [txs, setTxs] = useState<Transaction[]>([]);

  const load = useCallback(async () => {
    const today = todayKey();
    const sixMonthsAgo = monthRange(shiftMonth(currentMonthKey(), -5)).start;
    setTxs(await getTransactionsBetween(sixMonthsAgo, today));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const month = currentMonthKey();
  const thisMonthTxs = useMemo(
    () => txs.filter((t) => t.day.startsWith(month)),
    [txs, month],
  );
  const breakdown = useMemo(() => byCategory(thisMonthTxs), [thisMonthTxs]);
  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txs) {
      if (t.amount_cents <= 0) continue;
      const mk = t.day.slice(0, 7);
      map.set(mk, (map.get(mk) ?? 0) + t.amount_cents);
    }
    const out: Array<{ key: string; label: string; spent: number }> = [];
    const key = shiftMonth(month, -5);
    for (let i = 0; i < 6; i++) {
      const k = shiftMonth(key, i);
      out.push({ key: k, label: monthRange(k).label, spent: map.get(k) ?? 0 });
    }
    return out;
  }, [txs, month]);

  const maxMonth = Math.max(1, ...monthly.map((m) => m.spent));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>This month by category</Text>
          {breakdown.length === 0 ? (
            <Text style={[styles.hint, { color: theme.sub }]}>
              Add some spending this month to see the breakdown.
            </Text>
          ) : (
            breakdown.map((b) => (
              <View key={b.category} style={styles.catRow}>
                <View style={styles.catInfo}>
                  <Text style={[styles.catName, { color: theme.text }]}>{b.category}</Text>
                  <Text style={[styles.catCount, { color: theme.sub }]}>
                    {formatMoney(b.spent)} · {b.count} item{b.count === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text style={[styles.catPct, { color: theme.sub }]}>{Math.round(b.pct * 100)}%</Text>
                <View style={[styles.catTrack, { backgroundColor: theme.chipBg }]}>
                  <View style={[styles.catFill, { width: `${Math.max(4, Math.round(b.pct * 100))}%`, backgroundColor: theme.accent }]} />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Last 6 months</Text>
          <View style={styles.monthChart}>
            {monthly.map((m) => {
              const h = Math.max(4, Math.round((m.spent / maxMonth) * 100));
              const isCurrent = m.key === month;
              return (
                <View key={m.key} style={styles.monthCol}>
                  <Text style={[styles.barVal, { color: theme.sub }]} numberOfLines={1}>
                    {m.spent > 0 ? formatMoney(m.spent).replace('$', '') : ''}
                  </Text>
                  <View
                    style={[
                      styles.monthBar,
                      { height: h, backgroundColor: isCurrent ? theme.accent : theme.blue },
                    ]}
                  />
                  <Text style={[styles.monthLabel, { color: isCurrent ? theme.text : theme.sub }]} numberOfLines={1}>
                    {m.label.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: theme.sub }]}>
            Total this month: {formatMoney(totalSpent(thisMonthTxs))}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 110, gap: 14 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  hint: { fontSize: 13.5 },
  catRow: { marginBottom: 14 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 14.5, fontWeight: '700', flex: 1 },
  catCount: { fontSize: 12.5, fontWeight: '600' },
  catPct: { fontSize: 13, fontWeight: '800', marginTop: 4, marginBottom: 4 },
  catTrack: { height: 8, borderRadius: 4, marginTop: 6, overflow: 'hidden' },
  catFill: { height: 8, borderRadius: 4 },
  monthChart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8 },
  monthCol: { flex: 1, alignItems: 'center' },
  barVal: { fontSize: 9, marginBottom: 3 },
  monthBar: { width: '64%', borderRadius: 5, minHeight: 4 },
  monthLabel: { fontSize: 10, fontWeight: '700', marginTop: 5 },
});
