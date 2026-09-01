import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon, IconName } from '../../icons';
import { countLinksByCategory } from '../../db';
import { useTheme } from '../../theme';
import { LINK_CATEGORIES } from '../../links/categories';
import type { LinkCategory } from '../../types';

export function CategoriesScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  const load = useCallback(async () => {
    const rows = await countLinksByCategory();
    setCounts(Object.fromEntries(rows.map((r) => [r.category, r.count])));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  const data = LINK_CATEGORIES.map((c) => ({ ...c, count: counts?.[c.id] ?? 0 }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Categories</Text>
        {counts !== null && (
          <Text style={[styles.sub, { color: theme.sub }]}>
            {total} {total === 1 ? 'link' : 'links'}
          </Text>
        )}
      </View>

      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          counts === null ? null : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🗂️</Text>
              <Text style={[styles.emptyText, { color: theme.sub }]}>
                No links yet — saved links will be grouped by category here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('LinksCategory', { category: item.id as LinkCategory, title: item.label })
            }
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.card },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 },
            ]}>
            <View style={[styles.chip, { backgroundColor: `${item.color}26` }]}>
              <Icon name={item.icon as IconName} size={22} color={item.color} />
            </View>
            <Text style={[styles.cardLabel, { color: theme.text }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.cardCount, { color: theme.sub }]}>
              {item.count} {item.count === 1 ? 'link' : 'links'}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  sub: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  row: {
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  chip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardCount: {
    fontSize: 13,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 70,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});