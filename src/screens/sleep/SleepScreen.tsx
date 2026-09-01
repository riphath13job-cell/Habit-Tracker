import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icon, IconName } from '../../icons';
import type { SleepEntry, SleepPrefs } from '../../types';
import {
  deleteSleepEntry,
  getSleepEntry,
  getSleepPrefs,
  listSleepEntries,
  saveSleepEntry,
  saveSleepPrefs,
  sleepDurationMinutes,
} from '../../db';
import { requestNotificationPermission, syncSleepReminder } from '../../notifications';
import { addDays, dayKey, formatReminder, WEEKDAY_LETTERS } from '../../date-utils';
import { useTheme } from '../../theme';
import { PlatformDateTimePicker } from '../../components/PlatformDateTimePicker';

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function timeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function minutesToDate(minutes: number): Date {
  const d = new Date();
  d.setHours(Math.floor(minutes / 60) % 24, minutes % 60, 0, 0);
  return d;
}

function dateToMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function labelForDay(day: string): string {
  const today = dayKey(new Date());
  const yesterday = dayKey(addDays(new Date(), -1));
  if (day === today) return 'Today';
  if (day === yesterday) return 'Yesterday';
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function SleepScreen() {
  const theme = useTheme();
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [prefs, setPrefs] = useState<SleepPrefs>({
    goal_minutes: 480,
    reminder_minutes: null,
    notification_id: null,
  });
  const [bedMinutes, setBedMinutes] = useState(23 * 60);
  const [wakeMinutes, setWakeMinutes] = useState(7 * 60);
  const [quality, setQuality] = useState<number | null>(null);
  const [showBedPicker, setShowBedPicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    const [rows, storedPrefs] = await Promise.all([listSleepEntries(60), getSleepPrefs()]);
    setEntries(rows);
    setPrefs(storedPrefs);

    const today = await getSleepEntry(dayKey(new Date()));
    if (today) {
      setBedMinutes(today.bed_minutes);
      setWakeMinutes(today.wake_minutes);
      setQuality(today.quality);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const goalMin = prefs.goal_minutes;
  const byDay = new Map(entries.map((e) => [e.day, e]));
  const todayKeyStr = dayKey(new Date());
  const todayEntry = byDay.get(todayKeyStr);

  const last7: Array<{ day: string; letter: string; minutes: number | null }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const key = dayKey(d);
    const entry = byDay.get(key);
    last7.push({
      day: key,
      letter: WEEKDAY_LETTERS[d.getDay()],
      minutes: entry ? sleepDurationMinutes(entry.bed_minutes, entry.wake_minutes) : null,
    });
  }

  const loggedWeek = last7.filter((n) => n.minutes !== null) as Array<{
    day: string;
    letter: string;
    minutes: number;
  }>;
  const weekAvg =
    loggedWeek.length > 0
      ? loggedWeek.reduce((sum, n) => sum + n.minutes, 0) / loggedWeek.length
      : null;

  let streak = 0;
  {
    let cursor = new Date();
    if (!byDay.has(dayKey(cursor))) cursor = addDays(cursor, -1);
    for (let guard = 0; guard < 400; guard++) {
      const e = byDay.get(dayKey(cursor));
      if (!e || sleepDurationMinutes(e.bed_minutes, e.wake_minutes) < goalMin) break;
      streak += 1;
      cursor = addDays(cursor, -1);
    }
  }

  async function saveNight() {
    const duration = sleepDurationMinutes(bedMinutes, wakeMinutes);
    if (duration < 60 || duration > 16 * 60) {
      Alert.alert('Check the times', 'That looks like less than 1 hour or more than 16 hours of sleep.');
      return;
    }
    await saveSleepEntry({ day: todayKeyStr, bed_minutes: bedMinutes, wake_minutes: wakeMinutes, quality });
    load();
  }

  function confirmDelete(entry: SleepEntry) {
    Alert.alert('Delete entry?', `${labelForDay(entry.day)} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteSleepEntry(entry.id);
            load();
          })(),
      },
    ]);
  }

  const maxScale = Math.max(goalMin, ...last7.map((n) => n.minutes ?? 0)) * 1.2;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Sleep</Text>
        <Pressable onPress={() => setSettingsOpen(true)} hitSlop={8} style={styles.gearBtn}>
          <Icon name="settings" size={22} color={theme.sub} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.heroTopRow}>
            <Text style={[styles.heroLabel, { color: theme.sub }]}>LAST NIGHT</Text>
            {todayEntry ? (
              <View
                style={[
                  styles.goalChip,
                  { backgroundColor: todayEntry && sleepDurationMinutes(todayEntry.bed_minutes, todayEntry.wake_minutes) >= goalMin ? theme.good : theme.chipBg },
                ]}>
                <Text
                  style={[
                    styles.goalChipText,
                    {
                      color:
                        todayEntry && sleepDurationMinutes(todayEntry.bed_minutes, todayEntry.wake_minutes) >= goalMin
                          ? '#FFFFFF'
                          : theme.sub,
                    },
                  ]}>
                  Goal {fmtDuration(goalMin)}
                </Text>
              </View>
            ) : (
              <View style={[styles.goalChip, { backgroundColor: theme.chipBg }]}>
                <Text style={[styles.goalChipText, { color: theme.sub }]}>Not logged</Text>
              </View>
            )}
          </View>
          <Text style={[styles.heroValue, { color: theme.text }]}>
            {todayEntry ? fmtDuration(sleepDurationMinutes(todayEntry.bed_minutes, todayEntry.wake_minutes)) : '—'}
          </Text>
          {weekAvg !== null ? (
            <Text style={[styles.heroSub, { color: theme.sub }]}>
              7-night average: {fmtDuration(weekAvg)} · Streak: {streak} night{streak === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>

        <View style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.logTitle, { color: theme.text }]}>
            {todayEntry ? 'Edit last night' : 'Log last night'}
          </Text>
          <View style={styles.timeRow}>
            <TimeButton
              icon="bedtime"
              label="Bedtime"
              value={timeLabel(bedMinutes)}
              onPress={() => {
                setShowWakePicker(false);
                setShowBedPicker(true);
              }}
            />
            <Icon name="arrow-forward" size={18} color={theme.sub} />
            <TimeButton
              icon="alarm"
              label="Wake up"
              value={timeLabel(wakeMinutes)}
              onPress={() => {
                setShowBedPicker(false);
                setShowWakePicker(true);
              }}
            />
          </View>

          {showBedPicker ? (
            <PlatformDateTimePicker
              value={minutesToDate(bedMinutes)}
              mode="time"
              onChange={(_event, date) => {
                setShowBedPicker(false);
                if (date) setBedMinutes(dateToMinutes(date));
              }}
            />
          ) : null}
          {showWakePicker ? (
            <PlatformDateTimePicker
              value={minutesToDate(wakeMinutes)}
              mode="time"
              onChange={(_event, date) => {
                setShowWakePicker(false);
                if (date) setWakeMinutes(dateToMinutes(date));
              }}
            />
          ) : null}

          <View style={styles.durationRow}>
            <Text style={[styles.durationText, { color: theme.accent }]}>
              {fmtDuration(sleepDurationMinutes(bedMinutes, wakeMinutes))}
            </Text>
          </View>

          <Text style={[styles.qualityLabel, { color: theme.sub }]}>HOW DID YOU SLEEP?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setQuality(star)} hitSlop={4}>
                <Icon
                  name={quality !== null && star <= quality ? 'star' : 'star-border'}
                  size={30}
                  color="#F59E0B"
                />
              </Pressable>
            ))}
            {quality !== null ? (
              <Pressable onPress={() => setQuality(null)} hitSlop={6} style={styles.clearStars}>
                <Icon name="close" size={17} color={theme.sub} />
              </Pressable>
            ) : null}
          </View>

          <Pressable onPress={saveNight} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
            <Text style={styles.saveBtnText}>{todayEntry ? 'Update' : 'Save night'}</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Last 7 nights</Text>
        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.barsWrap}>
            <View
              pointerEvents="none"
              style={[
                styles.goalLine,
                {
                  bottom: `${Math.min(96, (goalMin / maxScale) * 100)}%` as `${number}%`,
                  borderTopColor: theme.danger,
                },
              ]}
            />
            {last7.map((night) => (
              <View key={night.day} style={styles.barCol}>
                <Text style={[styles.barValue, { color: theme.sub }]}>
                  {night.minutes !== null ? (night.minutes / 60).toFixed(1).replace('.0', '') : ''}
                </Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(
                        night.minutes !== null ? (night.minutes / maxScale) * 100 : 1.5,
                        1.5,
                      )}%` as `${number}%`,
                      backgroundColor:
                        night.minutes !== null
                          ? night.minutes >= goalMin
                            ? theme.good
                            : theme.accent
                          : theme.border,
                    },
                  ]}
                />
                <Text style={[styles.barLabel, { color: theme.sub }]}>{night.letter}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.chartHint, { color: theme.sub }]}>Dashed line = your goal ({fmtDuration(goalMin)})</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>
        {entries.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>No nights logged yet.</Text>
        ) : (
          entries.map((entry) => {
            const duration = sleepDurationMinutes(entry.bed_minutes, entry.wake_minutes);
            const hit = duration >= goalMin;
            return (
              <Pressable
                key={entry.id}
                onLongPress={() => confirmDelete(entry)}
                style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyDay, { color: theme.text }]}>{labelForDay(entry.day)}</Text>
                  <View style={styles.historyMetaRow}>
                    <Text style={[styles.historyTime, { color: theme.sub }]}>
                      {timeLabel(entry.bed_minutes)} – {timeLabel(entry.wake_minutes)}
                    </Text>
                    {entry.quality !== null ? (
                      <View style={styles.historyStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icon
                            key={star}
                            name={star <= entry.quality! ? 'star' : 'star-border'}
                            size={13}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text style={[styles.historyDuration, { color: hit ? theme.good : theme.text }]}>
                  {fmtDuration(duration)}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <SleepSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}

function TimeButton({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.timeButton, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Icon name={icon} size={17} color={theme.accent} />
      <View>
        <Text style={[styles.timeButtonLabel, { color: theme.sub }]}>{label}</Text>
        <Text style={[styles.timeButtonText, { color: theme.text }]}>{value}</Text>
      </View>
    </Pressable>
  );
}

function SleepSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const [goalMinutes, setGoalMinutes] = useState(480);
  const [reminder, setReminder] = useState<number | null>(null);

  React.useEffect(() => {
    if (!visible) return;
    void (async () => {
      const stored = await getSleepPrefs();
      setGoalMinutes(stored.goal_minutes);
      setReminder(stored.reminder_minutes);
    })();
  }, [visible]);

  async function save() {
    if (reminder != null) await requestNotificationPermission();
    await saveSleepPrefs({ goal_minutes: goalMinutes, reminder_minutes: reminder, notification_id: null });
    await syncSleepReminder();
    onClose();
  }

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Sleep settings</Text>

          <Text style={[styles.settingLabel, { color: theme.sub }]}>NIGHTLY GOAL</Text>
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => setGoalMinutes((m) => Math.max(5 * 60, m - 30))}
              style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
              <Icon name="remove" size={18} color={theme.text} />
            </Pressable>
            <Text style={[styles.stepValue, { color: theme.text }]}>{fmtDuration(goalMinutes)}</Text>
            <Pressable
              onPress={() => setGoalMinutes((m) => Math.min(12 * 60, m + 30))}
              style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
              <Icon name="add" size={18} color={theme.text} />
            </Pressable>
          </View>

          <View style={[styles.remindCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Icon name="notifications" size={20} color={reminder != null ? theme.accent : theme.sub} />
            <Text style={[styles.remindText, { color: theme.text }]}>Bedtime reminder</Text>
            <Switch
              value={reminder != null}
              onValueChange={(on) => setReminder(on ? 22 * 60 : null)}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {reminder != null ? (
            <View style={styles.chipWrap}>
              {[21 * 60 + 30, 22 * 60, 22 * 60 + 30, 23 * 60].map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setReminder(m)}
                  style={[styles.timeChip, { backgroundColor: reminder === m ? theme.accent : theme.chipBg }]}>
                  <Text style={[styles.timeChipText, { color: reminder === m ? '#FFFFFF' : theme.sub }]}>
                    {formatReminder(m % 1440)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={[styles.button, { backgroundColor: theme.chipBg }]}>
              <Text style={[styles.buttonText, { color: theme.sub }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={save} style={[styles.button, { backgroundColor: theme.accent }]}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
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
  gearBtn: {
    padding: 6,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 14,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  goalChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goalChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '800',
    marginTop: 6,
  },
  heroSub: {
    fontSize: 12.5,
    marginTop: 4,
  },
  logCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  logTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  timeButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  durationRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '800',
  },
  qualityLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearStars: {
    marginLeft: 6,
  },
  saveBtn: {
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  barsWrap: {
    flexDirection: 'row',
    height: 130,
    alignItems: 'stretch',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barValue: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  bar: {
    width: 20,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
  },
  chartHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  hint: {
    fontSize: 13.5,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 7,
  },
  historyDay: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  historyTime: {
    fontSize: 12,
  },
  historyStars: {
    flexDirection: 'row',
  },
  historyDuration: {
    fontSize: 16,
    fontWeight: '800',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  settingLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 17,
    fontWeight: '800',
    minWidth: 60,
    textAlign: 'center',
  },
  remindCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  remindText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  timeChip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
