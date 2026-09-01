import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { MSBoard, MSDifficulty } from '../../games/minesweeper';
import {
  DIFFICULTIES,
  createBoard,
  flagCount,
  isWin,
  revealAllMines,
  revealCell,
  toggleFlag,
} from '../../games/minesweeper';
import { getBestScore, recordLowScore } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

const NUM_COLORS = ['#2563EB', '#059669', '#DC2626', '#7C3AED', '#D97706', '#0D9488', '#334155', '#9CA3AF'];
const DIFF_ORDER: MSDifficulty[] = ['easy', 'medium', 'hard'];

type Status = 'idle' | 'playing' | 'won' | 'lost';

export function MinesweeperScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();

  const [difficulty, setDifficulty] = useState<MSDifficulty>('easy');
  const [board, setBoard] = useState<MSBoard>(() => createBoard('easy'));
  const [status, setStatus] = useState<Status>('idle');
  const [seconds, setSeconds] = useState(0);
  const [best, setBest] = useState(0);
  const [exploded, setExploded] = useState<[number, number] | null>(null);

  const secondsRef = useRef(0);
  const statusRef = useRef<Status>('idle');
  statusRef.current = status;

  useEffect(() => {
    if (status !== 'playing') return;
    const iv = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => clearInterval(iv);
  }, [status]);

  const scoreKey = `minesweeper-${difficulty}`;

  const loadBest = useCallback((diff: MSDifficulty) => {
    void getBestScore(`minesweeper-${diff}`).then(setBest);
  }, []);

  function resetGame(diff: MSDifficulty = difficulty) {
    setBoard(createBoard(diff));
    setStatus('idle');
    secondsRef.current = 0;
    setSeconds(0);
    setExploded(null);
  }

  function switchDifficulty(diff: MSDifficulty) {
    setDifficulty(diff);
    resetGame(diff);
    loadBest(diff);
    void Haptics.selectionAsync();
  }

  useFocusEffect(
    useCallback(() => {
      loadBest(difficulty);
    }, [difficulty, loadBest]),
  );

  function finishWin() {
    setStatus('won');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t = secondsRef.current;
    if (t > 0 && (best === 0 || t < best)) {
      setBest(t);
      void recordLowScore(scoreKey, t);
    }
  }

  function handleReveal(r: number, c: number) {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return;
    const res = revealCell(board, r, c);
    if (!res.revealedAny && !res.hitMine) return;

    if (res.board.placed && statusRef.current === 'idle') {
      secondsRef.current = 0;
      setSeconds(0);
      setStatus('playing');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (res.hitMine) {
      setExploded([r, c]);
      setBoard(revealAllMines(res.board));
      setStatus('lost');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setBoard(res.board);
    if (isWin(res.board)) finishWin();
  }

  function handleFlag(r: number, c: number) {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return;
    const next = toggleFlag(board, r, c);
    if (next !== board) {
      setBoard(next);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  const { width: windowW } = useWindowDimensions();
  const spec = DIFFICULTIES[difficulty];
  const cell = Math.floor(Math.min(windowW - 36, 350) / spec.cols);
  const boardW = cell * spec.cols;

  const flagsUsed = flagCount(board);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>💣 Minesweeper</Text>
        <Pressable
          onPress={openFolder}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="folder" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <View style={styles.diffRow}>
        {DIFF_ORDER.map((d) => (
          <Pressable
            key={d}
            onPress={() => switchDifficulty(d)}
            style={[
              styles.diffChip,
              { backgroundColor: theme.chipBg },
              difficulty === d && { backgroundColor: '#2563EB' },
            ]}>
            <Text style={[styles.diffText, { color: difficulty === d ? '#FFFFFF' : theme.sub }]}>
              {DIFFICULTIES[d].label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={{ fontSize: 14 }}>🚩</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{spec.mines - flagsUsed}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={{ fontSize: 14 }}>⏱️</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{seconds}s</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Icon name="emoji-events" size={15} color="#F59E0B" />
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{best > 0 ? `${best}s` : '—'}</Text>
        </View>
        <Pressable onPress={() => resetGame()} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, styles.newBtn]}>
          <LinearGradient colors={['#60A5FA', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.newGrad}>
            <Icon name="refresh" size={17} color="#FFFFFF" />
            <Text style={styles.newText}>New</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={{ alignItems: 'center' }}>
        <View style={[styles.board, { borderRadius: 14 }]}>
          {board.cells.map((row, r) => (
            <View key={`row-${r}`} style={{ flexDirection: 'row' }}>
              {row.map((cellState, c) => {
                const isExploded = exploded !== null && exploded[0] === r && exploded[1] === c;
                let bg = '#CDC1B4';
                if (cellState.revealed) bg = cellState.mine ? (isExploded ? '#DC2626' : '#E57373') : '#EFE8DA';
                return (
                  <Pressable
                    key={`${r}-${c}`}
                    onPress={() => handleReveal(r, c)}
                    onLongPress={() => handleFlag(r, c)}
                    delayLongPress={220}
                    style={[
                      styles.cell,
                      {
                        width: cell,
                        height: cell,
                        borderRadius: Math.max(3, Math.round(cell * 0.16)),
                        backgroundColor: bg,
                      },
                      !cellState.revealed && styles.hiddenCell,
                    ]}>
                    <Text style={{ fontSize: cell * 0.55, lineHeight: cell * 0.62 }}>
                      {cellState.flagged && !cellState.revealed ? '🚩' : cellState.revealed && cellState.mine ? '💣' : ''}
                    </Text>
                    {cellState.revealed && !cellState.mine && cellState.adjacent > 0 ? (
                      <Text style={[styles.num, { color: NUM_COLORS[cellState.adjacent - 1], fontSize: cell * 0.52 }]}>
                        {cellState.adjacent}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {status === 'won' || status === 'lost' ? (
          <Text style={[styles.resultLine, { color: status === 'won' ? theme.good : theme.danger }]}>
            {status === 'won'
              ? `Field cleared in ${seconds}s!`
              : 'Boom — that was a mine.'}
          </Text>
        ) : (
          <Text style={styles.resultLine}> </Text>
        )}
        <Text style={[styles.hint, { color: theme.sub }]}>Tap to reveal · long-press to flag</Text>
      </View>
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
  diffRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  diffChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  diffText: { fontSize: 13.5, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 8,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  statValue: { fontSize: 15, fontWeight: '800' },
  newBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  newGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  newText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  board: {
    backgroundColor: '#BBADA0',
    padding: 4,
    overflow: 'hidden',
  },
  cell: { alignItems: 'center', justifyContent: 'center', margin: 0.5 },
  hiddenCell: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  num: { position: 'absolute', fontWeight: '800' },
  resultLine: { fontSize: 14.5, fontWeight: '700', marginTop: 12, minHeight: 18 },
  hint: { fontSize: 12, marginTop: 4 },
});
