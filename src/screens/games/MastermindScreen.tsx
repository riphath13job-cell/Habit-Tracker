import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  CODE_SIZE,
  evaluate,
  isWin,
  MAX_GUESSES,
  newSecret,
  PEG_COLORS,
  type Code,
  type MatchResult,
} from '../../games/mastermind';
import { getBestScore, recordLowScore } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

interface Attempt {
  guess: Code;
  result: MatchResult;
}

const BLACK_PEG = '#1E1E24';
const EMPTY_ROW = [-1, -1, -1, -1];

export function MastermindScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();

  const [secret, setSecret] = useState<Code>(() => newSecret());
  const [current, setCurrent] = useState<Code>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [best, setBest] = useState(0);

  const secretRef = useRef(secret);
  const bestRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      void getBestScore('mastermind').then((b) => {
        bestRef.current = b;
        setBest(b);
      });
    }, []),
  );

  function newGame() {
    const s = newSecret();
    secretRef.current = s;
    setSecret(s);
    setCurrent([]);
    setAttempts([]);
    setWon(false);
    setLost(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function pick(color: number) {
    if (won || lost || current.length >= CODE_SIZE) return;
    setCurrent((c) => [...c, color]);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function backspace() {
    if (current.length === 0) return;
    setCurrent((c) => c.slice(0, -1));
  }

  function submit() {
    if (won || lost || current.length < CODE_SIZE) return;
    const result = evaluate(secretRef.current, current);
    const nextAttempts = [...attempts, { guess: current, result }];
    setAttempts(nextAttempts);
    setCurrent([]);
    if (isWin(result)) {
      setWon(true);
      void recordLowScore('mastermind', nextAttempts.length).then(() => {
        void getBestScore('mastermind').then((b) => {
          bestRef.current = b;
          setBest(b);
        });
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (nextAttempts.length >= MAX_GUESSES) {
      setLost(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  const rows: Array<{ guess: Code; result: MatchResult | null; active: boolean }> = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < attempts.length) {
      rows.push({ guess: attempts[i].guess, result: attempts[i].result, active: false });
    } else if (i === attempts.length && !won && !lost) {
      rows.push({ guess: [...current, ...EMPTY_ROW.slice(0, CODE_SIZE - current.length)].slice(0, 4).map((v) => v), result: null, active: true });
    } else {
      rows.push({ guess: EMPTY_ROW, result: null, active: false });
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>🎨 Mastermind</Text>
        <Pressable
          onPress={openFolder}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="folder" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <View style={styles.statRow}>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.sub }]}>GUESS</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {attempts.length}/{MAX_GUESSES}
          </Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.sub }]}>BEST</Text>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {best > 0 ? `${best} guesses` : '—'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.boardWrap} contentContainerStyle={styles.boardContent}>
        {rows.map((row, i) => {
          const isCurrent = row.active;
          return (
            <View
              key={i}
              style={[
                styles.row,
                { backgroundColor: theme.card, borderColor: isCurrent ? theme.accent : theme.border, borderWidth: isCurrent ? 2 : 1 },
              ]}>
              <Text style={[styles.rowNum, { color: theme.sub }]}>{i + 1}</Text>
              <View style={styles.guess}>
                {row.guess.map((c, j) => (
                  <View
                    key={j}
                    style={[
                      styles.peg,
                      {
                        backgroundColor: c >= 0 ? PEG_COLORS[c] : 'transparent',
                        borderColor: isCurrent && c >= 0 ? 'transparent' : theme.border,
                        borderWidth: isCurrent && c >= 0 ? 0 : 1.5,
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.feedback}>
                {row.result
                  ? [0, 1, 2, 3].map((dot) => (
                      <View
                        key={dot}
                        style={[
                          styles.fbDot,
                          {
                            backgroundColor:
                              dot < row.result!.black ? BLACK_PEG : dot < row.result!.black + row.result!.white ? '#E5E7EB' : 'transparent',
                            borderColor: theme.border,
                          },
                        ]}
                      />
                    ))
                  : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.palette}>
        {PEG_COLORS.map((color, i) => (
          <Pressable
            key={i}
            onPress={() => pick(i)}
            hitSlop={4}
            style={({ pressed }) => [styles.palettePeg, { backgroundColor: color }, pressed && { opacity: 0.7 }]}
          />
        ))}
        <Pressable onPress={backspace} hitSlop={6} style={[styles.ctlBtn, { backgroundColor: theme.card }]}>
          <Icon name="arrow-back" size={18} color={theme.sub} />
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={current.length < CODE_SIZE}
          style={[
            styles.submitBtn,
            { backgroundColor: theme.accent },
            current.length < CODE_SIZE && { opacity: 0.4 },
          ]}>
          <Text style={styles.submitText}>OK</Text>
        </Pressable>
      </View>

      {(won || lost) ? (
        <View style={styles.overlayBackdrop}>
          <View style={[styles.overlayCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.overlayTitle, { color: theme.text }]}>
              {won ? '🎉 Cracked it!' : '😅 Out of guesses'}
            </Text>
            {won ? (
              <Text style={[styles.overlaySub, { color: theme.sub }]}>
                You broke the code in {attempts.length} turn{attempts.length === 1 ? '' : 's'}.
              </Text>
            ) : (
              <Text style={[styles.overlaySub, { color: theme.sub }]}>The code was:</Text>
            )}
            <View style={styles.secretRow}>
              {secret.map((c, i) => (
                <View key={i} style={[styles.secretPeg, { backgroundColor: PEG_COLORS[c] }]} />
              ))}
            </View>
            {won && best > 0 && <Text style={[styles.overlayBest, { color: '#F59E0B' }]}>Best: {best} guesses</Text>}
            <Pressable
              onPress={newGame}
              style={({ pressed }) => [styles.playBtn, { backgroundColor: theme.accent }, pressed && { opacity: 0.85 }]}>
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
  statRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  statBox: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 8 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 1 },
  boardWrap: { flex: 1, paddingHorizontal: 20 },
  boardContent: { gap: 8, paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  rowNum: { width: 22, fontSize: 13, fontWeight: '700' },
  guess: { flex: 1, flexDirection: 'row', gap: 10 },
  peg: { width: 26, height: 26, borderRadius: 13 },
  feedback: { flexDirection: 'row', flexWrap: 'wrap', width: 44, gap: 4 },
  fbDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1 },
  palette: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 18,
  },
  palettePeg: { width: 36, height: 36, borderRadius: 18 },
  ctlBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { flex: 1, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 24,
  },
  overlayCard: { maxWidth: 320, borderRadius: 26, padding: 26, alignItems: 'center' },
  overlayTitle: { fontSize: 24, fontWeight: '900' },
  overlaySub: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  secretRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secretPeg: { width: 30, height: 30, borderRadius: 15 },
  overlayBest: { fontSize: 14, fontWeight: '700', marginTop: 10 },
  playBtn: { marginTop: 18, borderRadius: 999, paddingHorizontal: 34, paddingVertical: 12 },
  playText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});