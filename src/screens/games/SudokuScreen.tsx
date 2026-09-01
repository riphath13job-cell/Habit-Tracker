import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  cloneGrid,
  conflicts,
  generatePuzzle,
  isSolved,
  SUDOKU_DIFFICULTIES,
  type SudokuDifficulty,
  type SudokuPuzzle,
} from '../../games/sudoku';
import { getBestScore, recordLowScore } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

const GIVEN_COLOR = '#A78BFA';
const CONFLICT_COLOR = '#EF4444';

function matchesSolution(grid: (number | null)[][], solution: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export function SudokuScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();

  const [difficulty, setDifficulty] = useState<SudokuDifficulty>(SUDOKU_DIFFICULTIES[1]);
  const [puzzle, setPuzzle] = useState<SudokuPuzzle>(() => generatePuzzle(SUDOKU_DIFFICULTIES[1]));
  const [grid, setGrid] = useState<(number | null)[][]>(() => puzzle.grid);
  const [selected, setSelected] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [best, setBest] = useState(0);

  const puzzleRef = useRef(puzzle);
  const wonRef = useRef(false);
  const secondsRef = useRef(0);
  const bestRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      void getBestScore(`sudoku-${difficulty.id}`).then((b) => {
        bestRef.current = b;
        setBest(b);
      });
    }, [difficulty.id]),
  );

  useEffect(() => {
    if (won) return;
    const t = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, [won, difficulty]);

  function newPuzzle(diff: SudokuDifficulty = difficulty) {
    const p = generatePuzzle(diff);
    puzzleRef.current = p;
    setPuzzle(p);
    setGrid(cloneGrid(p.grid));
    setSelected(null);
    setWon(false);
    wonRef.current = false;
    setMistakes(0);
    secondsRef.current = 0;
    setSeconds(0);
    void getBestScore(`sudoku-${diff.id}`).then((b) => {
      bestRef.current = b;
      setBest(b);
    });
  }

  function finishIfSolved(next: (number | null)[][]) {
    if (wonRef.current) return;
    if (isSolved(next) && matchesSolution(next, puzzleRef.current.solution)) {
      wonRef.current = true;
      setWon(true);
      const s = secondsRef.current;
      void recordLowScore(`sudoku-${difficulty.id}`, s).then(() => {
        void getBestScore(`sudoku-${difficulty.id}`).then((b) => {
          bestRef.current = b;
          setBest(b);
        });
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function entry(value: number) {
    if (selected === null || won) return;
    const r = Math.floor(selected / 9);
    const c = selected % 9;
    if (puzzle.grid[r][c] !== null) return;
    const next = cloneGrid(grid);
    if (conflicts(grid, r, c, value)) {
      setMistakes((m) => m + 1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    next[r][c] = value;
    setGrid(next);
    finishIfSolved(next);
  }

  function erase() {
    if (selected === null || won) return;
    const r = Math.floor(selected / 9);
    const c = selected % 9;
    if (puzzle.grid[r][c] !== null) return;
    const next = cloneGrid(grid);
    next[r][c] = null;
    setGrid(next);
  }

  function hint() {
    if (won) return;
    const next = cloneGrid(grid);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (next[r][c] === null) {
          next[r][c] = puzzleRef.current.solution[r][c];
          setGrid(next);
          finishIfSolved(next);
          return;
        }
      }
    }
  }

  const { width: windowW } = useWindowDimensions();
  const boardSize = Math.min(windowW - 40, 350);
  const cell = Math.floor(boardSize / 9);
  const board = cell * 9;

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
        <Text style={[styles.title, { color: theme.text }]}>🧮 Sudoku</Text>
        <Pressable
          onPress={openFolder}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="folder" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <View style={styles.diffRow}>
        {SUDOKU_DIFFICULTIES.map((d) => {
          const active = d.id === difficulty.id;
          return (
            <Pressable
              key={d.id}
              onPress={() => {
                setDifficulty(d);
                newPuzzle(d);
              }}
              style={[
                styles.diffChip,
                active ? { backgroundColor: theme.accent } : { backgroundColor: theme.card },
              ]}>
              <Text style={[styles.diffLabel, { color: active ? '#FFFFFF' : theme.sub }]}>{d.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.statRow}>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.sub }]}>TIME</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{fmt(seconds)}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.sub }]}>MISTAKES</Text>
          <Text style={[styles.statValue, { color: mistakes > 0 ? CONFLICT_COLOR : theme.text }]}>{mistakes}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.sub }]}>BEST</Text>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{best > 0 ? fmt(best) : '—'}</Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <View style={[styles.board, { width: board, height: board, backgroundColor: theme.card }]}>
          {grid.map((row, r) =>
            row.map((v, c) => {
              const idx = r * 9 + c;
              const given = puzzle.grid[r][c] !== null;
              const sel = selected === idx;
              const conflict = !given && v !== null && conflicts(grid, r, c, v);
              const thickR = r % 3 === 0;
              const thickC = c % 3 === 0;
              return (
                <Pressable
                  key={`${r}-${c}`}
                  onPress={() => setSelected(sel ? null : idx)}
                  style={[
                    styles.cell,
                    {
                      left: c * cell,
                      top: r * cell,
                      width: cell,
                      height: cell,
                      borderTopWidth: thickR ? 2 : 0.5,
                      borderLeftWidth: thickC ? 2 : 0.5,
                      backgroundColor: sel
                        ? `${theme.accent}22`
                        : conflict
                          ? `${CONFLICT_COLOR}1A`
                          : 'transparent',
                    },
                  ]}>
                  {v !== null ? (
                    <Text
                      style={[
                        styles.cellText,
                        { fontSize: cell * 0.44 },
                        given ? { color: GIVEN_COLOR, fontWeight: '900' } : { color: theme.text, fontWeight: '600' },
                        conflict && { color: CONFLICT_COLOR },
                      ]}>
                      {v}
                    </Text>
                  ) : null}
                </Pressable>
              );
            }),
          )}
        </View>

        <View style={[styles.pad, { width: board }]}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => entry(n)}
              style={({ pressed }) => [
                styles.numBtn,
                { backgroundColor: theme.card },
                pressed && { backgroundColor: theme.accent },
              ]}>
              <Text style={[styles.numText, { color: theme.text }]}>{n}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={erase}
            style={[styles.numBtn, { backgroundColor: theme.card }]}>
            <Icon name="close" size={18} color={theme.sub} />
          </Pressable>
        </View>
        <View style={[styles.pad, { width: board }]}>
          {[6, 7, 8, 9].map((n) => (
            <Pressable
              key={n}
              onPress={() => entry(n)}
              style={({ pressed }) => [
                styles.numBtn,
                { backgroundColor: theme.card },
                pressed && { backgroundColor: theme.accent },
              ]}>
              <Text style={[styles.numText, { color: theme.text }]}>{n}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={hint}
          style={({ pressed }) => [styles.footerBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="lightbulb" size={16} color="#F59E0B" />
          <Text style={[styles.footerBtnText, { color: theme.text }]}>Hint</Text>
        </Pressable>
        <Pressable
          onPress={() => newPuzzle()}
          style={({ pressed }) => [styles.footerBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="refresh" size={16} color={theme.accent} />
          <Text style={[styles.footerBtnText, { color: theme.text }]}>New puzzle</Text>
        </Pressable>
        <Pressable
          onPress={erase}
          style={({ pressed }) => [styles.footerBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="delete" size={16} color={CONFLICT_COLOR} />
          <Text style={[styles.footerBtnText, { color: theme.text }]}>Erase</Text>
        </Pressable>
      </View>

      {won ? (
        <View style={styles.overlayBackdrop}>
          <View style={[styles.overlayCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.overlayTitle, { color: theme.text }]}>🎉 Solved!</Text>
            <Text style={[styles.overlaySub, { color: theme.sub }]}>
              {difficulty.label} in {fmt(seconds)}
              {mistakes > 0 ? ` · ${mistakes} mistake${mistakes === 1 ? '' : 's'}` : ' · flawless'}
            </Text>
            {best > 0 && (
              <Text style={[styles.overlayBest, { color: '#F59E0B' }]}>Best: {fmt(best)}</Text>
            )}
            <Pressable
              onPress={() => newPuzzle()}
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
  diffRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  diffChip: { flex: 1, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  diffLabel: { fontSize: 13, fontWeight: '700' },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  statBox: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 8 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 1 },
  board: { position: 'relative', borderRadius: 18, overflow: 'hidden' },
  cell: {
    position: 'absolute',
    borderColor: 'rgba(128,128,128,0.35)',
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { fontWeight: '700' },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
  },
  numBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontSize: 17, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  footerBtnText: { fontSize: 13, fontWeight: '700' },
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