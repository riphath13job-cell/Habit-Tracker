import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  blankIndex,
  isSolved,
  shuffleBoard,
  slideMove,
  type Board15,
} from '../../games/fifteen';
import { getBestScore, recordLowScore } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

export function FifteenPuzzleScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();

  const [board, setBoard] = useState<Board15>(() => shuffleBoard());
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [best, setBest] = useState(0);

  const boardRef = useRef(board);
  const bestRef = useRef(0);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useFocusEffect(
    useCallback(() => {
      void getBestScore('fifteen').then((b) => {
        bestRef.current = b;
        setBest(b);
      });
    }, []),
  );

  useEffect(() => {
    if (won || moves === 0) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [won, moves]);

  function newGame() {
    const b = shuffleBoard();
    boardRef.current = b;
    setBoard(b);
    setMoves(0);
    setWon(false);
    setSeconds(0);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function pressTile(index: number) {
    if (won) return;
    const slid = slideMove(boardRef.current, index);
    if (!slid) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    boardRef.current = slid;
    setBoard(slid);
    const m = moves + 1;
    setMoves(m);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSolved(slid)) {
      setWon(true);
      void recordLowScore('fifteen', m).then(() => {
        void getBestScore('fifteen').then((b) => {
          bestRef.current = b;
          setBest(b);
        });
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  const { width: windowW } = useWindowDimensions();
  const boardSize = Math.min(windowW - 40, 320);
  const cell = Math.floor(boardSize / 4);
  const boardPx = cell * 4;
  const blank = blankIndex(board);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>🧩 15 Puzzle</Text>
        <Pressable
          onPress={openFolder}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="folder" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <View style={styles.statRow}>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.sub }]}>MOVES</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{moves}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.sub }]}>TIME</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{fmt(seconds)}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.sub }]}>BEST</Text>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{best > 0 ? `${best} moves` : '—'}</Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <View style={[styles.board, { width: boardPx, height: boardPx, backgroundColor: theme.chipBg }]}>
          {board.map((v, i) => {
            const r = Math.floor(i / 4);
            const c = i % 4;
            return (
              <Pressable
                key={i}
                onPress={() => pressTile(i)}
                style={({ pressed }) => [
                  styles.tile,
                  {
                    left: c * cell,
                    top: r * cell,
                    width: cell,
                    height: cell,
                  },
                  pressed && { opacity: 0.75 },
                ]}>
                {v !== 0 ? (
                  <View
                    style={[
                      styles.tileInner,
                      { backgroundColor: theme.card, borderColor: i === blank ? 'transparent' : theme.border },
                    ]}>
                    <Text style={[styles.tileText, { color: theme.text }]}>{v}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.hint, { color: theme.sub }]}>
          Tap any tile in the same row or column as the gap to slide it across.
        </Text>

        <Pressable
          onPress={newGame}
          style={({ pressed }) => [styles.newBtn, { backgroundColor: theme.accent }, pressed && { opacity: 0.85 }]}>
          <Icon name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.newText}>Shuffle</Text>
        </Pressable>
      </View>

      {won ? (
        <View style={styles.overlayBackdrop}>
          <View style={[styles.overlayCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.overlayTitle, { color: theme.text }]}>🧩 Solved!</Text>
            <Text style={[styles.overlaySub, { color: theme.sub }]}>
              {moves} moves in {fmt(seconds)}
            </Text>
            {best > 0 && <Text style={[styles.overlayBest, { color: '#F59E0B' }]}>Best: {best} moves</Text>}
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
  statRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  statBox: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 8 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 1 },
  board: { position: 'relative', borderRadius: 16 },
  tile: { position: 'absolute', padding: 2 },
  tileInner: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { fontSize: 24, fontWeight: '800' },
  hint: { fontSize: 13, textAlign: 'center', marginTop: 18, paddingHorizontal: 30 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 16,
  },
  newText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 24,
  },
  overlayCard: { maxWidth: 320, borderRadius: 26, padding: 26, alignItems: 'center' },
  overlayTitle: { fontSize: 26, fontWeight: '900' },
  overlaySub: { fontSize: 15, fontWeight: '600', marginTop: 6 },
  overlayBest: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  playBtn: { marginTop: 18, borderRadius: 999, paddingHorizontal: 34, paddingVertical: 12 },
  playText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});