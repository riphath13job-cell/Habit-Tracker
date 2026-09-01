import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Icon, IconName } from '../../icons';
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJI,
  getMethod,
  type LooksmaxxingMethod,
} from '../../looksmaxxing/study';
import { importMethodAsRoutine, openNotes, openRoutine, saveTemplateAsNote } from '../../looksmaxxing/import';
import { useTheme } from '../../theme';

export function MethodDetailScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const method: LooksmaxxingMethod | undefined = getMethod(route.params?.key as string);
  const [busy, setBusy] = useState(false);

  if (!method) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const color = CATEGORY_COLORS[method.category];

  async function addToRoutines() {
    if (!method || busy) return;
    setBusy(true);
    try {
      const result = await importMethodAsRoutine(method);
      Alert.alert(
        result.created ? 'Added to Routines' : 'Already in Routines',
        result.created
          ? `“${method.title}” is now a daily routine.`
          : `“${method.title}” already exists as a routine — opening it.`,
        [{ text: 'Open', onPress: () => openRoutine(result.id) }, { text: 'Close', style: 'cancel' }],
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!method || busy) return;
    setBusy(true);
    try {
      const template = {
        key: method.key,
        emoji: method.emoji,
        name: method.title,
        category: method.category,
        description: method.description,
        items: method.steps,
        notes: method.tip ? `Tip: ${method.tip}` : '',
      };
      const note = await saveTemplateAsNote(template);
      Alert.alert('Saved to Notes', `“${method.title}” was saved as a note.`, [
        { text: 'Open Notes', onPress: () => openNotes() },
        { text: 'Close', style: 'cancel' },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <Icon name="chevron-left" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{method.category}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.badge, { backgroundColor: theme.chipBg }]}>
          <Text style={styles.badgeEmoji}>{method.emoji}</Text>
        </View>
        <View style={[styles.categoryPill, { backgroundColor: color }]}>
          <Text style={styles.categoryPillText}>
            {CATEGORY_EMOJI[method.category]} {method.category}
          </Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{method.title}</Text>
        <Text style={[styles.description, { color: theme.sub }]}>{method.description}</Text>

        <View style={[styles.metaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MetaRow icon="schedule" label="Frequency" value={method.frequency} theme={theme} />
          <MetaRow icon="signal-cellular-alt" label="Difficulty" value={method.difficulty} theme={theme} />
          <MetaRow icon="flag" label="Results in" value={method.resultsIn} theme={theme} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>How to do it</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {method.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: color }]}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
            </View>
          ))}
        </View>

        {method.tip ? (
          <View style={[styles.tipBox, { backgroundColor: theme.chipBg }]}>
            <Text style={[styles.tipLabel, { color: theme.accent }]}>Tip</Text>
            <Text style={[styles.tipText, { color: theme.text }]}>{method.tip}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={addToRoutines}
          disabled={busy}
          style={[styles.primaryButton, { backgroundColor: color, opacity: busy ? 0.6 : 1 }]}>
          <Icon name="sync" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Add as daily routine</Text>
        </Pressable>
        <Pressable
          onPress={saveNote}
          disabled={busy}
          style={[styles.secondaryButton, { borderColor: theme.border, opacity: busy ? 0.6 : 1 }]}>
          <Icon name="notes" size={20} color={theme.accent} />
          <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Save to Notes</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: IconName;
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size={18} color={theme.accent} style={styles.metaIcon} />
      <Text style={[styles.metaLabel, { color: theme.sub }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: theme.text, flexShrink: 1, textAlign: 'right' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 60,
    alignItems: 'center',
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgeEmoji: {
    fontSize: 38,
  },
  categoryPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  categoryPillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  metaCard: {
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  metaIcon: {
    marginRight: 10,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 90,
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  tipBox: {
    alignSelf: 'stretch',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 4,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  primaryButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 13,
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});