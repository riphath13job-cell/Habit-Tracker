import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../icons';
import { useFocusEffect } from '@react-navigation/native';
import type { LucidPrefs } from '../../types';
import { getLucidPrefs, saveLucidPrefs } from '../../db';
import { requestNotificationPermission, syncLucidReminder } from '../../notifications';
import { useTheme } from '../../theme';

const RC_METHODS: Array<{ icon: IconName; name: string; how: string; why: string }> = [
  {
    icon: 'air',
    name: 'Nose pinch',
    how: 'Pinch your nose shut and try to breathe in.',
    why: 'In dreams you keep breathing anyway — instant giveaway.',
  },
  {
    icon: 'back-hand',
    name: 'Finger through palm',
    how: 'Press the index finger of one hand into the other palm.',
    why: 'Dream hands often let fingers pass straight through.',
  },
  {
    icon: 'menu-book',
    name: 'Re-read text',
    how: 'Read a sentence, look away, read it again.',
    why: 'Dream text morphs on the second look.',
  },
  {
    icon: 'schedule',
    name: 'Check the clock',
    how: 'Look at a digital clock or watch twice.',
    why: 'Numbers scramble and jump in dreams.',
  },
];

const OPTIONS = [0, 4, 6, 8] as const;

export function ChecksScreen() {
  const theme = useTheme();
  const [prefs, setPrefs] = useState<LucidPrefs>({ rc_per_day: 0, notification_id: null });

  useFocusEffect(
    useCallback(() => {
      void getLucidPrefs().then(setPrefs);
    }, []),
  );

  async function setPerDay(n: number) {
    if (n > 0) await requestNotificationPermission();
    const prefs = await getLucidPrefs();
    await saveLucidPrefs({ ...prefs, rc_per_day: n });
    await syncLucidReminder();
    setPrefs(await getLucidPrefs());
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Reality Checks</Text>
        <Text style={[styles.subtitle, { color: theme.sub }]}>
          A reality check is a 5-second test that answers “am I dreaming?” honestly. Run them all day and the habit follows you into your dreams — where it fails loudly.
        </Text>

        {RC_METHODS.map((m) => (
          <View key={m.name} style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.chipBg }]}>
              <Icon name={m.icon} size={22} color="#A78BFA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodName, { color: theme.text }]}>{m.name}</Text>
              <Text style={[styles.methodHow, { color: theme.text }]}>{m.how}</Text>
              <Text style={[styles.methodWhy, { color: theme.sub }]}>{m.why}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>MEAN IT</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Icon name="psychology" size={20} color="#FBBF24" />
          <Text style={[styles.bodyText, { color: theme.text, flex: 1 }]}>
            Don’t autopilot through checks. Really ask “could this be a dream?” — half-hearted checks train your dream self to be half-hearted too. Anchor checks to doorways, your phone, and waking up.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>DAILY REMINDERS</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.reminderTitle, { color: theme.text }]}>Reality-check nudges per day</Text>
          <View style={styles.optionRow}>
            {OPTIONS.map((n) => (
              <Pressable
                key={n}
                onPress={() => void setPerDay(n)}
                style={[
                  styles.optionChip,
                  { backgroundColor: theme.chipBg },
                  prefs.rc_per_day === n && { backgroundColor: '#7C3AED' },
                ]}>
                <Text
                  style={[
                    styles.optionChipText,
                    { color: prefs.rc_per_day === n ? '#FFFFFF' : theme.sub },
                  ]}>
                  {n === 0 ? 'Off' : n}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.reminderHint, { color: theme.sub }]}>
            {prefs.rc_per_day === 0
              ? 'Nudges are off.'
              : `${prefs.rc_per_day} gentle nudges spread across ${prefs.rc_per_day === 1 ? 'the day' : '9 AM – 9 PM'}: “Are you dreaming?”`}
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
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  card: { borderRadius: 18, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  methodHow: { fontSize: 13.5, lineHeight: 19 },
  methodWhy: { fontSize: 12.5, marginTop: 3 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 14 },
  bodyText: { fontSize: 13.5, lineHeight: 20 },
  reminderTitle: { fontSize: 15.5, fontWeight: '700', marginBottom: 12 },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionChip: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  optionChipText: { fontWeight: '800', fontSize: 15 },
  reminderHint: { fontSize: 12.5, marginTop: 12, lineHeight: 17 },
});
