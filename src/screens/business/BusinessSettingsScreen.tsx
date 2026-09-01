import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Icon } from '../../icons';
import { getPref, setPref, listCustomers, listProducts, listSales } from '../../db';
import { useTheme } from '../../theme';
import { formatMoney } from '../../business/stats';
import type { BusinessCurrency, Customer, Product, Sale } from '../../types';

const CURRENCY_PREF_KEY = 'business_currency';

export async function getBusinessCurrency(): Promise<BusinessCurrency> {
  const stored = await getPref(CURRENCY_PREF_KEY);
  return stored === 'eur' ? 'eur' : 'czk';
}

export async function setBusinessCurrency(currency: BusinessCurrency): Promise<void> {
  await setPref(CURRENCY_PREF_KEY, currency);
}

function csvEscape(value: string | number): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function BusinessSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [currency, setCurrencyState] = useState<BusinessCurrency>('czk');

  useFocusEffect(
    useCallback(() => {
      void getBusinessCurrency().then(setCurrencyState);
    }, []),
  );

  async function setCurrency(c: BusinessCurrency) {
    setCurrencyState(c);
    await setBusinessCurrency(c);
  }

  async function exportCsv() {
    const [customers, products, sales] = await Promise.all([listCustomers(), listProducts(), listSales(100000)]);
    const customerById = new Map<number, Customer>(customers.map((c) => [c.id, c]));
    const productById = new Map<number, Product>(products.map((p) => [p.id, p]));

    const salesCsv = [
      'day,customer,product,quantity,unit_price,status,paid,notes',
      ...sales.map((s) => {
        const c = customerById.get(s.customer_id);
        const p = s.product_id != null ? productById.get(s.product_id) : undefined;
        return [
          csvEscape(s.day),
          csvEscape(c?.name ?? ''),
          csvEscape(p?.name ?? ''),
          s.quantity,
          s.unit_price_cents,
          csvEscape(s.status),
          s.paid_cents,
          csvEscape(s.notes),
        ].join(',');
      }),
    ].join('\n');

    const customersCsv = [
      'name,contact,notes',
      ...customers.map((c) => [csvEscape(c.name), csvEscape(c.contact), csvEscape(c.notes)].join(',')),
    ].join('\n');

    const productsCsv = [
      'name,cost_per_unit,sell_per_unit,on_hand',
      ...products.map((p) =>
        [csvEscape(p.name), p.cost_per_unit_cents, p.sell_per_unit_cents, p.quantity_on_hand].join(','),
      ),
    ].join('\n');

    const stamp = new Date().toISOString().slice(0, 10);
    const payload = [
      `=== BUSINESS SALES (exported ${new Date().toLocaleString()}, currency ${currency}) ===`,
      `TOTAL REVENUE: ${sales.reduce((s, x) => s + x.total_cents, 0)}`,
      `OUTSTANDING: ${sales.reduce((s, x) => s + Math.max(0, x.total_cents - x.paid_cents), 0)}`,
      '',
      '--- CUSTOMERS ---',
      customersCsv,
      '',
      '--- PRODUCTS ---',
      productsCsv,
      '',
      '--- SALES ---',
      salesCsv,
    ].join('\n');

    try {
      const filename = `business-export-${stamp}.csv`;
      if (await Sharing.isAvailableAsync()) {
        const file = new File(Paths.cache, filename);
        file.write(payload);
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export business data',
        });
      } else {
        Alert.alert('Export', 'Sharing is not available on this device.');
      }
    } catch {
      Alert.alert('Export failed', 'Could not write the export file.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Business Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionLabel, { color: theme.sub }]}>CURRENCY</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardSub, { color: theme.sub }]}>
            Choose how money is displayed across the Business app. Sales are always stored as numbers
            — changing currency just changes how they are shown.
          </Text>
          <View style={styles.chipRow}>
            {(['czk', 'eur'] as BusinessCurrency[]).map((c) => {
              const active = currency === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? theme.accent : theme.chipBg, borderColor: active ? theme.accent : theme.border },
                  ]}>
                  <Text style={[styles.chipText, { color: active ? '#FFFFFF' : theme.sub }]}>
                    {c === 'czk' ? 'CZK · Kč' : 'EUR · €'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.preview, { color: theme.sub }]}>
            Preview: {formatMoney(123456, currency)}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>EXPORT</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardSub, { color: theme.sub }]}>
            Download your customers, products and sales as a CSV file you can open in a spreadsheet.
          </Text>
          <Pressable onPress={() => void exportCsv()} style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
            <Icon name="download" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Export CSV</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>BACKUP</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardSub, { color: theme.sub }]}>
            Business data is included in the main Backup in Settings. Export a full backup there to
            restore everything on a new device.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('SettingsApp')}
            style={[styles.secondaryBtn, { backgroundColor: theme.chipBg }]}>
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Open main Settings</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 22, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 110, gap: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 6 },
  cardSub: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  chipText: { fontSize: 14, fontWeight: '700' },
  preview: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    paddingVertical: 13,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
});
