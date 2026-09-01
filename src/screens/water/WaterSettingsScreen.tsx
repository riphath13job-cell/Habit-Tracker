import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { WaterPrefs } from '../../types';
import { getWaterPrefs, saveWaterPrefs } from '../../db';
import { formatReminder } from '../../date-utils';
import { requestNotificationPermission, syncWaterReminder } from '../../notifications';
import { useTheme } from '../../theme';

const TARGET_PRESETS = [2000, 2500, 3000, 3500];
const START_CHOICES = [7 * 60, 8 * 60, 9 * 60, 10 * 60];
const END_CHOICES = [19 * 60, 20 * 60, 21 * 60, 22 * 60];
const INTERVAL_CHOICES = [60, 90, 120];

function nudgeCount(start: number | null, end: number | null, interval: number | null): number {
  if (start == null || end == null || interval == null || interval <= 0 || end <= start) return 0;
  return Math.min(12, Math.floor((end - start) / interval) + 1);
}

function litersLabel(ml: number): string {
  const l = ml / 1000;
  return `${Number.isInteger(l) ? l : l.toFixed(1)} L`;
}

export function WaterSettingsScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [target, setTarget] = useState(2500);
  const [remindersOn, setRemindersOn] = useState(false);
  const [start, setStart] = useState<number | null>(9 * 60);
  const [end, setEnd] = useState<number | null>(21 * 60);
  const [intervalMin, setIntervalMin] = useState<number | null>(90);

  const load = useCallback(async () => {
    const stored = await getWaterPrefs();
    setTarget(stored.target_ml);
    setRemindersOn(stored.reminder_interval != null && stored.reminder_start != null && stored.reminder_end != null);
    setStart(stored.reminder_start ?? 9 * 60);
    setEnd(stored.reminder_end ?? 21 * 60);
    setIntervalMin(stored.reminder_interval ?? 90);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function save() {
    const prefs: WaterPrefs = {
      target_ml: target,
      reminder_start: remindersOn ? start : null,
      reminder_end: remindersOn ? end : null,
      reminder_interval: remindersOn ? intervalMin : null,
      notification_id: null,
    };
    if (remindersOn) {
      await requestNotificationPermission();
    }
    await saveWaterPrefs(prefs);
    await syncWaterReminder();
    navigation.goBack();
  }

  const nudges = nudgeCount(start, end, intervalMin);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.sub} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Water settings</Text>
        <Icon name="water" size={22} color={theme.accent} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.sub }]}>DAILY TARGET</Text>
          <View style={styles.targetRow}>
            <Pressable
              onPress={() => setTarget((t) => Math.max(1000, t - 250))}
              style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
              <Icon name="remove" size={18} color={theme.text} />
            </Pressable>
            <Text style={[styles.targetText, { color: theme.text }]}>{litersLabel(target)}</Text>
            <Pressable
              onPress={() => setTarget((t) => Math.min(8000, t + 250))}
              style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
              <Icon name="add" size={18} color={theme.text} />
            </Pressable>
          </View>
          <View style={styles.chipWrap}>
            {TARGET_PRESETS.map((p) => (
              <Pressable
                key={p}
                onPress={() => setTarget(p)}
                style={[styles.chip, { backgroundColor: target === p ? theme.accent : theme.chipBg }]}>
                <Text style={[styles.chipText, { color: target === p ? '#FFFFFF' : theme.sub }]}>
                  {litersLabel(p)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.remindRow}>
            <Icon name="notifications" size={20} color={remindersOn ? theme.accent : theme.sub} />
            <Text style={[styles.remindText, { color: theme.text }]}>Hydration nudges</Text>
            <Switch
              value={remindersOn}
              onValueChange={setRemindersOn}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {remindersOn ? (
            <>
              <Text style={[styles.settingLabel, { color: theme.sub }]}>NUDGE WINDOW</Text>
              <View style={styles.windowRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.windowLabel, { color: theme.sub }]}>STARTS</Text>
                  <View style={styles.chipWrap}>
                    {START_CHOICES.map((m) => (
                      <Pressable
                        key={m}
                        onPress={() => setStart(m)}
                        style={[styles.chip, { backgroundColor: start === m ? theme.accent : theme.chipBg }]}>
                        <Text style={[styles.chipText, { color: start === m ? '#FFFFFF' : theme.sub }]}>
                          {formatReminder(m)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.windowLabel, { color: theme.sub }]}>ENDS</Text>
                  <View style={styles.chipWrap}>
                    {END_CHOICES.map((m) => (
                      <Pressable
                        key={m}
                        onPress={() => setEnd(m)}
                        style={[styles.chip, { backgroundColor: end === m ? theme.accent : theme.chipBg }]}>
                        <Text style={[styles.chipText, { color: end === m ? '#FFFFFF' : theme.sub }]}>
                          {formatReminder(m)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={[styles.settingLabel, { color: theme.sub }]}>EVERY</Text>
              <View style={styles.chipWrap}>
                {INTERVAL_CHOICES.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setIntervalMin(m)}
                    style={[styles.chip, { backgroundColor: intervalMin === m ? theme.accent : theme.chipBg }]}>
                    <Text style={[styles.chipText, { color: intervalMin === m ? '#FFFFFF' : theme.sub }]}>
                      {m} min
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.nudgeInfo, { color: theme.sub }]}>
                About {nudges} nudge{nudges === 1 ? '' : 's'} a day
                {nudges >= 12 ? ' (capped)' : ''}.
              </Text>
            </>
          ) : null}
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
  safe: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  settingLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
  },
  targetText: {
    fontSize: 30,
    fontWeight: '800',
    minWidth: 90,
    textAlign: 'center',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  remindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  remindText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  windowRow: {
    flexDirection: 'row',
    gap: 10,
  },
  windowLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  nudgeInfo: {
    fontSize: 12,
    marginTop: 10,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
});