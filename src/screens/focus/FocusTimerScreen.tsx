import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { FocusPrefs } from '../../types';
import { createFocusSession, getFocusPrefs, listFocusSessions, setFocusNotificationId } from '../../db';
import { todayKey } from '../../date-utils';
import { cancelScheduledNotification, requestNotificationPermission, scheduleFocusEndNotification } from '../../notifications';
import { useTheme } from '../../theme';
import { ProgressRing } from '../../components/ProgressRing';

type Phase = 'work' | 'short' | 'long';

const DIR = 1000;

export function FocusTimerScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [prefs, setPrefs] = useState<FocusPrefs>({
    work_minutes: 25,
    short_break: 5,
    long_break: 15,
    sessions_before_long: 4,
    notify_on_end: 1,
    notification_id: null,
  });

  const [phase, setPhase] = useState<Phase>('work');
  // Which focus block number in the current cycle we're on (1-based).
  const [blockInCycle, setBlockInCycle] = useState(1);
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(prefs.work_minutes * 60000);
  const [elapsedInSession, setElapsedInSession] = useState(0);
  const [tag, setTag] = useState('');
  const [focusMinutesToday, setFocusMinutesToday] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [cycleDone, setCycleDone] = useState(false);

  const endRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('work');
  const prefsRef = useRef(prefs);
  const remainingRef = useRef(remainingMs);
  const runningRef = useRef(running);
  const blockRef = useRef(1);
  const elapsedRef = useRef(0);

  prefsRef.current = prefs;
  phaseRef.current = phase;
  remainingRef.current = remainingMs;
  runningRef.current = running;
  blockRef.current = blockInCycle;
  elapsedRef.current = elapsedInSession;

  const minutesFor = useCallback((p: Phase) => {
    const pre = prefsRef.current;
    return p === 'work' ? pre.work_minutes : p === 'short' ? pre.short_break : pre.long_break;
  }, []);

  const phaseLabel = useMemo(
    () => (phase === 'work' ? 'Focus' : phase === 'short' ? 'Short break' : 'Long break'),
    [phase],
  );

  const load = useCallback(async () => {
    const [stored, sessions] = await Promise.all([getFocusPrefs(), listFocusSessions()]);
    setPrefs(stored);
    const today = todayKey();
    const startOfDay = new Date(`${today}T00:00:00`).getTime();
    let mins = 0;
    let count = 0;
    for (const s of sessions) {
      if (s.started_at >= startOfDay && s.completed === 1) {
        mins += s.focus_minutes;
        count += 1;
      }
    }
    setFocusMinutesToday(mins);
    setSessionsToday(count);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function stopTicking() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopTicking();
  }, []);

  function startTimer() {
    if (runningRef.current) return;
    endRef.current = Date.now() + remainingRef.current;
    setRunning(true);
    stopTicking();
    if (phaseRef.current === 'work' && prefsRef.current.notify_on_end === 1) {
      void (async () => {
        await requestNotificationPermission();
        const id = await scheduleFocusEndNotification(
          Date.now() + remainingRef.current,
          'Take a break — great work!',
        );
        if (id) await setFocusNotificationId(id);
      })();
    }
    tickRef.current = setInterval(() => {
      const now = Date.now();
      if (!endRef.current) return;
      const rem = endRef.current - now;
      if (rem <= 0) {
        setRemainingMs(0);
        onPhaseEnd();
      } else {
        setRemainingMs(rem);
        const msIntoSession = minutesFor(phaseRef.current) * 60000 - rem;
        const sec = Math.max(0, Math.floor(msIntoSession / 1000));
        elapsedRef.current = sec;
        setElapsedInSession(sec);
      }
    }, DIR);
  }

  function cancelPendingNotification() {
    void (async () => {
      const current = await getFocusPrefs();
      if (current.notification_id) {
        await cancelScheduledNotification(current.notification_id);
        await setFocusNotificationId(null);
      }
    })();
  }

  function pauseTimer() {
    stopTicking();
    setRunning(false);
    endRef.current = null;
    cancelPendingNotification();
  }

  function reset() {
    stopTicking();
    setRunning(false);
    endRef.current = null;
    setRemainingMs(minutesFor(phase) * 60000);
    setElapsedInSession(0);
    cancelPendingNotification();
  }

  async function onPhaseEnd() {
    stopTicking();
    setRunning(false);
    endRef.current = null;
    const phaseAtEnd = phaseRef.current;
    const pre = prefsRef.current;
    await cancelPendingNotification();

    if (phaseAtEnd === 'work') {
      const elapsedSec = elapsedRef.current;
      const focusMin = Math.max(0, Math.min(pre.work_minutes, Math.round(elapsedSec / 60)));
      await createFocusSession({
        started_at: Date.now() - elapsedSec * 1000,
        ended_at: Date.now(),
        target_minutes: pre.work_minutes,
        focus_minutes: focusMin,
        tag: tag.trim(),
        completed: elapsedSec > 0,
      });
      setElapsedInSession(0);
      setTag('');
      load();

      // advance cycle
      if (blockRef.current >= pre.sessions_before_long) {
        setPhase('long');
        setBlockInCycle(1);
        setCycleDone(true);
      } else {
        setPhase('short');
        setBlockInCycle(blockRef.current + 1);
      }
      setRemainingMs(
        blockRef.current >= pre.sessions_before_long
          ? pre.long_break * 60000
          : pre.short_break * 60000,
      );
    } else {
      setPhase('work');
      setRemainingMs(pre.work_minutes * 60000);
      setElapsedInSession(0);
    }
  }

  function startPhase() {
    load();
    startTimer();
  }

  function confirmReset() {
    if (!running && remainingMs === minutesFor(phase) * 60000) return;
    Alert.alert('Reset timer?', 'The current block will be discarded.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: reset },
    ]);
  }

  const totalMs = minutesFor(phase) * 60000;
  const progress = totalMs > 0 ? remainingMs / totalMs : 0;
  const remainSec = Math.max(0, Math.round(remainingMs / 1000));
  const mm = String(Math.floor(remainSec / 60)).padStart(2, '0');
  const ss = String(remainSec % 60).padStart(2, '0');
  const ringColor = phase === 'work' ? theme.accent : phase === 'short' ? theme.good : theme.blue;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Focus</Text>
        <Pressable onPress={() => navigation.navigate('FocusSettings')} hitSlop={8} style={styles.gearBtn}>
          <Icon name="settings" size={22} color={theme.sub} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.phaseRow}>
            <Pressable
              onPress={() => !running && switchPhase('work')}
              style={[styles.phasePill, { backgroundColor: phase === 'work' ? theme.accent : theme.chipBg }]}>
              <Text style={[styles.phasePillText, { color: phase === 'work' ? '#FFFFFF' : theme.sub }]}>Focus</Text>
            </Pressable>
            <Pressable
              onPress={() => !running && switchPhase('short')}
              style={[styles.phasePill, { backgroundColor: phase === 'short' ? theme.good : theme.chipBg }]}>
              <Text style={[styles.phasePillText, { color: phase === 'short' ? '#FFFFFF' : theme.sub }]}>Short</Text>
            </Pressable>
            <Pressable
              onPress={() => !running && switchPhase('long')}
              style={[styles.phasePill, { backgroundColor: phase === 'long' ? theme.blue : theme.chipBg }]}>
              <Text style={[styles.phasePillText, { color: phase === 'long' ? '#FFFFFF' : theme.sub }]}>Long</Text>
            </Pressable>
          </View>

          <Text style={[styles.cycleLabel, { color: theme.sub }]}>
            Block {Math.min(blockInCycle, prefs.sessions_before_long)} of {prefs.sessions_before_long}
            {cycleDone ? ' · cycle complete' : ''}
          </Text>

          <View style={styles.ringWrap}>
            <ProgressRing
              size={220}
              stroke={14}
              progress={progress}
              label={`${mm}:${ss}`}
              sub={phaseLabel}
              color={ringColor}
              trackColor={theme.chipBg}
              textColor={theme.text}
            />
          </View>

          <View style={styles.controls}>
            {running ? (
              <Pressable onPress={pauseTimer} style={[styles.ctlBtn, { backgroundColor: theme.yellow }]}>
                <Icon name="restart-alt" size={20} color="#1F2937" />
                <Text style={styles.ctlBtnTextDark}>Pause</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={startPhase}
                style={[styles.ctlBtn, { backgroundColor: phase === 'work' ? theme.accent : theme.good }]}>
                <Icon name="play-arrow" size={20} color="#FFFFFF" />
                <Text style={styles.ctlBtnText}>Start</Text>
              </Pressable>
            )}
            <Pressable
              onPress={confirmReset}
              style={[styles.ctlBtn, { backgroundColor: theme.chipBg }]}>
              <Icon name="restart-alt" size={20} color={theme.text} />
              <Text style={[styles.ctlBtnText2, { color: theme.text }]}>Reset</Text>
            </Pressable>
          </View>

          <TextInput
            value={tag}
            onChangeText={setTag}
            placeholder="What are you working on? (optional)"
            placeholderTextColor={theme.sub}
            style={[styles.tagInput, { backgroundColor: theme.chipBg, color: theme.text, borderColor: theme.border }]}
          />
        </View>

        <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statsValue, { color: theme.text }]}>{focusMinutesToday}</Text>
            <Text style={[styles.statsLabel, { color: theme.sub }]}>min today</Text>
          </View>
          <View style={[styles.statsDivider, { backgroundColor: theme.border }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statsValue, { color: theme.text }]}>{sessionsToday}</Text>
            <Text style={[styles.statsLabel, { color: theme.sub }]}>sessions</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function switchPhase(p: Phase) {
    setPhase(p);
    setRemainingMs(minutesFor(p) * 60000);
    setElapsedInSession(0);
    setRunning(false);
    stopTicking();
    endRef.current = null;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800' },
  gearBtn: { padding: 6 },
  content: { padding: 20, paddingBottom: 110, gap: 14 },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 18, alignItems: 'center' },
  phaseRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  phasePill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  phasePillText: { fontSize: 13.5, fontWeight: '800' },
  cycleLabel: { fontSize: 12.5, fontWeight: '600', marginBottom: 10 },
  ringWrap: { marginBottom: 8 },
  controls: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  ctlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 13,
  },
  ctlBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  ctlBtnText2: { fontSize: 15, fontWeight: '800' },
  ctlBtnTextDark: { color: '#1F2937', fontSize: 15, fontWeight: '800' },
  tagInput: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    width: '100%',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statsDivider: { width: 1, alignSelf: 'stretch' },
  statsValue: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  statsLabel: { fontSize: 12.5, fontWeight: '600', textAlign: 'center', marginTop: 2 },
});
