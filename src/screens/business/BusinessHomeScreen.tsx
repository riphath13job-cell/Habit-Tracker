import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { listSales, listProducts, reorderCustomers, salesTotals } from '../../db';
import { useTheme } from '../../theme';
import { formatMoney } from '../../business/stats';
import { getBusinessCurrency } from './BusinessSettingsScreen';
import type { BusinessCurrency } from '../../types';

export function BusinessHomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [currency, setCurrency] = useState<BusinessCurrency>('czk');
  const [allSales, setAllSales] = useState<Awaited<ReturnType<typeof listSales>>>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listProducts>>>([]);
  const [reorders, setReorders] = useState<Awaited<ReturnType<typeof reorderCustomers>>>([]);

  const load = useCallback(async () => {
    const [s, p, r, cur] = await Promise.all([listSales(), listProducts(), reorderCustomers(), getBusinessCurrency()]);
    setAllSales(s);
    setProducts(p);
    setReorders(r);
    setCurrency(cur);
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = useMemo(() => salesTotals(allSales, products), [allSales, products]);
  const lowStock = products.filter((p) => p.quantity_on_hand <= 3);
  const avgSale = totals.sale_count > 0 ? totals.revenue_cents / totals.sale_count : 0;

  const atRisk = reorders.length + lowStock.length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Business</Text>
        <Pressable onPress={() => navigation.navigate('BusinessSettings')} hitSlop={8} style={styles.gearBtn}>
          <Icon name="settings" size={22} color={theme.sub} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {atRisk > 0 ? (
          <Pressable
            onPress={() => navigation.navigate('BusinessStats')}
            style={[styles.alertCard, { backgroundColor: theme.danger }]}>
            <Icon name="warning" size={20} color="#FFFFFF" />
            <Text style={styles.alertText}>
              {reorders.length > 0 ? `${reorders.length} customer${reorders.length === 1 ? '' : 's'} need reordering · ` : ''}
              {lowStock.length > 0 ? `${lowStock.length} product${lowStock.length === 1 ? '' : 's'} low on stock` : ''}
            </Text>
          </Pressable>
        ) : null}

        <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.heroLabel, { color: theme.sub }]}>Total earned</Text>
          <Text style={[styles.heroValue, { color: theme.good }]}>{formatMoney(totals.revenue_cents, currency)}</Text>
          <Text style={[styles.heroSub, { color: theme.sub }]}>
            {totals.outstanding_cents > 0
              ? `${formatMoney(totals.outstanding_cents, currency)} still outstanding`
              : 'Nothing owed'}
          </Text>
        </View>

        <View style={styles.statGrid}>
          <StatCard label="Outstanding" value={formatMoney(totals.outstanding_cents, currency)} color={totals.outstanding_cents > 0 ? theme.danger : theme.good} theme={theme} onPress={() => navigation.navigate('BusinessStats')} />
          <StatCard label="Cards sold" value={String(totals.cards_sold)} color={theme.text} theme={theme} onPress={() => navigation.navigate('BusinessStats')} />
          <StatCard label="Avg sale" value={formatMoney(avgSale, currency)} color={theme.text} theme={theme} onPress={() => navigation.navigate('BusinessStats')} />
          <StatCard label="On hand" value={String(products.reduce((s, p) => s + p.quantity_on_hand, 0))} color={theme.text} theme={theme} onPress={() => navigation.navigate('BusinessProducts')} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Needs attention</Text>
        {reorders.length === 0 && lowStock.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>All clear — nothing needs reordering right now.</Text>
        ) : (
          <View style={styles.attentionList}>
            {reorders.map((r) => (
              <Pressable
                key={r.customer.id}
                onPress={() => navigation.navigate('BusinessCustomerDetail', { customerId: r.customer.id })}
                style={[styles.attentionItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Icon name="storefront" size={20} color={theme.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attentionTitle, { color: theme.text }]}>{r.customer.name}</Text>
                  <Text style={[styles.attentionSub, { color: theme.sub }]}>
                    Sold {r.sold_quantity} · reorder at {r.reorder_when_quantity}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={theme.sub} />
              </Pressable>
            ))}
            {lowStock.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => navigation.navigate('BusinessProducts')}
                style={[styles.attentionItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Icon name="storefront" size={20} color={theme.yellow} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attentionTitle, { color: theme.text }]}>{p.name}</Text>
                  <Text style={[styles.attentionSub, { color: theme.sub }]}>
                    {p.quantity_on_hand} left on hand
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={theme.sub} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color, theme, onPress }: { label: string; value: string; color: string; theme: ReturnType<typeof useTheme>; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.sub }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  title: { fontSize: 24, fontWeight: '800' },
  gearBtn: { padding: 6 },
  content: { padding: 20, paddingBottom: 110, gap: 12 },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  alertText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700', flex: 1 },
  hero: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 4 },
  heroLabel: { fontSize: 13, fontWeight: '600' },
  heroValue: { fontSize: 34, fontWeight: '800' },
  heroSub: { fontSize: 13.5, fontWeight: '600' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48.5%', borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12.5, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 6 },
  hint: { fontSize: 13.5 },
  attentionList: { gap: 8 },
  attentionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  attentionTitle: { fontSize: 14.5, fontWeight: '700' },
  attentionSub: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
});
