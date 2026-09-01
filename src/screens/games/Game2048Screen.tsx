import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { Tile } from '../../games/game2048';
import {
  canMove,
  cleanBoard,
  createBoard,
  maxValue,
  moveBoard,
  spawnTile,
  type Dir,
} from '../../games/game2048';
import { getBestScore, recordScore } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

const TILE_BG: Record<number, string> = {
  2: '#EEE4DA',
  4: '#EDE0C8',
  8: '#F2B179',
  16: '#F59563',
  32: '#F67C5F',
  64: '#F65E3B',
  128: '#EDCF72',
  256: '#EDCC61',
  512: '#EDC850',
  1024: '#EDC53F',
  2048: '#EDC22E',
};
const TILE_FG_DARK = new Set([2, 4]);
const SUPER_BG = '#3C3A32';

function tileBg(value: number): string {
  return TILE_BG[value] ?? SUPER_BG;
}
function tileFg(value: number): string {
  return TILE_FG_DARK.has(value) ? '#776E65' : '#FFFFFF';
}
function tileFont(value: number): number {
  if (value < 100) return 30;
  if (value < 1000) return 25;
  if (value < 10000) return 20;
  return 16;
}

function TileView({ tile, cell, gap }: { tile: Tile; cell: number; gap: number }) {
  const x = useRef(new Animated.Value(gap + (cell + gap) * tile.c)).current;
  const y = useRef(new Animated.Value(gap + (cell + gap) * tile.r)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(x, {
        toValue: gap + (cell + gap) * tile.c,
        useNativeDriver: true,
        stiffness: 320,
        damping: 26,
      }),
      Animated.spring(y, {
        toValue: gap + (cell + gap) * tile.r,
        useNativeDriver: true,
        stiffness: 320,
        damping: 26,
      }),
    ]).start();

    if (tile.isNew) {
      scale.setValue(0);
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
    if (tile.merged) {
      scale.setValue(1);
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.18, duration: 70, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 90, useNativeDriver: true }),
      ]).start();
    }
    if (tile.gone) {
      opacity.setValue(1);
      Animated.timing(opacity, { toValue: 0, duration: 110, delay: 60, useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile.r, tile.c, tile.value]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.tile,
        {
          width: cell,
          height: cell,
          borderRadius: Math.round(cell * 0.14),
          backgroundColor: tileBg(tile.value),
          opacity,
          transform: [{ translateX: x }, { translateY: y }, { scale }],
        },
      ]}>
      <Text style={[styles.tileText, { color: tileFg(tile.value), fontSize: tileFont(tile.value) }]}>
        {tile.value}
      </Text>
    </Animated.View>
  );
}

function Overlay({
  visible,
  title,
  sub,
  buttonLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  visible: boolean;
  title: string;
  sub: string;
  buttonLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.overlayBackdrop} />
      <View style={styles.overlayCenter}>
        <Text style={styles.overlayTitle}>{title}</Text>
        <Text style={styles.overlaySub}>{sub}</Text>
        <Pressable onPress={onPrimary} style={({ pressed }) => [styles.overlayBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.overlayBtnText}>{buttonLabel}</Text>
        </Pressable>
        {secondaryLabel && onSecondary ? (
          <Pressable onPress={onSecondary} hitSlop={8} style={{ marginTop: 12 }}>
            <Text style={styles.overlaySecondary}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Game2048Screen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();

  const [board, setBoard] = useState<Tile[]>(() => createBoard());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);

  const boardRef = useRef(board);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const overRef = useRef(false);
  const busyRef = useRef(false);
  const wonSeenRef = useRef(false);

  boardRef.current = board;

  useFocusEffect(
    useCallback(() => {
      void getBestScore('2048').then((b) => {
        bestRef.current = b;
        setBest(b);
      });
    }, []),
  );

  function bumpScore(gained: number) {
    const next = scoreRef.current + gained;
    scoreRef.current = next;
    setScore(next);
    if (next > bestRef.current) {
      bestRef.current = next;
      setBest(next);
      void recordScore('2048', next);
    }
  }

  function handleMove(dir: Dir) {
    if (overRef.current || busyRef.current) return;
    const res = moveBoard(boardRef.current, dir);
    if (!res.moved) return;

    busyRef.current = true;
    setBoard(res.board);
    boardRef.current = res.board;
    if (res.gained > 0) {
      bumpScore(res.gained);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setTimeout(() => {
      const cleaned = cleanBoard(res.board);
      const withSpawn = spawnTile(cleaned);
      setBoard(withSpawn);
      boardRef.current = withSpawn;

      if (res.reached2048 && !wonSeenRef.current) {
        wonSeenRef.current = true;
        setWon(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (!canMove(withSpawn)) {
        overRef.current = true;
        setOver(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      busyRef.current = false;
    }, 160);
  }

  function newGame() {
    const fresh = createBoard();
    boardRef.current = fresh;
    scoreRef.current = 0;
    overRef.current = false;
    wonSeenRef.current = false;
    busyRef.current = false;
    setBoard(fresh);
    setScore(0);
    setOver(false);
    setWon(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
      onPanResponderRelease: (_e, g) => {
        const { dx, dy } = g;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        const dir: Dir =
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        handleMove(dir);
      },
    }),
  ).current;

  const { width: windowW } = useWindowDimensions();
  const gap = 10;
  const boardSize = Math.min(windowW - 40, 380);
  const cell = (boardSize - gap * 5) / 4;
  const top = maxValue(board.filter((t) => !t.gone));

  const ordered = [...board].sort(
    (a, b) => Number(b.gone ?? false) - Number(a.gone ?? false),
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>2048</Text>
        <Pressable
          onPress={openFolder}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="folder" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <View style={styles.scoreRow}>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>SCORE</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{score}</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>BEST</Text>
          <Text style={[styles.scoreValue, { color: '#F59E0B' }]}>{best}</Text>
        </View>
        <Pressable
          onPress={newGame}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, styles.newBtn]}>
          <LinearGradient colors={['#F472B6', '#DB2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.newGrad}>
            <Icon name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.newText}>New</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.boardWrap} pointerEvents="box-none">
        <View
          {...pan.panHandlers}
          style={[
            styles.board,
            {
              width: boardSize,
              height: boardSize,
              borderRadius: Math.round(gap * 1.6),
              backgroundColor: '#BBADA0',
            },
          ]}>
          {Array.from({ length: 16 }).map((_, i) => {
            const r = Math.floor(i / 4);
            const c = i % 4;
            return (
              <View
                key={`cell-${i}`}
                style={[
                  styles.emptyCell,
                  {
                    width: cell,
                    height: cell,
                    borderRadius: Math.round(cell * 0.14),
                    backgroundColor: '#CDC1B4',
                    transform: [
                      { translateX: gap + (cell + gap) * c },
                      { translateY: gap + (cell + gap) * r },
                    ],
                  },
                ]}
              />
            );
          })}
          {ordered.map((tile) => (
            <TileView key={tile.id} tile={tile} cell={cell} gap={gap} />
          ))}
          <Overlay
            visible={won}
            title="🎉 You made 2048!"
            sub={`Score ${score} · biggest tile ${top}`}
            buttonLabel="Keep playing"
            secondaryLabel="Start over"
            onPrimary={() => setWon(false)}
            onSecondary={newGame}
          />
          <Overlay
            visible={over}
            title="No moves left"
            sub={`Score ${score} · best ${best}`}
            buttonLabel="Try again"
            onPrimary={newGame}
          />
        </View>
      </View>

      <Text style={[styles.hint, { color: theme.sub }]}>
        Swipe anywhere on the board · equal tiles merge
      </Text>
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
  chipBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 10,
  },
  scoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 86,
  },
  scoreLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1 },
  scoreValue: { fontSize: 19, fontWeight: '800', marginTop: 1 },
  newBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  newGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  newText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  boardWrap: { alignItems: 'center' },
  board: { overflow: 'hidden' },
  emptyCell: { position: 'absolute', left: 0, top: 0 },
  tile: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tileText: { fontWeight: '800' },
  hint: { fontSize: 12.5, textAlign: 'center', marginTop: 16, paddingHorizontal: 30 },
  overlayBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(238, 228, 218, 0.73)' },
  overlayCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  overlayTitle: { fontSize: 26, fontWeight: '900', color: '#776E65' },
  overlaySub: { fontSize: 14.5, fontWeight: '600', color: '#776E65', marginTop: 6 },
  overlayBtn: {
    marginTop: 20,
    backgroundColor: '#8F7A66',
    borderRadius: 12,
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  overlaySecondary: { color: '#776E65', fontWeight: '700', fontSize: 13.5 },
});

