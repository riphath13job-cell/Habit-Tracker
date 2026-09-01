import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Icon } from '../../icons';
import { getTemplate, type LooksmaxxingTemplate } from '../../looksmaxxing/templates';
import { importTemplateAsRoutine, openNotes, openRoutine, saveTemplateAsNote } from '../../looksmaxxing/import';
import { useTheme } from '../../theme';

export function TemplateDetailScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const template: LooksmaxxingTemplate | undefined = getTemplate(route.params?.key as string);
  const [busy, setBusy] = useState(false);

  if (!template) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  async function addToRoutines() {
    if (!template || busy) return;
    setBusy(true);
    try {
      const result = await importTemplateAsRoutine(template);
      Alert.alert(
        result.created ? 'Added to Routines' : 'Already in Routines',
        result.created
          ? `“${template.name}” is now a daily routine with ${template.items.length} items.`
          : `You already have “${template.name}” — opening the existing one.`,
        [
          { text: 'Open Routine', onPress: () => openRoutine(result.id) },
          { text: 'Close', style: 'cancel' },
        ],
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!template || busy) return;
    setBusy(true);
    try {
      const note = await saveTemplateAsNote(template);
      Alert.alert('Saved to Notes', `“${template.name}” was saved as a note.`, [
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Template</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.badge, { backgroundColor: theme.chipBg }]}>
          <Text style={styles.badgeEmoji}>{template.emoji}</Text>
        </View>
        <View style={[styles.categoryPill, { backgroundColor: theme.accent }]}>
          <Text style={styles.categoryPillText}>{template.category} template</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{template.name}</Text>
        <Text style={[styles.description, { color: theme.sub }]}>{template.description}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily items</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {template.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: theme.accent }]}>
                <Icon name="check" size={13} color="#FFFFFF" />
              </View>
              <Text style={[styles.itemText, { color: theme.text }]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.notesBox, { backgroundColor: theme.chipBg }]}>
          <Text style={[styles.notesLabel, { color: theme.accent }]}>Why this works</Text>
          <Text style={[styles.notesText, { color: theme.text }]}>{template.notes}</Text>
        </View>

        <Pressable
          onPress={addToRoutines}
          disabled={busy}
          style={[styles.primaryButton, { backgroundColor: theme.accent, opacity: busy ? 0.6 : 1 }]}>
          <Icon name="sync" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Add to my Routines</Text>
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
    marginBottom: 4,
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  notesBox: {
    alignSelf: 'stretch',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
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