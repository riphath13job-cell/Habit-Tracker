import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import {
  CATEGORY_COLORS,
  CATEGORY_ORDER,
  CATEGORY_EMOJI,
  DISCLAIMER,
  METHODS,
  type LooksmaxxingMethod,
  type StudyCategory,
} from '../../looksmaxxing/study';
import { useTheme } from '../../theme';

export function StudyScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<StudyCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return METHODS.filter((m) => {
      if (category !== 'all' && m.category !== category) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags.some((t) => t.includes(q))
      );
    });
  }, [query, category]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Looksmaxxing Study</Text>
          <Text style={[styles.subtitle, { color: theme.sub }]}>
            {METHODS.length} evidence-informed methods · one place
          </Text>
        </View>
        <View style={[styles.headerCount, { backgroundColor: theme.chipBg }]}>
          <Text style={[styles.headerCountText, { color: theme.accent }]}>{filtered.length}</Text>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.chipBg }]}>
        <Icon name="search" size={20} color={theme.sub} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search methods…"
          placeholderTextColor={theme.sub}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <FlatList
              horizontal
              data={[{ key: 'all' as const, label: 'All' }, ...CATEGORY_ORDER.map((c) => ({ key: c, label: `${CATEGORY_EMOJI[c]} ${c}` }))]}
              keyExtractor={(item) => item.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setCategory(item.key)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: category === item.key ? CATEGORY_COLORS[item.key as StudyCategory] ?? theme.accent : theme.chipBg },
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: category === item.key ? '#FFFFFF' : theme.sub },
                    ]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
            <Text style={[styles.disclaimer, { color: theme.sub }]}>{DISCLAIMER}</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.sub }]}>No methods match your search.</Text>
        }
        renderItem={({ item }) => <MethodRow theme={theme} method={item} onPress={() => navigation.navigate('MethodDetail', { key: item.key })} />}
      />
    </SafeAreaView>
  );
}

function MethodRow({
  theme,
  method,
  onPress,
}: {
  theme: ReturnType<typeof useTheme>;
  method: LooksmaxxingMethod;
  onPress: () => void;
}) {
  const color = CATEGORY_COLORS[method.category];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.methodCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={[styles.methodBadge, { backgroundColor: theme.chipBg }]}>
        <Text style={styles.methodEmoji}>{method.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.methodTitleRow}>
          <Text style={[styles.methodTitle, { color: theme.text }]} numberOfLines={1}>
            {method.title}
          </Text>
          <View style={[styles.difficultyPill, { borderColor: color }]}>
            <Text style={[styles.difficultyPillText, { color }]}>{method.difficulty}</Text>
          </View>
        </View>
        <Text style={[styles.methodMeta, { color: theme.sub }]} numberOfLines={1}>
          {method.category} · {method.resultsIn}
        </Text>
      </View>
      <Icon name="chevron-right" size={22} color={theme.sub} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 1,
  },
  headerCount: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerCountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 10,
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11.5,
    marginTop: 12,
    marginBottom: 2,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  methodBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodEmoji: {
    fontSize: 22,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  difficultyPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  difficultyPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  methodMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});