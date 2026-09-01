import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { listCustomers, createCustomer, salesForCustomer, deleteCustomerCascade } from '../../db';
import { useTheme } from '../../theme';
import type { Customer } from '../../types';

export function CustomersScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  const load = useCallback(async () => {
    setCustomers(await listCustomers());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function add() {
    const n = name.trim();
    if (!n) {
      Alert.alert('Enter a name', 'What business is this?');
      return;
    }
    await createCustomer({ name: n, contact: contact.trim() });
    setName('');
    setContact('');
    setShowAdd(false);
    load();
  }

  function confirmDelete(c: Customer) {
    Alert.alert('Delete customer?', `${c.name} and all their sales will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteCustomerCascade(c.id);
            load();
          })(),
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {showAdd ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>New customer</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Business name"
              placeholderTextColor={theme.sub}
              style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
            />
            <TextInput
              value={contact}
              onChangeText={setContact}
              placeholder="Phone / email (optional)"
              placeholderTextColor={theme.sub}
              style={[styles.input, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
            />
            <Pressable onPress={() => void add()} style={[styles.primaryBtn, { backgroundColor: theme.accent }]}>
              <Icon name="check" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Save customer</Text>
            </Pressable>
            <Pressable onPress={() => setShowAdd(false)} style={styles.cancelLink}>
              <Text style={[styles.cancelText, { color: theme.sub }]}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowAdd(true)}
            style={[styles.addBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Icon name="add" size={20} color={theme.accent} />
            <Text style={[styles.addBarText, { color: theme.accent }]}>Add customer</Text>
          </Pressable>
        )}

        {customers.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>
            No customers yet. Add the businesses you sell to, then log sales against them.
          </Text>
        ) : (
          customers.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => navigation.navigate('BusinessCustomerDetail', { customerId: c.id })}
              style={[styles.customerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarText}>{c.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.customerName, { color: theme.text }]}>{c.name}</Text>
                {c.contact ? (
                  <Text style={[styles.customerContact, { color: theme.sub }]}>{c.contact}</Text>
                ) : null}
              </View>
              <Chevron theme={theme} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chevron({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return <Icon name="chevron-right" size={20} color={theme.sub} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 110, gap: 10 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, paddingVertical: 13 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  cancelLink: { alignItems: 'center', marginTop: 10 },
  cancelText: { fontSize: 13, fontWeight: '600' },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
  },
  addBarText: { fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 13.5 },
  customerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  customerName: { fontSize: 15, fontWeight: '700' },
  customerContact: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
});
