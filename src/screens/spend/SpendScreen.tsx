import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { Transaction } from '../../types';
import {
  createTransaction,
  deleteTransaction,
  getBudgetPrefs,
  getTransactionsBetween,
} from '../../db';
import { todayKey } from '../../date-utils';
import { useTheme } from '../../theme';
import { ProgressRing } from '../../components/ProgressRing';
import {
  DEFAULT_CATEGORIES,
  currentMonthKey,
  formatMoney,
  monthRange,
  shiftMonth,
  totalSpent,
} from '../../spend/stats';

export function SpendScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [budgetCents, setBudgetCents] = useState<number | null>(null);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');

  const range = useMemo(() => monthRange(monthKey), [monthKey]);

  const load = useCallback(async () => {
    const [transactions, prefs] = await Promise.all([
      getTransactionsBetween(range.start, range.end),
      getBudgetPrefs(),
    ]);
    setTxs(transactions);
    setBudgetCents(prefs.monthly_budget_cents);
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const spent = totalSpent(txs);
  const budget = budgetCents ?? 0;
  const over = budget > 0 && spent > budget;
  const progress = budget > 0 ? spent / budget : 0;

  async function add() {
    const abs = parseAmount(amount);
    if (abs == null || abs === 0) {
      Alert.alert('Enter an amount', 'Type an amount like 12.50.');
      return;
    }
    const isIncome = category === 'Income';
    await createTransaction({
      amount_cents: isIncome ? -abs : abs,
      category,
      note: note.trim(),
      day: todayKey(),
    });
    setAmount('');
    setNote('');
    setCategory('Food');
    load();
  }

  function confirmDelete(t: Transaction) {
    Alert.alert('Delete transaction?', `${formatMoney(t.amount_cents)} · ${t.note || t.category}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteTransaction(t.id);
            load();
          })(),
      },
    ]);
  }

  const isCurrentMonth = monthKey === currentMonthKey();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Spending</Text>
        <Pressable onPress={() => navigation.navigate('BudgetSettings')} hitSlop={8} style={styles.gearBtn}>
          <Icon name="settings" size={22} color={theme.sub} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => setMonthKey(shiftMonth(monthKey, -1))} hitSlop={8} style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
            <Icon name="chevron-left" size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{range.label}</Text>
          <Pressable
            onPress={() => setMonthKey(shiftMonth(monthKey, 1))}
            disabled={isCurrentMonth}
            hitSlop={8}
            style={[styles.stepBtn, { backgroundColor: isCurrentMonth ? theme.chipBg : theme.accent, opacity: isCurrentMonth ? 0.35 : 1 }]}>
            <Icon name="chevron-right" size={18} color={isCurrentMonth ? theme.text : '#FFFFFF'} />
          </Pressable>
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ProgressRing
            size={180}
            stroke={13}
            progress={over ? 1 : progress}
            label={formatMoney(spent)}
            sub={budget > 0 ? `of ${formatMoney(budget)}` : 'no budget set'}
            color={over ? theme.danger : theme.accent}
            trackColor={theme.chipBg}
            textColor={theme.text}
          />
          <Text style={[styles.heroSub, { color: theme.sub }]}>
            {budget > 0
              ? over
                ? `${formatMoney(spent - budget)} over budget`
                : `${formatMoney(budget - spent)} left this month`
              : 'Set a monthly budget in settings'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Add transaction</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: theme.sub }]}>$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.sub}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: theme.text }]}
            />
          </View>

          <View style={styles.catWrap}>
            {DEFAULT_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: category === c ? theme.accent : theme.chipBg,
                    borderColor: category === c ? theme.accent : theme.border,
                  },
                ]}>
                <Text style={[styles.catText, { color: category === c ? '#FFFFFF' : theme.sub }]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional)"
            placeholderTextColor={theme.sub}
            style={[styles.noteInput, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
          />

          <Pressable onPress={() => void add()} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
            <Icon name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {range.label} · {txs.length} item{txs.length === 1 ? '' : 's'}
        </Text>
        {txs.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>No transactions this month yet.</Text>
        ) : (
          txs.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => confirmDelete(t)}
              style={[styles.txCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.txDot, { backgroundColor: t.amount_cents > 0 ? theme.danger : theme.good }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.txNote, { color: theme.text }]}>{t.note || t.category}</Text>
                <Text style={[styles.txCat, { color: theme.sub }]}>{t.category}</Text>
              </View>
              <Text style={[styles.txAmount, { color: t.amount_cents > 0 ? theme.text : theme.good }]}>
                {t.amount_cents > 0 ? `-${formatMoney(t.amount_cents)}` : `+${formatMoney(Math.abs(t.amount_cents))}`}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 6,
  },
  title: { fontSize: 24, fontWeight: '800' },
  gearBtn: { padding: 6 },
  content: { padding: 20, paddingBottom: 110, gap: 14 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  monthLabel: { fontSize: 16, fontWeight: '800', minWidth: 130, textAlign: 'center' },
  stepBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  heroCard: { borderRadius: 20, borderWidth: 1, alignItems: 'center', paddingVertical: 18 },
  heroSub: { fontSize: 13, fontWeight: '600', marginTop: 10 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  currency: { fontSize: 28, fontWeight: '800' },
  amountInput: { fontSize: 34, fontWeight: '800', flex: 1 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  catText: { fontSize: 13, fontWeight: '700' },
  noteInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 12 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 13,
    paddingVertical: 13,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 6 },
  hint: { fontSize: 13.5 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  txDot: { width: 9, height: 9, borderRadius: 5 },
  txNote: { fontSize: 14.5, fontWeight: '700' },
  txCat: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  txAmount: { fontSize: 15, fontWeight: '800' },
});
