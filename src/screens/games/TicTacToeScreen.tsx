import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { Board, Cell, WinResult } from '../../games/tictactoe';
import { bestMove, emptyBoard, isFull, winner } from '../../games/tictactoe';
import { getBestScore, getPref, recordScore, setPref } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

const X_COLOR = '#A78BFA';
const O_COLOR = '#22D3EE';
const AI_DELAY = 420;

interface Tally {
  wins: number;
  losses: number;
  draws: number;
}

async function loadTally(): Promise<Tally> {
  const [w, l, d] = await Promise.all([
    getPref('ttt_wins'),
    getPref('ttt_losses'),
    getPref('ttt_draws'),
  ]);
  return {
    wins: Number(w ?? '0') || 0,
    losses: Number(l ?? '0') || 0,
    draws: Number(d ?? '0') || 0,
  };
}

async function saveTally(t: Tally): Promise<void> {
  await Promise.all([
    setPref('ttt_wins', String(t.wins)),
    setPref('ttt_losses', String(t.losses)),
    setPref('ttt_draws', String(t.draws)),
  ]);
}

function Mark({ cell, size }: { cell: Exclude<Cell, null>; size: number }) {
  if (cell === 'X') {
    return <Text style={[styles.markX, { fontSize: size * 0.52 }]}>✕</Text>;
  }
  return (
    <View
      style={{
        width: size * 0.62,
        height: size * 0.62,
        borderRadius: size,
        borderWidth: size * 0.06,
        borderColor: O_COLOR,
      }}
    />
  );
}

export function TicTacToeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();

  const [board, setBoard] = useState<Board>(emptyBoard);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<{ kind: 'win'; player: 'X' | 'O'; line: number[] } | {
    kind: 'draw';
    line: null;
  } | null>(null);
  const [tally, setTally] = useState<Tally>({ wins: 0, losses: 0, draws: 0 });
  const [best, setBest] = useState(0);

  const boardRef = useRef(board);
  const overRef = useRef(false);
  const busyRef = useRef(false);
  const tallyRef = useRef(tally);
  const streakRef = useRef(0);
  const bestRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      void loadTally().then((t) => {
        tallyRef.current = t;
        setTally(t);
      });
      void getBestScore('ttt').then((b) => {
        bestRef.current = b;
        setBest(b);
      });
    }, []),
  );

  function resolve(line: WinResult | null) {
    overRef.current = true;
    busyRef.current = false;
    setThinking(false);
    if (line) {
      setResult({ kind: 'win', player: line.player, line: [...line.line] });
      void Haptics.notificationAsync(
        line.player === 'X' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
      const next = { ...tallyRef.current };
      if (line.player === 'X') {
        streakRef.current += 1;
        if (streakRef.current > bestRef.current) {
          bestRef.current = streakRef.current;
          setBest(streakRef.current);
          void recordScore('ttt', streakRef.current);
        }
        next.wins += 1;
      } else {
        streakRef.current = 0;
        next.losses += 1;
      }
      tallyRef.current = next;
      setTally(next);
      void saveTally(next);
    } else {
      setResult({ kind: 'draw', line: null });
      const next = { ...tallyRef.current, draws: tallyRef.current.draws + 1 };
      tallyRef.current = next;
      setTally(next);
      void saveTally(next);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function aiTurn() {
    const b = [...boardRef.current];
    const move = bestMove(b, 'O');
    b[move] = 'O';
    boardRef.current = b;
    setBoard(b);
    const w = winner(b);
    if (w || isFull(b)) {
      resolve(w);
      return;
    }
    setThinking(false);
    busyRef.current = false;
  }

  function handleCell(index: number) {
    if (busyRef.current || overRef.current) return;
    const b = [...boardRef.current];
    if (b[index] !== null) return;
    b[index] = 'X';
    boardRef.current = b;
    setBoard(b);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const w = winner(b);
    if (w || isFull(b)) {
      resolve(w);
      return;
    }

    busyRef.current = true;
    setThinking(true);
    setTimeout(aiTurn, AI_DELAY);
  }

  function newGame() {
    const b = emptyBoard();
    boardRef.current = b;
    overRef.current = false;
    busyRef.current = false;
    setBoard(b);
    setThinking(false);
    setResult(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  const { width: windowW } = useWindowDimensions();
  const cell = Math.floor(Math.min(windowW - 44, 312) / 3);
  const boardSize = cell * 3;

  const status = result
    ? result.kind === 'win'
      ? result.player === 'X'
        ? 'You win!'
        : 'The AI wins'
      : "Cat's game"
    : thinking
      ? 'Thinking…'
      : 'Your turn';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>⭕ Tic-Tac-Toe</Text>
        <Pressable
          onPress={openFolder}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="folder" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <View style={styles.scoreRow}>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>WINS</Text>
          <Text style={[styles.scoreValue, { color: X_COLOR }]}>{tally.wins}</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>LOSSES</Text>
          <Text style={[styles.scoreValue, { color: O_COLOR }]}>{tally.losses}</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>DRAWS</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{tally.draws}</Text>
        </View>
        <Pressable onPress={newGame} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, styles.newBtn]}>
          <LinearGradient colors={['#A78BFA', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.newGrad}>
            <Icon name="refresh" size={17} color="#FFFFFF" />
            <Text style={styles.newText}>New</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={{ alignItems: 'center' }}>
        <View
          style={[
            styles.board,
            {
              width: boardSize,
              height: boardSize,
              borderRadius: 22,
              borderColor: theme.border,
              backgroundColor: theme.chipBg,
            },
          ]}>
          {board.map((c, i) => {
            const r = Math.floor(i / 3);
            const col = i % 3;
            const winCell = result?.kind === 'win' && result.line.includes(i);
            const accent = result?.kind === 'win' && result.player === 'X' ? X_COLOR : O_COLOR;
            return (
              <Pressable
                key={`cell-${i}`}
                onPress={() => handleCell(i)}
                disabled={busyRef.current || overRef.current || c !== null}
                style={[
                  styles.cell,
                  {
                    left: col * cell,
                    top: r * cell,
                    width: cell,
                    height: cell,
                    backgroundColor: winCell ? `${accent}26` : 'transparent',
                  },
                ]}>
                <View
                  style={[
                    styles.cellInner,
                    {
                      width: cell - 4,
                      height: cell - 4,
                      borderRadius: 16,
                      borderColor: r === 2 || col === 2 ? 'transparent' : theme.border,
                      backgroundColor: (r + col) % 2 === 0 ? theme.card : 'transparent',
                    },
                  ]}>
                  {c ? <Mark cell={c} size={cell} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.statusRow, { backgroundColor: theme.card }]}>
          <View style={styles.statusDotWrap}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: result
                    ? result.kind === 'win'
                      ? result.player === 'X'
                        ? X_COLOR
                        : O_COLOR
                      : theme.sub
                    : thinking
                      ? O_COLOR
                      : X_COLOR,
                },
              ]}
            />
          </View>
          <Text style={[styles.statusText, { color: result && result.kind === 'win' && result.player === 'X' ? X_COLOR : theme.text }]}>
            {status}
          </Text>
          <View style={[styles.bestChip, { backgroundColor: theme.chipBg }]}>
            <Icon name="star" size={13} color="#F59E0B" />
            <Text style={[styles.bestText, { color: '#F59E0B' }]}>
              {best > 0 ? `Best ${best} win streak` : 'Best —'}
            </Text>
          </View>
        </View>

        {!result ? (
          <Text style={[styles.hint, { color: theme.sub }]}>You're ✕ — the AI is unstoppable, beat it anyway</Text>
        ) : null}
      </View>

      {result ? (
        <View style={styles.overlayBackdrop}>
          <LinearGradient
            colors={result.kind === 'win' && result.player === 'X' ? ['#A78BFA', '#7C3AED'] : ['#22D3EE', '#0E7490']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.overlayGrader}>
            <Text style={styles.overlayTitle}>
              {result.kind === 'win'
                ? result.player === 'X'
                  ? '🎉 You win!'
                  : '🤖 The AI wins'
                : '🤝 Cat\x27s game'}
            </Text>
            <Text style={styles.overlaySub}>
              {result.kind === 'win'
                ? result.player === 'X'
                  ? `Record ${tally.wins} wins${best > 0 ? ` · best streak ${best}` : ''}`
                  : `Score stands at ${tally.wins}–${tally.losses}`
                : 'No winners this round'}
            </Text>
            <Pressable onPress={newGame} style={({ pressed }) => [styles.overlayBtn, pressed && { opacity: 0.85 }]}>
              <LinearGradient colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.10)']} style={styles.overlayBtnGrad}>
                <Text style={styles.overlayBtnText}>Play again</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
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
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 8,
  },
  scoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 58,
  },
  scoreLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  scoreValue: { fontSize: 17, fontWeight: '800', marginTop: 1 },
  newBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  newGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  newText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  board: { borderWidth: 1, overflow: 'hidden' },
  cell: { position: 'absolute', padding: 2 },
  cellInner: {
    flex: 1,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markX: { color: X_COLOR, fontWeight: '900' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  statusDotWrap: { flexDirection: 'row' },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusText: { fontSize: 15, fontWeight: '800' },
  bestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 4,
  },
  bestText: { fontSize: 11.5, fontWeight: '700' },
  hint: { fontSize: 12.5, textAlign: 'center', marginTop: 14, paddingHorizontal: 30 },
  overlayGrader: {
    margin: 24,
    borderRadius: 26,
    paddingVertical: 30,
    paddingHorizontal: 26,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  overlayTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  overlaySub: { color: 'rgba(255,255,255,0.9)', fontSize: 13.5, fontWeight: '600', marginTop: 4 },
  overlayBtn: { marginTop: 18, borderRadius: 13, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  overlayBtnGrad: { paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});