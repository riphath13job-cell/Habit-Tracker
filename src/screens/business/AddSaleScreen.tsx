import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import { listCustomers, listProducts, createSale } from '../../db';
import { useTheme } from '../../theme';
import { formatMoney } from '../../business/stats';
import { getBusinessCurrency } from './BusinessSettingsScreen';
import { todayKey } from '../../date-utils';
import type { BusinessCurrency, Customer, Product } from '../../types';

function parseCents(text: string): number | null {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

export function AddSaleScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const presetCustomerId = route.params?.customerId as number | undefined;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState<BusinessCurrency>('czk');

  const [customerId, setCustomerId] = useState<number | null>(presetCustomerId ?? null);
  const [productId, setProductId] = useState<number | null>(null);
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState(products[0]?.sell_per_unit_cents != null ? String(products[0].sell_per_unit_cents / 100) : '');
  const [notes, setNotes] = useState('');
  const [reorder, setReorder] = useState('');
  const [paid, setPaid] = useState('');

  const load = useCallback(async () => {
    const [c, p, cur] = await Promise.all([listCustomers(), listProducts(), getBusinessCurrency()]);
    setCustomers(c);
    setProducts(p);
    setCurrency(cur);
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const selectedProduct = productId != null ? products.find((p) => p.id === productId) : undefined;

  function selectProduct(id: number) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) setUnitPrice(String(p.sell_per_unit_cents / 100));
  }

  async function save() {
    if (customerId == null) {
      Alert.alert('Choose a customer', 'Select which business this sale is for.');
      return;
    }
    const quantity = parseInt(qty, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert('Enter a quantity', 'How many cards were sold?');
      return;
    }
    const unitCents = parseCents(unitPrice);
    if (unitCents == null || unitCents <= 0) {
      Alert.alert('Enter a price', 'Set the unit price.');
      return;
    }
    const total = unitCents * quantity;
    const paidCents = parseCents(paid);
    const reorderQty = parseInt(reorder, 10);
    const status = paidCents == null || paidCents <= 0 ? 'unpaid' : paidCents >= total ? 'paid' : 'partial';

    await createSale({
      customer_id: customerId,
      product_id: productId,
      quantity,
      unit_price_cents: unitCents,
      total_cents: total,
      day: todayKey(),
      status,
      paid_cents: paidCents ?? 0,
      reorder_when_quantity: Number.isFinite(reorderQty) && reorderQty > 0 ? reorderQty : null,
      notes: notes.trim(),
    });

    if (presetCustomerId != null) {
      navigation.goBack();
    } else {
      navigation.navigate('BusinessTabs');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>New sale</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.fieldLabel, { color: theme.sub }]}>Customer</Text>
        <View style={styles.chipWrap}>
          {customers.length === 0 ? (
            <Text style={[styles.hint, { color: theme.sub }]}>Add a customer first.</Text>
          ) : (
            customers.map((c) => {
              const active = customerId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCustomerId(c.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? theme.accent : theme.chipBg, borderColor: active ? theme.accent : theme.border },
                  ]}>
                  <Text style={[styles.chipText, { color: active ? '#FFFFFF' : theme.sub }]} numberOfLines={1}>{c.name}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.sub }]}>Product (optional)</Text>
        <View style={styles.chipWrap}>
          {products.length === 0 ? (
            <Text style={[styles.hint, { color: theme.sub }]}>No products yet — price is manual.</Text>
          ) : (
            products.map((p) => {
              const active = productId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => selectProduct(p.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? theme.accent : theme.chipBg, borderColor: active ? theme.accent : theme.border },
                  ]}>
                  <Text style={[styles.chipText, { color: active ? '#FFFFFF' : theme.sub }]} numberOfLines={1}>{p.name}</Text>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.row2}>
          <View style={styles.field2}>
            <Text style={[styles.fieldLabel, { color: theme.sub }]}>Quantity</Text>
            <TextInput
              value={qty}
              onChangeText={setQty}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={theme.sub}
              style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
            />
          </View>
          <View style={styles.field2}>
            <Text style={[styles.fieldLabel, { color: theme.sub }]}>Unit price</Text>
            <TextInput
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.sub}
              style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
            />
          </View>
        </View>

        <View style={styles.row2}>
          <View style={styles.field2}>
            <Text style={[styles.fieldLabel, { color: theme.sub }]}>Paid now</Text>
            <TextInput
              value={paid}
              onChangeText={setPaid}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.sub}
              style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
            />
          </View>
          <View style={styles.field2}>
            <Text style={[styles.fieldLabel, { color: theme.sub }]}>Reorder after</Text>
            <TextInput
              value={reorder}
              onChangeText={setReorder}
              keyboardType="number-pad"
              placeholder="cards"
              placeholderTextColor={theme.sub}
              style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
            />
          </View>
        </View>

        <Text style={[styles.fieldLabel, { color: theme.sub }]}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes (optional)"
          placeholderTextColor={theme.sub}
          multiline
          style={[styles.input, styles.multiline, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
        />

        <Text style={[styles.total, { color: theme.text }]}>
          Total: {formatMoney((parseCents(unitPrice) ?? 0) * (parseInt(qty, 10) || 0), currency)}
        </Text>

        <Pressable onPress={() => void save()} style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
          <Icon name="check" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Save sale</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  backBtn: { padding: 6 },
  title: { fontSize: 22, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 110 },
  fieldLabel: { fontSize: 12.5, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8, maxWidth: '45%' },
  chipText: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 13 },
  row2: { flexDirection: 'row', gap: 10 },
  field2: { flex: 1 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  total: { fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 4 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, paddingVertical: 14, marginTop: 8 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
