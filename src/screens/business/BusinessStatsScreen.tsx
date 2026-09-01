import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { listSales, listProducts, salesTotals } from '../../db';
import { useTheme } from '../../theme';
import { formatMoney } from '../../business/stats';
import { getBusinessCurrency } from './BusinessSettingsScreen';
import type { BusinessCurrency, Product, Sale } from '../../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function BusinessStatsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState<BusinessCurrency>('czk');
  const [month, setMonth] = useState(monthKey(new Date()));

  const load = useCallback(async () => {
    const [s, p, cur] = await Promise.all([listSales(100000), listProducts(), getBusinessCurrency()]);
    setSales(s);
    setProducts(p);
    setCurrency(cur);
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = useMemo(() => salesTotals(sales, products), [sales, products]);

  const monthNames = useMemo(() => {
    const map = new Map<string, Sale[]>();
    for (const s of sales) {
      const key = s.day.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 12);
  }, [sales]);

  const [y, m] = month.split('-').map(Number);
  const monthLabel = `${MONTHS[m - 1]} ${y}`;
  const monthSales = sales.filter((s) => s.day.startsWith(month));
  const monthTotals = useMemo(() => salesTotals(monthSales, products), [monthSales, products]);

  function shiftMonth(delta: number) {
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(monthKey(d));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.grid, { gap: 10 }]}>
          <StatCard label="Revenue" value={formatMoney(totals.revenue_cents, currency)} color={theme.good} theme={theme} />
          <StatCard label="Outstanding" value={formatMoney(totals.outstanding_cents, currency)} color={totals.outstanding_cents > 0 ? theme.danger : theme.text} theme={theme} />
          <StatCard label="Cards sold" value={String(totals.cards_sold)} color={theme.text} theme={theme} />
          <StatCard label="Total profit" value={formatMoney(totals.profit_cents, currency)} color={theme.text} theme={theme} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>This month</Text>
        <View style={styles.monthRow}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={8} style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
            <Icon name="chevron-left" size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={8} style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
            <Icon name="chevron-right" size={18} color={theme.text} />
          </Pressable>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.monthStatRow}>
            <Text style={[styles.monthStatLabel, { color: theme.sub }]}>Revenue</Text>
            <Text style={[styles.monthStatVal, { color: theme.good }]}>{formatMoney(monthTotals.revenue_cents, currency)}</Text>
          </View>
          <View style={styles.monthStatRow}>
            <Text style={[styles.monthStatLabel, { color: theme.sub }]}>Cards sold</Text>
            <Text style={[styles.monthStatVal, { color: theme.text }]}>{monthTotals.cards_sold}</Text>
          </View>
          <View style={styles.monthStatRow}>
            <Text style={[styles.monthStatLabel, { color: theme.sub }]}>Sales</Text>
            <Text style={[styles.monthStatVal, { color: theme.text }]}>{monthTotals.sale_count}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Monthly revenue</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {monthNames.length === 0 ? (
            <Text style={[styles.hint, { color: theme.sub }]}>No sales recorded yet.</Text>
          ) : (
            monthNames.map(([key, ms]) => {
              const rev = ms.reduce((s, x) => s + x.total_cents, 0);
              const max = Math.max(...monthNames.map(([, v]) => v.reduce((s, x) => s + x.total_cents, 0)), 1);
              const [yy, mm] = key.split('-').map(Number);
              return (
                <View key={key} style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: theme.sub }]}>{`${MONTHS[mm - 1]} ${String(yy).slice(2)}`}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(4, (rev / max) * 100)}%`, backgroundColor: theme.accent }]} />
                  </View>
                  <Text style={[styles.barVal, { color: theme.text }]}>{formatMoney(rev, currency)}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color, theme }: { label: string; value: string; color: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.sub }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  backBtn: { padding: 6 },
  title: { fontSize: 22, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 110, gap: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCard: { width: '48.5%', borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12.5, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  monthLabel: { fontSize: 16, fontWeight: '800', minWidth: 120, textAlign: 'center' },
  stepBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  monthStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthStatLabel: { fontSize: 14, fontWeight: '600' },
  monthStatVal: { fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 13.5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { fontSize: 12, fontWeight: '700', width: 52 },
  barTrack: { flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(128,128,128,0.15)', overflow: 'hidden' },
  barFill: { height: 12, borderRadius: 6 },
  barVal: { fontSize: 12.5, fontWeight: '800', width: 90, textAlign: 'right' },
});
