import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { TEMPLATES, TEMPLATE_CATEGORIES, type LooksmaxxingTemplate } from '../../looksmaxxing/templates';
import { useTheme } from '../../theme';

const CATEGORY_EMOJI: Record<string, string> = {
  Morning: '🌅',
  Night: '🌙',
  Posture: '🧍',
  Skincare: '🧴',
  Hair: '💇',
  Eyes: '👁️',
  Fitness: '💪',
  Smile: '😁',
  Grooming: '✂️',
  Style: '👔',
  Hydration: '💧',
  Sleep: '🛌',
};

export function TemplatesScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [category, setCategory] = useState('All');

  const filtered = useMemo(
    () => (category === 'All' ? TEMPLATES : TEMPLATES.filter((t) => t.category === category)),
    [category],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Templates</Text>
          <Text style={[styles.subtitle, { color: theme.sub }]}>
            Ready-made routines · one tap into Routines
          </Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.key}
        style={styles.list}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <FlatList
              horizontal
              data={['All', ...TEMPLATE_CATEGORIES]}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setCategory(item)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: category === item ? theme.accent : theme.chipBg },
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: category === item ? '#FFFFFF' : theme.sub },
                    ]}>
                    {item === 'All' ? `All (${TEMPLATES.length})` : `${CATEGORY_EMOJI[item] ?? ''} ${item}`}
                  </Text>
                </Pressable>
              )}
            />
            <Text style={[styles.hint, { color: theme.sub }]}>
              Each template can be added to your daily Routines — you'll jump straight there, pre-filled.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TemplateRow theme={theme} template={item} onPress={() => navigation.navigate('TemplateDetail', { key: item.key })} />
        )}
      />
    </SafeAreaView>
  );
}

function TemplateRow({
  theme,
  template,
  onPress,
}: {
  theme: ReturnType<typeof useTheme>;
  template: LooksmaxxingTemplate;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.templateCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={[styles.templateBadge, { backgroundColor: theme.chipBg }]}>
        <Text style={styles.templateEmoji}>{template.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.templateTitleRow}>
          <Text style={[styles.templateTitle, { color: theme.text }]} numberOfLines={1}>
            {template.name}
          </Text>
          <Text style={[styles.templateCategory, { color: theme.accent }]}>{template.category}</Text>
        </View>
        <Text style={[styles.templateMeta, { color: theme.sub }]} numberOfLines={2}>
          {template.description}
        </Text>
        <Text style={[styles.templateCount, { color: theme.sub }]}>{template.items.length} daily items</Text>
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
  hint: {
    fontSize: 11.5,
    marginTop: 10,
    marginBottom: 2,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  templateBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateEmoji: {
    fontSize: 24,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  templateCategory: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  templateMeta: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  templateCount: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
});