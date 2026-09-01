import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TECHNIQUE_BY_KEY, type Technique } from '../../lucid/techniques';
import { useTheme } from '../../theme';

function diffColor(name: Technique['difficulty'], theme: ReturnType<typeof useTheme>): string {
  if (name === 'Beginner') return theme.good;
  if (name === 'Intermediate') return '#FBBF24';
  return theme.danger;
}

export function TechniqueDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const technique = TECHNIQUE_BY_KEY[route.params?.key];
  if (!technique) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
        <Text style={{ color: theme.text, padding: 20 }}>Technique not found.</Text>
      </SafeAreaView>
    );
  }
  const dc = diffColor(technique.difficulty, theme);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
            <Icon name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <View style={[styles.catChip, { backgroundColor: theme.chipBg }]}>
            <Text style={[styles.catText, { color: theme.sub }]}>
              {technique.category === 'foundation' ? 'Foundation' : 'Induction'}
            </Text>
          </View>
          <View style={[styles.catChip, { backgroundColor: `${dc}22` }]}>
            <Text style={[styles.catText, { color: dc }]}>{technique.difficulty}</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{technique.name}</Text>
        {technique.full ? (
          <Text style={[styles.fullTitle, { color: theme.sub }]}>{technique.full}</Text>
        ) : null}
        <Text style={[styles.bestFor, { color: theme.text }]}>Best for: {technique.bestFor}</Text>

        <View style={[styles.block, { backgroundColor: theme.card }]}>
          <Text style={[styles.blockTitle, { color: theme.sub }]}>THE IDEA</Text>
          <Text style={[styles.bodyText, { color: theme.text }]}>{technique.summary}</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>HOW TO PRACTICE</Text>
        <View style={[styles.block, { backgroundColor: theme.card }]}>
          {technique.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: theme.chipBg }]}>
                <Text style={[styles.stepNumText, { color: theme.accent }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.bodyText, { color: theme.text, flex: 1 }]}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>TIPS</Text>
        <View style={[styles.block, { backgroundColor: theme.card }]}>
          {technique.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Icon name="lightbulb" size={16} color="#FBBF24" />
              <Text style={[styles.bodyText, { color: theme.text, flex: 1 }]}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 48, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  catText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', marginTop: 8 },
  fullTitle: { fontSize: 13, fontWeight: '600', marginTop: -4 },
  bestFor: { fontSize: 13.5, lineHeight: 19, opacity: 0.85 },
  block: { borderRadius: 18, padding: 16, gap: 10 },
  blockTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 8 },
  bodyText: { fontSize: 14.5, lineHeight: 21 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontSize: 13, fontWeight: '800' },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
});
