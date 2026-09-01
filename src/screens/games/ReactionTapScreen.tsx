import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { average, nowMs, nextDelay, ROUNDS } from '../../games/reaction';
import { getBestScore, recordLowScore } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

type Phase = 'idle' | 'waiting' | 'go' | 'tooSoon' | 'done';

const WAIT_COLOR = '#94A3B8';
const GO_COLOR = '#22C55E';
const SOON_COLOR = '#EF4444';

export function ReactionTapScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();

  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(1);
  const [times, setTimes] = useState<number[]>([]);
  const [best, setBest] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goStartRef = useRef(0);
  const bestRef = useRef(0);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  useFocusEffect(
    useCallback(() => {
      void getBestScore('reaction').then((b) => {
        bestRef.current = b;
        setBest(b);
      });
    }, []),
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function schedule() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      goStartRef.current = nowMs();
      setPhase('go');
    }, nextDelay());
  }

  function startGame() {
    setTimes([]);
    setRound(1);
    setPhase('waiting');
    schedule();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function handleTap() {
    if (phase === 'waiting') {
      setPhase('tooSoon');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPhase('waiting');
        schedule();
      }, 700);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (phase === 'go') {
      const elapsed = nowMs() - goStartRef.current;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextTimes = [...times, elapsed];
      setTimes(nextTimes);
      if (round >= ROUNDS) {
        const avg = average(nextTimes);
        setPhase('done');
        void recordLowScore('reaction', avg).then(() => {
          void getBestScore('reaction').then((b) => {
            bestRef.current = b;
            setBest(b);
          });
        });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setRound(round + 1);
        setPhase('waiting');
        schedule();
      }
      return;
    }
    if (phase === 'idle') {
      startGame();
    }
  }

  const dotColor =
    phase === 'go'
      ? GO_COLOR
      : phase === 'tooSoon'
        ? SOON_COLOR
        : phase === 'done'
          ? '#A78BFA'
          : WAIT_COLOR;

  const dotLabel =
    phase === 'idle' ? 'Go' : phase === 'waiting' ? 'Wait…' : phase === 'go' ? 'TAP!' : phase === 'tooSoon' ? 'Too soon!' : 'Done';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>⚡ Reaction Tap</Text>
        <Pressable
          onPress={openFolder}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="folder" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <View style={styles.scoreRow}>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>ROUND</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{Math.min(round, ROUNDS)}/{ROUNDS}</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>AVG</Text>
          <Text style={[styles.scoreValue, { color: GO_COLOR }]}>
            {times.length > 0 ? `${average(times)}ms` : '—'}
          </Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>BEST</Text>
          <Text style={[styles.scoreValue, { color: '#F59E0B' }]}>{best > 0 ? `${best}ms` : '—'}</Text>
        </View>
      </View>

      <View style={styles.stage}>
        <Pressable onPress={handleTap} hitSlop={4} style={[styles.dot, { backgroundColor: dotColor }]}>
          <Text style={styles.dotLabel}>{dotLabel}</Text>
        </Pressable>
        <Text style={[styles.hint, { color: theme.sub }]}>
          {phase === 'idle'
            ? 'Tap the dot to begin — 5 rounds of reflexes.'
            : phase === 'tooSoon'
              ? 'Too eager! Wait for green.'
              : phase === 'done'
                ? `Rounds: ${times.map((t) => `${t}ms`).join(' · ')}`
                : 'Tap the moment it turns green.'}
        </Text>
        <Text style={[styles.faq, { color: theme.sub }]}>
          Green means go. React fast, don’t guess early.
        </Text>
      </View>

      {phase === 'done' ? (
        <View style={styles.overlayBackdrop}>
          <View style={[styles.overlayCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.overlayTitle, { color: theme.text }]}>Reaction time</Text>
            <Text style={[styles.overlayAvg, { color: GO_COLOR }]}>{average(times)}ms</Text>
            <View style={styles.roundList}>
              {times.map((t, i) => (
                <View key={i} style={[styles.roundChip, { backgroundColor: theme.chipBg }]}>
                  <Text style={[styles.roundNum, { color: theme.sub }]}>R{i + 1}</Text>
                  <Text style={[styles.roundTime, { color: theme.text }]}>{t}ms</Text>
                </View>
              ))}
            </View>
            {best > 0 && <Text style={[styles.bestLine, { color: theme.sub }]}>Best: {best}ms</Text>}
            <Pressable
              onPress={startGame}
              style={({ pressed }) => [styles.playBtn, { backgroundColor: GO_COLOR }, pressed && { opacity: 0.85 }]}>
              <Text style={styles.playText}>Play again</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  chipBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
  },
  scoreLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  scoreValue: { fontSize: 17, fontWeight: '800', marginTop: 2 },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    paddingHorizontal: 24,
  },
  dot: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  dotLabel: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', letterSpacing: 1 },
  hint: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  faq: { fontSize: 13, textAlign: 'center', opacity: 0.8 },
  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 24,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
  },
  overlayTitle: { fontSize: 20, fontWeight: '800' },
  overlayAvg: { fontSize: 44, fontWeight: '900', marginTop: 4 },
  roundList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  roundChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  roundNum: { fontSize: 12, fontWeight: '700' },
  roundTime: { fontSize: 13, fontWeight: '800' },
  bestLine: { fontSize: 13, fontWeight: '600', marginTop: 12 },
  playBtn: { marginTop: 18, borderRadius: 999, paddingHorizontal: 34, paddingVertical: 12 },
  playText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});