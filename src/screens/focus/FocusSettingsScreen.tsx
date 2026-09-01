import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { FocusPrefs } from '../../types';
import { getFocusPrefs, saveFocusPrefs, setFocusNotificationId } from '../../db';
import {
  cancelScheduledNotification,
  requestNotificationPermission,
} from '../../notifications';
import { useTheme } from '../../theme';

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.settingRow}>
      <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
          <Icon name="remove" size={18} color={theme.text} />
        </Pressable>
        <Text style={[styles.stepValue, { color: theme.text }]}>
          {value}
          {unit}
        </Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + step))}
          style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
          <Icon name="add" size={18} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

export function FocusSettingsScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [work, setWork] = useState(25);
  const [short, setShort] = useState(5);
  const [long, setLong] = useState(15);
  const [beforeLong, setBeforeLong] = useState(4);
  const [notify, setNotify] = useState(true);

  const load = useCallback(async () => {
    const stored = await getFocusPrefs();
    setWork(stored.work_minutes);
    setShort(stored.short_break);
    setLong(stored.long_break);
    setBeforeLong(stored.sessions_before_long);
    setNotify(stored.notify_on_end === 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function save() {
    const prefs: FocusPrefs = {
      work_minutes: work,
      short_break: short,
      long_break: long,
      sessions_before_long: beforeLong,
      notify_on_end: notify ? 1 : 0,
      notification_id: null,
    };
    if (notify) {
      await requestNotificationPermission();
    } else {
      const current = await getFocusPrefs();
      if (current.notification_id) {
        await cancelScheduledNotification(current.notification_id);
      }
      await setFocusNotificationId(null);
    }
    await saveFocusPrefs(prefs);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.sub} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Focus settings</Text>
        <Icon name="alarm" size={22} color={theme.accent} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardHeading, { color: theme.sub }]}>TIMING</Text>
          <Stepper label="Focus length" value={work} onChange={setWork} min={1} max={120} step={5} unit=" min" />
          <Stepper label="Short break" value={short} onChange={setShort} min={1} max={60} step={1} unit=" min" />
          <Stepper label="Long break" value={long} onChange={setLong} min={5} max={90} step={5} unit=" min" />
          <Stepper
            label="Sessions before long break"
            value={beforeLong}
            onChange={setBeforeLong}
            min={2}
            max={8}
            step={1}
            unit=""
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.notifyRow}>
            <Icon name="notifications" size={20} color={notify ? theme.accent : theme.sub} />
            <Text style={[styles.notifyText, { color: theme.text }]}>Notify when a session ends</Text>
            <Switch
              value={notify}
              onValueChange={setNotify}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={[styles.hint, { color: theme.sub }]}>
            Fires a notification (on your phone) when the current focus block finishes.
          </Text>
        </View>

        <Pressable
          onPress={() =>
            void save().catch(() => Alert.alert('Save failed', 'Something went wrong saving your settings.'))
          }
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: '800', flex: 1 },
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  cardHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingLabel: { fontSize: 14.5, fontWeight: '700', flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 15.5, fontWeight: '800', minWidth: 48, textAlign: 'center' },
  notifyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifyText: { flex: 1, fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12.5, marginTop: 8, lineHeight: 17 },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },
});
