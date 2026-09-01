import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { LinkCategory, LinkItem } from '../../types';
import { listLinks } from '../../db';
import { useTheme } from '../../theme';
import { hostOf, LINK_CATEGORIES } from '../../links/categories';
import { LinkRow } from './LinkRow';

interface LinksScreenParams {
  favoriteOnly?: boolean;
  title?: string;
  initialCategory?: LinkCategory;
}

export function LinksScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<Record<string, LinksScreenParams>, string>>();
  const navigation = useNavigation<any>();
  const params = route.params ?? {};
  const favoriteOnly = params.favoriteOnly === true;
  const [links, setLinks] = useState<LinkItem[] | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LinkCategory | null>(params.initialCategory ?? null);

  const load = useCallback(async () => {
    setLinks(await listLinks(favoriteOnly));
  }, [favoriteOnly]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => {
    let items = links ?? [];
    if (category) {
      items = items.filter((l) => l.category === category);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          hostOf(l.url).includes(q) ||
          l.note.toLowerCase().includes(q),
      );
    }
    return items;
  }, [links, category, query]);

  const title = params.title ?? (favoriteOnly ? 'Favorites' : 'Links');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Pressable
          onPress={() => navigation.navigate('AddLink', {})}
          style={[styles.newButton, { backgroundColor: theme.accent }]}>
          <Icon name="add" size={22} color="#FFFFFF" />
          <Text style={styles.newButtonText}>Add</Text>
        </Pressable>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.card }]}>
        <Icon name="search" size={18} color={theme.sub} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search links…"
          placeholderTextColor={theme.sub}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {query !== '' && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Icon name="close" size={18} color={theme.sub} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipScroll}>
        <Chip
          label="All"
          active={category === null}
          onPress={() => setCategory(null)}
          theme={theme}
        />
        {LINK_CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            icon={c.icon}
            iconColor={c.color}
            active={category === c.id}
            onPress={() => setCategory(category === c.id ? null : c.id)}
            theme={theme}
          />
        ))}
      </ScrollView>

      <FlatList
        data={visible}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          links === null ? null : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🔗</Text>
              <Text style={[styles.emptyText, { color: theme.sub }]}>
                {links.length === 0
                  ? favoriteOnly
                    ? 'No favorites yet — star a link to keep it here.'
                    : 'No links saved yet — tap "Add" to save your first one.'
                  : 'No links match that filter.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <LinkRow
            link={item}
            onChanged={load}
            onEdit={(link) => navigation.navigate('AddLink', { id: link.id })}
          />
        )}
      />
    </SafeAreaView>
  );
}

function Chip({
  label,
  icon,
  iconColor,
  active,
  onPress,
  theme,
}: {
  label: string;
  icon?: Parameters<typeof Icon>[0]['name'];
  iconColor?: string;
  active: boolean;
  onPress: () => void;
  theme: { accent: string; card: string; text: string; sub: string };
}) {
  const fg = active ? '#FFFFFF' : theme.sub;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? { backgroundColor: theme.accent } : { backgroundColor: theme.card }]}>
      {icon ? <Icon name={icon} size={15} color={active ? '#FFFFFF' : iconColor} /> : null}
      <Text style={[styles.chipLabel, { color: fg }]}>{label}</Text>
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
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  chipScroll: {
    marginTop: 12,
  },
  chips: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 110,
    paddingTop: 14,
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