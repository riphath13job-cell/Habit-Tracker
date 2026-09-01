import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import {
  getCustomer,
  salesForCustomer,
  listProducts,
  markSaleFullyPaid,
  deleteSale,
} from '../../db';
import { useTheme } from '../../theme';
import { formatMoney } from '../../business/stats';
import { getBusinessCurrency } from './BusinessSettingsScreen';
import type { BusinessCurrency, Customer, Product, Sale } from '../../types';

export function CustomerDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const customerId = route.params?.customerId as number;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState<BusinessCurrency>('czk');

  const load = useCallback(async () => {
    const [c, s, p, cur] = await Promise.all([getCustomer(customerId), salesForCustomer(customerId), listProducts(), getBusinessCurrency()]);
    setCustomer(c);
    setSales(s);
    setProducts(p);
    setCurrency(cur);
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!customer) return null;

  const productById = new Map(products.map((p) => [p.id, p]));
  const reorderThresholds = sales.filter((s) => s.reorder_when_quantity != null).map((s) => s.reorder_when_quantity as number);
  const threshold = reorderThresholds.length ? Math.max(...reorderThresholds) : 0;
  const soldTotal = sales.reduce((s, x) => s + x.quantity, 0);
  const needsReorder = threshold > 0 && soldTotal >= threshold;
  const totalDue = sales.reduce((s, x) => s + x.total_cents, 0);
  const totalPaid = sales.reduce((s, x) => s + Math.min(x.paid_cents, x.total_cents), 0);
  const outstanding = totalDue - totalPaid;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text, flex: 1 }]} numberOfLines={1}>
          {customer.name}
        </Text>
        <Pressable onPress={() => navigation.navigate('BusinessAddSale', { customerId: customer.id })} hitSlop={8} style={styles.iconBtn}>
          <Icon name="add" size={24} color={theme.accent} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statRow}>
            <Stat label="Total" value={formatMoney(totalDue, currency)} color={theme.text} />
            <Stat label="Paid" value={formatMoney(totalPaid, currency)} color={theme.good} />
            <Stat label="Owes" value={formatMoney(outstanding, currency)} color={outstanding > 0 ? theme.danger : theme.text} />
          </View>
          <Text style={[styles.meta, { color: theme.sub }]}>
            {sales.length} sale{sales.length === 1 ? '' : 's'} · {soldTotal} card{soldTotal === 1 ? '' : 's'} sold
          </Text>
          {needsReorder ? (
            <View style={[styles.reorderBadge, { backgroundColor: theme.danger }]}>
              <Icon name="warning" size={16} color="#FFFFFF" />
              <Text style={styles.reorderBadgeText}>Needs reorder ({soldTotal} of threshold {threshold})</Text>
            </View>
          ) : (
            <View style={[styles.reorderOk, { backgroundColor: theme.chipBg }]}>
              <Icon name="check-circle" size={16} color={theme.good} />
              <Text style={[styles.reorderOkText, { color: theme.sub }]}>
                {threshold > 0 ? `Reorder after ${threshold} cards sold` : 'No reorder threshold set'}
              </Text>
            </View>
          )}
          {customer.contact ? (
            <Text style={[styles.meta, { color: theme.sub }]}>Contact: {customer.contact}</Text>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sales</Text>
        {sales.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>No sales yet. Tap + to log one.</Text>
        ) : (
          sales.map((s) => {
            const p = s.product_id != null ? productById.get(s.product_id) : undefined;
            const remaining = s.total_cents - Math.min(s.paid_cents, s.total_cents);
            const statusColor =
              s.status === 'paid' ? theme.good : s.status === 'partial' ? theme.yellow : theme.danger;
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  if (s.status !== 'paid') markSalePaidConfirm(s, customer.name, currency, () => void load());
                }}
                style={[styles.saleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.saleText, { color: theme.text }]}>
                    {s.quantity} × {p?.name ?? 'Unknown'} · {formatMoney(s.total_cents, currency)}
                  </Text>
                  <Text style={[styles.saleMeta, { color: theme.sub }]}>{s.day}</Text>
                  {remaining > 0 ? (
                    <Text style={[styles.saleMeta, { color: theme.danger }]}>
                      Owns {formatMoney(remaining, currency)} · tap to mark paid
                    </Text>
                  ) : (
                    <Text style={[styles.saleMeta, { color: theme.good }]}>Paid in full</Text>
                  )}
                  {s.notes ? <Text style={[styles.saleMeta, { color: theme.sub }]}>{s.notes}</Text> : null}
                </View>
                <Pressable
                  onPress={() => confirmDeleteSale(s)}
                  hitSlop={8}
                  style={styles.iconBtn}>
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

function markSalePaidConfirm(sale: Sale, customerName: string, currency: BusinessCurrency, onDone: () => void) {
  const remaining = sale.total_cents - Math.min(sale.paid_cents, sale.total_cents);
  Alert.alert('Mark as paid?', `${customerName} owns ${formatMoney(remaining, currency)}. Mark this sale paid in full?`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Mark paid',
      onPress: () =>
        void (async () => {
          await markSaleFullyPaid(sale.id);
          onDone();
        })(),
    },
  ]);
}

function confirmDeleteSale(sale: Sale) {
  Alert.alert('Delete sale?', `${sale.quantity} card(s), ${sale.day} — stock will be restored.`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () =>
        void (async () => {
          await deleteSale(sale.id);
        })(),
    },
  ]);
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
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
  iconBtn: { padding: 6 },
  content: { padding: 20, paddingBottom: 110, gap: 10 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1, gap: 3 },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 13, fontWeight: '600' },
  reorderBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  reorderBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  reorderOk: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  reorderOkText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 8 },
  hint: { fontSize: 13.5 },
  saleCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  saleText: { fontSize: 14.5, fontWeight: '700' },
  saleMeta: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
});
