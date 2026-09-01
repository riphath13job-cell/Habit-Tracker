import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from '../../icons';
import type { WaterLog, WaterPrefs } from '../../types';
import { addWaterLog, allWaterLogs, deleteWaterLog, getWaterPrefs } from '../../db';
import { todayKey } from '../../date-utils';
import { currentWaterStreak, formatMl, rollupByDay, shiftDay } from '../../water/stats';
import { useTheme } from '../../theme';

const QUICK_ML = [250, 500, 1000];

function timeLabel(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

function labelForDay(day: string): string {
  const today = todayKey();
  if (day === today) return 'Today';
  if (day === shiftDay(today, -1)) return 'Yesterday';
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' }),
  });
}

export function WaterScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [day, setDay] = useState(todayKey());
  const [allLogs, setAllLogs] = useState<WaterLog[]>([]);
  const [prefs, setPrefs] = useState<WaterPrefs>({
    target_ml: 2500,
    reminder_start: null,
    reminder_end: null,
    reminder_interval: null,
    notification_id: null,
  });

  const load = useCallback(async () => {
    const [logs, storedPrefs] = await Promise.all([allWaterLogs(), getWaterPrefs()]);
    setAllLogs(logs);
    setPrefs(storedPrefs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = rollupByDay(allLogs);
  const total = totals.get(day) ?? 0;
  const target = prefs.target_ml;
  const met = total >= target;
  const progress = Math.min(1, target > 0 ? total / target : 0);
  const todayTotals = totals.get(todayKey()) ?? 0;
  const streak = currentWaterStreak(totals, target, todayKey());
  const dayLogs = allLogs.filter((l) => l.day === day);
  const isToday = day === todayKey();

  async function logMl(ml: number) {
    await addWaterLog(day, ml);
    load();
  }

  async function undoLast() {
    const last = dayLogs[dayLogs.length - 1];
    if (!last) return;
    await deleteWaterLog(last.id);
    load();
  }

  function confirmDelete(log: WaterLog) {
    Alert.alert('Remove glass?', `${timeLabel(log.created_at)} · ${formatMl(log.ml)} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            await deleteWaterLog(log.id);
            load();
          })(),
      },
    ]);
  }

  const RING_SIZE = 196;
  const STROKE = 16;
  const R = (RING_SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Water</Text>
        <Pressable onPress={() => navigation.navigate('WaterSettings')} hitSlop={8} style={styles.gearBtn}>
          <Icon name="settings" size={22} color={theme.sub} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.heroLabel, { color: theme.sub }]}>{labelForDay(day).toUpperCase()}</Text>

          <View style={styles.dayStepper}>
            <Pressable
              onPress={() => setDay(shiftDay(day, -1))}
              hitSlop={8}
              style={[styles.stepBtn, { backgroundColor: theme.chipBg }]}>
              <Icon name="chevron-left" size={18} color={theme.text} />
            </Pressable>
            <Text style={[styles.dayLabel, { color: theme.text }]}>{labelForDay(day)}</Text>
            <Pressable
              onPress={() => setDay(shiftDay(day, 1))}
              disabled={isToday}
              hitSlop={8}
              style={[
                styles.stepBtn,
                { backgroundColor: isToday ? theme.chipBg : theme.accent, opacity: isToday ? 0.35 : 1 },
              ]}>
              <Icon name="chevron-right" size={18} color={isToday ? theme.text : '#FFFFFF'} />
            </Pressable>
          </View>

          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={R}
                stroke={theme.chipBg}
                strokeWidth={STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={R}
                stroke={met ? theme.good : theme.accent}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${CIRC} ${CIRC}`}
                strokeDashoffset={CIRC * (1 - progress)}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.ringValue, { color: theme.text }]}>{formatMl(total)}</Text>
              <Text style={[styles.ringOf, { color: theme.sub }]}>of {formatMl(target)}</Text>
              {met ? (
                <View style={[styles.metChip, { backgroundColor: theme.good }]}>
                  <Text style={styles.metChipText}>Goal reached</Text>
                </View>
              ) : (
                <Text style={[styles.ringRemaining, { color: theme.sub }]}>
                  {formatMl(Math.max(0, target - total))} to go
                </Text>
              )}
            </View>
          </View>

          <Text style={[styles.heroSub, { color: theme.sub }]}>
            Streak: {streak} day{streak === 1 ? '' : 's'} · Today: {formatMl(todayTotals)}
          </Text>
        </View>

        <View style={styles.quickRow}>
          {QUICK_ML.map((ml) => (
            <Pressable
              key={ml}
              onPress={() => logMl(ml)}
              style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Icon name="add" size={15} color={theme.accent} />
              <Text style={[styles.quickText, { color: theme.text }]}>+{formatMl(ml)}</Text>
            </Pressable>
          ))}
        </View>

        {dayLogs.length > 0 ? (
          <Pressable onPress={undoLast} hitSlop={6} style={styles.undoRow}>
            <Icon name="restore" size={16} color={theme.sub} />
            <Text style={[styles.undoText, { color: theme.sub }]}>Undo last</Text>
          </Pressable>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Glasses</Text>
        {dayLogs.length === 0 ? (
          <Text style={[styles.hint, { color: theme.sub }]}>
            No water logged {isToday ? 'today yet' : `on ${labelForDay(day)}`}.
          </Text>
        ) : (
          dayLogs.map((log, i) => (
            <Pressable
              key={log.id}
              onPress={() => confirmDelete(log)}
              style={[styles.glassCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.glassDot, { backgroundColor: met && i === dayLogs.length - 1 ? theme.good : theme.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.glassTime, { color: theme.sub }]}>
                  Glass {i + 1} · {timeLabel(log.created_at)}
                </Text>
              </View>
              <Text style={[styles.glassMl, { color: theme.text }]}>{formatMl(log.ml)}</Text>
            </Pressable>
          ))
        )}
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
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  dayStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    minWidth: 130,
    textAlign: 'center',
  },
  ringWrap: {
    width: 196,
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 34,
    fontWeight: '800',
  },
  ringOf: {
    fontSize: 13.5,
  },
  ringRemaining: {
    fontSize: 12.5,
    marginTop: 6,
  },
  metChip: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4,
    marginTop: 6,
  },
  metChipText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  heroSub: {
    fontSize: 12.5,
    marginTop: 10,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
  },
  quickText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  undoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  undoText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
  },
  hint: {
    fontSize: 13.5,
  },
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 7,
  },
  glassDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  glassTime: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  glassMl: {
    fontSize: 15,
    fontWeight: '800',
  },
});