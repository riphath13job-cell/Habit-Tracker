import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import { useNavigation } from '@react-navigation/native';
import { TECHNIQUES, type Technique } from '../../lucid/techniques';
import { useTheme } from '../../theme';

function diffColor(name: Technique['difficulty'], theme: ReturnType<typeof useTheme>): string {
  if (name === 'Beginner') return theme.good;
  if (name === 'Intermediate') return '#FBBF24';
  return theme.danger;
}

export function LearnScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const foundations = TECHNIQUES.filter((t) => t.category === 'foundation');
  const inductions = TECHNIQUES.filter((t) => t.category === 'induction');

  function section(title: string, sub: string, items: Technique[]) {
    return (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.sub }]}>{title.toUpperCase()}</Text>
        <Text style={[styles.sectionSub, { color: theme.sub }]}>{sub}</Text>
        {items.map((t) => {
          const dc = diffColor(t.difficulty, theme);
          return (
            <Pressable
              key={t.key}
              onPress={() => navigation.navigate('TechniqueDetail', { key: t.key })}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.card },
                pressed && { opacity: 0.7 },
              ]}
              android_ripple={{ color: theme.border }}>
              <View style={styles.cardTop}>
                <Text style={[styles.cardName, { color: theme.text }]}>{t.name}</Text>
                <View style={[styles.diffChip, { backgroundColor: `${dc}22` }]}>
                  <Text style={[styles.diffText, { color: dc }]}>{t.difficulty}</Text>
                </View>
              </View>
              <Text style={[styles.cardSub, { color: theme.text }]} numberOfLines={1}>
                {t.full ?? t.bestFor}
              </Text>
              <Text style={[styles.cardSummary, { color: theme.sub }]} numberOfLines={2}>
                {t.summary}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Lucid Academy</Text>
        <Text style={[styles.subtitle, { color: theme.sub }]}>
          Every proven technique, step by step.
        </Text>
        {section('Foundations', 'Master recall and awareness first.', foundations)}
        {section('Induction techniques', 'Methods that trigger lucidity.', inductions)}
        <View style={styles.footer}>
          <Icon name="nights-stay" size={18} color={theme.sub} />
          <Text style={[styles.footerText, { color: theme.sub }]}>
            Start with journaling + reality checks, add MILD after WBTB.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 110, gap: 10 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 16 },
  sectionSub: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 18, padding: 16, marginTop: 10, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardName: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  diffChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  diffText: { fontSize: 11, fontWeight: '700' },
  cardSub: { fontSize: 13, fontWeight: '600', opacity: 0.85 },
  cardSummary: { fontSize: 13, lineHeight: 19 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, paddingHorizontal: 4 },
  footerText: { fontSize: 12.5, flex: 1, lineHeight: 18 },
});
