import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { getBudgetPrefs, saveBudgetPrefs } from '../../db';
import { useTheme } from '../../theme';

const PRESETS = [1000, 1500, 2000, 3000, 5000];

export function BudgetSettingsScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [input, setInput] = useState('');

  const load = useCallback(async () => {
    const prefs = await getBudgetPrefs();
    if (prefs.monthly_budget_cents != null) {
      setInput(String((Math.round(prefs.monthly_budget_cents / 100) / 1).toFixed(0)));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function save() {
    const cleaned = input.replace(/[^0-9.]/g, '');
    const value = parseFloat(cleaned);
    if (Number.isNaN(value) || value <= 0) {
      Alert.alert('Enter a budget', 'Type a monthly budget in dollars.');
      return;
    }
    await saveBudgetPrefs({ monthly_budget_cents: Math.round(value * 100) });
    navigation.goBack();
  }

  function applyPreset(dollars: number) {
    setInput(String(dollars));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.sub} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Budget settings</Text>
        <Icon name="shopping-cart" size={22} color={theme.accent} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.sub }]}>MONTHLY SPENDING BUDGET</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: theme.sub }]}>$</Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="0"
              placeholderTextColor={theme.sub}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: theme.text }]}
            />
          </View>
          <View style={styles.chipWrap}>
            {PRESETS.map((p) => (
              <Pressable
                key={p}
                onPress={() => applyPreset(p)}
                style={[styles.chip, { backgroundColor: theme.chipBg }]}>
                <Text style={[styles.chipText, { color: theme.sub }]}>${p.toLocaleString()}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.hint, { color: theme.sub }]}>
            The budget is per calendar month. You'll see a progress ring on the Spending tab.
          </Text>
        </View>

        <Pressable
          onPress={() => void save().catch(() => Alert.alert('Save failed', 'Something went wrong.'))}
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, marginTop: 8, marginBottom: 12 },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: '800', flex: 1 },
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  settingLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currency: { fontSize: 28, fontWeight: '800' },
  amountInput: { fontSize: 34, fontWeight: '800', flex: 1 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 12.5, marginTop: 12, lineHeight: 17 },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },
});
