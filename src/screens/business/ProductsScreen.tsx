import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { listProducts, createProduct, updateProduct, adjustProductStock, deleteProduct } from '../../db';
import { useTheme } from '../../theme';
import { formatMoney } from '../../business/stats';
import { getBusinessCurrency } from './BusinessSettingsScreen';
import type { BusinessCurrency, Product } from '../../types';

function parseCents(text: string): number | null {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

export function ProductsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState<BusinessCurrency>('czk');

  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [sell, setSell] = useState('');
  const [stock, setStock] = useState('');

  const load = useCallback(async () => {
    const [prods, cur] = await Promise.all([listProducts(), getBusinessCurrency()]);
    setProducts(prods);
    setCurrency(cur);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function startAdd() {
    setEditing(null);
    setName('');
    setCost('');
    setSell('');
    setStock('');
  }

  function startEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setCost(String(p.cost_per_unit_cents / 100));
    setSell(String(p.sell_per_unit_cents / 100));
    setStock(String(p.quantity_on_hand));
  }

  async function save() {
    const n = name.trim();
    if (!n) {
      Alert.alert('Enter a name', 'Give this product a name.');
      return;
    }
    const costCents = parseCents(cost) ?? 0;
    const sellCents = parseCents(sell) ?? 0;
    const qty = parseInt(stock, 10);
    const quantity_on_hand = Number.isFinite(qty) && qty > 0 ? qty : 0;
    if (editing) {
      await updateProduct({ ...editing, name: n, cost_per_unit_cents: costCents, sell_per_unit_cents: sellCents, quantity_on_hand });
    } else {
      await createProduct({ name: n, cost_per_unit_cents: costCents, sell_per_unit_cents: sellCents, quantity_on_hand });
    }
    startAdd();
    load();
  }

  function confirmDelete(p: Product) {
    Alert.alert('Delete product?', `${p.name} — past sales will keep their price.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteProduct(p.id);
            load();
          })(),
      },
    ]);
  }

  async function restock(p: Product, amount: number) {
    await adjustProductStock(p.id, amount);
    load();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Products & Inventory</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{editing ? 'Edit product' : 'New product'}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name (e.g. Google Review Card)"
            placeholderTextColor={theme.sub}
            style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
          />
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.sub }]}>Cost / unit</Text>
              <TextInput
                value={cost}
                onChangeText={setCost}
                placeholder="0.00"
                placeholderTextColor={theme.sub}
                keyboardType="decimal-pad"
                style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.sub }]}>Sell / unit</Text>
              <TextInput
                value={sell}
                onChangeText={setSell}
                placeholder="0.00"
                placeholderTextColor={theme.sub}
                keyboardType="decimal-pad"
                style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
              />
            </View>
          </View>
          <Text style={[styles.fieldLabel, { color: theme.sub }]}>Stock on hand</Text>
          <TextInput
            value={stock}
            onChangeText={setStock}
            placeholder="0"
            placeholderTextColor={theme.sub}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
          />
          <Pressable onPress={() => void save()} style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
            <Icon name="check" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>{editing ? 'Save changes' : 'Add product'}</Text>
          </Pressable>
          {editing ? (
            <Pressable onPress={startAdd} style={styles.cancelLink}>
              <Text style={[styles.cancelText, { color: theme.sub }]}>Cancel edit</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Stock ({products.length})
        </Text>
        {products.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>No products yet. Add your first card type above.</Text>
        ) : (
          products.map((p) => {
            const margin = p.sell_per_unit_cents - p.cost_per_unit_cents;
            const lowStock = p.quantity_on_hand <= 3;
            return (
              <View key={p.id} style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.productTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: theme.text }]}>{p.name}</Text>
                    <Text style={[styles.productMeta, { color: theme.sub }]}>
                      {formatMoney(p.sell_per_unit_cents, currency)} each · margin {formatMoney(margin, currency)}
                    </Text>
                  </View>
                  <Pressable onPress={() => startEdit(p)} hitSlop={8} style={styles.iconBtn}>
                    <Icon name="edit" size={18} color={theme.sub} />
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(p)} hitSlop={8} style={styles.iconBtn}>
                    <Icon name="delete-outline" size={18} color={theme.danger} />
                  </Pressable>
                </View>
                <View style={styles.stockRow}>
                  <Text style={[styles.stockLabel, { color: theme.sub }]}>On hand</Text>
                  <View style={styles.stockControls}>
                    <Pressable onPress={() => void restock(p, -1)} style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
                      <Icon name="remove" size={16} color={theme.text} />
                    </Pressable>
                    <Text style={[styles.stockValue, { color: lowStock ? theme.danger : theme.text }]}>{p.quantity_on_hand}</Text>
                    <Pressable onPress={() => void restock(p, 1)} style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
                      <Icon name="add" size={16} color={theme.text} />
                    </Pressable>
                  </View>
                </View>
                {lowStock ? (
                  <Text style={[styles.lowStock, { color: theme.danger }]}>Low stock — consider reordering</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  backBtn: { padding: 6 },
  title: { fontSize: 22, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 110, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    paddingVertical: 13,
    marginTop: 4,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  cancelLink: { alignItems: 'center', marginTop: 10 },
  cancelText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 8 },
  hint: { fontSize: 13.5 },
  productCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  productTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productName: { fontSize: 15, fontWeight: '700' },
  productMeta: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  iconBtn: { padding: 5 },
  stockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stockLabel: { fontSize: 13, fontWeight: '600' },
  stockControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stockValue: { fontSize: 16, fontWeight: '800', minWidth: 30, textAlign: 'center' },
  lowStock: { fontSize: 12.5, fontWeight: '700' },
});
