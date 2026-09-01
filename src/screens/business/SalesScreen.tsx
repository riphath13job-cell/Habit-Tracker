import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { listSales, listCustomers, listProducts, markSaleFullyPaid, deleteSale, salesTotals } from '../../db';
import { useTheme } from '../../theme';
import { formatMoney } from '../../business/stats';
import { getBusinessCurrency } from './BusinessSettingsScreen';
import type { BusinessCurrency, Customer, Product, Sale } from '../../types';

export function SalesScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState<BusinessCurrency>('czk');

  const load = useCallback(async () => {
    const [s, c, p, cur] = await Promise.all([listSales(), listCustomers(), listProducts(), getBusinessCurrency()]);
    setSales(s);
    setCustomers(c);
    setProducts(p);
    setCurrency(cur);
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const totals = useMemo(() => salesTotals(sales, products), [sales, products]);

  function confirmMarkPaid(sale: Sale) {
    Alert.alert('Mark as paid?', `Collect ${formatMoney(sale.total_cents - Math.min(sale.paid_cents, sale.total_cents), currency)} from ${customerById.get(sale.customer_id)?.name ?? 'customer'}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark paid',
        onPress: () =>
          void (async () => {
            await markSaleFullyPaid(sale.id);
            load();
          })(),
      },
    ]);
  }

  function confirmDelete(sale: Sale) {
    Alert.alert('Delete sale?', `${sale.quantity} card(s) · ${sale.day}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteSale(sale.id);
            load();
          })(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Sales</Text>
        <Pressable onPress={() => navigation.navigate('BusinessAddSale')} hitSlop={8} style={styles.addBtn}>
          <Icon name="add" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <Summary label="Earned" value={formatMoney(totals.revenue_cents, currency)} color={theme.good} theme={theme} />
            <Summary label="Outstanding" value={formatMoney(totals.outstanding_cents, currency)} color={totals.outstanding_cents > 0 ? theme.danger : theme.text} theme={theme} />
          </View>
          <Text style={[styles.summarySub, { color: theme.sub }]}>
            {totals.sale_count} sale{sales.length === 1 ? '' : 's'} · {totals.cards_sold} card{sales.length === 1 ? '' : 's'} sold
          </Text>
        </View>

        {sales.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>No sales yet. Tap + to record your first sale.</Text>
        ) : (
          sales.map((s) => {
            const customer = customerById.get(s.customer_id);
            const p = s.product_id != null ? productById.get(s.product_id) : undefined;
            const remaining = s.total_cents - Math.min(s.paid_cents, s.total_cents);
            const statusColor = s.status === 'paid' ? theme.good : s.status === 'partial' ? theme.yellow : theme.danger;
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  if (s.status !== 'paid') confirmMarkPaid(s);
                }}
                style={[styles.saleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.saleCustomer, { color: theme.text }]}>{customer?.name ?? 'Unknown'}</Text>
                  <Text style={[styles.saleMeta, { color: theme.sub }]}>
                    {s.quantity} × {p?.name ?? 'product'} · {s.day}
                  </Text>
                  {remaining > 0 ? (
                    <Text style={[styles.saleMeta, { color: theme.danger }]}>Owes {formatMoney(remaining, currency)} · tap to collect</Text>
                  ) : (
                    <Text style={[styles.saleMeta, { color: theme.good }]}>Paid</Text>
                  )}
                </View>
                <Text style={[styles.saleAmount, { color: theme.text }]}>{formatMoney(s.total_cents, currency)}</Text>
                <Pressable onPress={() => confirmDelete(s)} hitSlop={8} style={styles.iconBtn}>
                  <Icon name="delete-outline" size={18} color={theme.sub} />
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({ label, value, color, theme }: { label: string; value: string; color: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryVal, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: theme.sub }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  title: { fontSize: 24, fontWeight: '800' },
  addBtn: { padding: 6 },
  content: { padding: 20, paddingBottom: 110, gap: 10 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, gap: 2 },
  summaryVal: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 12.5, fontWeight: '600' },
  summarySub: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 13.5 },
  saleCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  saleCustomer: { fontSize: 15, fontWeight: '700' },
  saleMeta: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  saleAmount: { fontSize: 15, fontWeight: '800' },
  iconBtn: { padding: 5 },
});
