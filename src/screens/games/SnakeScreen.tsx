import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { Cell, Dir } from '../../games/snake';
import { GRID, initialSnake, isOpposite, stepSnake } from '../../games/snake';
import { getBestScore, recordScore } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

const PREF_MIN = 1;
const PREF_MAX = 10;
const KNOB_H = 12;
const KNOB_SIZE = 26;

function prefToDelay(pref: number): number {
  return 253 - pref * 18;
}

function SpeedSlider({
  pref,
  onChange,
}: {
  pref: number;
  onChange: (p: number) => void;
}) {
  const theme = useTheme();
  const [trackW, setTrackW] = useState(0);
  const ratio = (pref - PREF_MIN) / (PREF_MAX - PREF_MIN);

  function applyRatio(r: number) {
    const clamped = Math.max(0, Math.min(1, r));
    const next = Math.round(PREF_MIN + clamped * (PREF_MAX - PREF_MIN));
    if (next !== pref) {
      onChange(next);
      void Haptics.selectionAsync();
    }
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => applyRatio(e.nativeEvent.locationX / Math.max(trackW - KNOB_SIZE, 1)),
      onPanResponderMove: (e) => applyRatio(e.nativeEvent.locationX / Math.max(trackW - KNOB_SIZE, 1)),
    }),
  ).current;

  return (
    <View style={styles.sliderRow}>
      <Text style={[styles.sliderLabel, { color: theme.sub }]}>🐢</Text>
      <View
        {...pan.panHandlers}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        style={[styles.track, { backgroundColor: theme.chipBg }]}>
        <View
          style={[
            styles.fill,
            { width: ratio * Math.max(trackW - KNOB_SIZE, 0), backgroundColor: '#34D399' },
          ]}
        />
        <View
          style={[
            styles.knob,
            {
              left: ratio * Math.max(trackW - KNOB_SIZE, 0),
              backgroundColor: '#FFFFFF',
              borderColor: '#059669',
            },
          ]}
        />
      </View>
      <Text style={[styles.sliderLabel, { color: theme.sub }]}>🐇</Text>
    </View>
  );
}

export function SnakeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();

  const [init] = useState(() => initialSnake());
  const [snake, setSnake] = useState<Cell[]>(init.snake);
  const [food, setFood] = useState<Cell>(init.food);
  const [eaten, setEaten] = useState(0);
  const [pref, setPref] = useState(5);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(0);

  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const dirRef = useRef<Dir>('right');
  const pendingDirs = useRef<Dir[]>([]);
  const eatenRef = useRef(0);
  const bestRef = useRef(0);
  const overRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void getBestScore('snake').then((b) => {
        bestRef.current = b;
        setBest(b);
      });
    }, []),
  );

  const tick = useCallback(() => {
    const nd = pendingDirs.current.shift();
    if (nd && !isOpposite(nd, dirRef.current)) dirRef.current = nd;

    const res = stepSnake(snakeRef.current, dirRef.current, foodRef.current);
    if (!res.alive) {
      overRef.current = true;
      setOver(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (eatenRef.current > bestRef.current) {
        bestRef.current = eatenRef.current;
        setBest(eatenRef.current);
        void recordScore('snake', eatenRef.current);
      }
      return;
    }
    snakeRef.current = res.snake;
    setSnake(res.snake);
    if (res.ate) {
      foodRef.current = res.food;
      setFood(res.food);
      eatenRef.current += 1;
      setEaten(eatenRef.current);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const delay = Math.max(60, prefToDelay(pref) - eaten * 3);

  useEffect(() => {
    if (over) return;
    const iv = setInterval(tick, delay);
    return () => clearInterval(iv);
  }, [delay, over, tick]);

  function newGame() {
    const s = initialSnake();
    snakeRef.current = s.snake;
    foodRef.current = s.food;
    dirRef.current = s.dir;
    pendingDirs.current = [];
    eatenRef.current = 0;
    overRef.current = false;
    setSnake(s.snake);
    setFood(s.food);
    setEaten(0);
    setOver(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function queueDir(dir: Dir) {
    const last = pendingDirs.current[pendingDirs.current.length - 1] ?? dirRef.current;
    if (dir === last || isOpposite(dir, last)) return;
    if (pendingDirs.current.length < 2) pendingDirs.current.push(dir);
    void Haptics.selectionAsync();
  }

  const swipe = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
      onPanResponderRelease: (_e, g) => {
        const { dx, dy } = g;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        queueDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
      },
    }),
  ).current;

  const { width: windowW } = useWindowDimensions();
  const cell = Math.floor(Math.min(windowW - 40, 330) / GRID);
  const boardSize = cell * GRID;

  function ArrowPad() {
    const btn = (dir: Dir, icon: 'arrow-upward' | 'arrow-back' | 'arrow-downward' | 'arrow-forward') => (
      <Pressable
        onPress={() => queueDir(dir)}
        style={({ pressed }) => [
          styles.arrowBtn,
          { backgroundColor: theme.card },
          pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
        ]}>
        <Icon name={icon} size={26} color={theme.accent} />
      </Pressable>
    );
    return (
      <View style={styles.padWrap}>
        <View style={{ alignItems: 'center' }}>{btn('up', 'arrow-upward')}</View>
        <View style={styles.padRow}>
          {btn('left', 'arrow-back')}
          {btn('down', 'arrow-downward')}
          {btn('right', 'arrow-forward')}
        </View>
      </View>
    );
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
        <Text style={[styles.title, { color: theme.text }]}>🐍 Snake</Text>
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
          <Text style={[styles.scoreValue, { color: theme.text }]}>{eaten}</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>BEST</Text>
          <Text style={[styles.scoreValue, { color: '#F59E0B' }]}>{best}</Text>
        </View>
        <Pressable onPress={newGame} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, styles.newBtn]}>
          <LinearGradient colors={['#34D399', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.newGrad}>
            <Icon name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.newText}>New</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={{ alignItems: 'center' }}>
        <View
          {...swipe.panHandlers}
          style={[
            styles.board,
            {
              width: boardSize,
              height: boardSize,
              borderRadius: 14,
              borderColor: theme.border,
              backgroundColor: theme.chipBg,
            },
          ]}>
          {Array.from({ length: GRID * GRID }).map((_, i) => {
            const r = Math.floor(i / GRID);
            const c = i % GRID;
            return (
              <View
                key={`bg-${i}`}
                style={{
                  position: 'absolute',
                  left: c * cell,
                  top: r * cell,
                  width: cell,
                  height: cell,
                  backgroundColor: (r + c) % 2 === 0 ? theme.card : theme.bg,
                }}
              />
            );
          })}
          <View
            style={{
              position: 'absolute',
              left: food.c * cell,
              top: food.r * cell,
              width: cell,
              height: cell,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View style={[styles.food, { backgroundColor: '#F43F5E', borderRadius: cell / 2 }]} />
          </View>
          {snake.map((seg, i) => (
            <View
              key={`seg-${i}`}
              style={[
                styles.segment,
                {
                  left: seg.c * cell,
                  top: seg.r * cell,
                  width: cell - 2,
                  height: cell - 2,
                  borderRadius: Math.round(cell * 0.28),
                  backgroundColor: i === 0 ? '#065F46' : '#10B981',
                  borderWidth: 1,
                  borderColor: theme.bg,
                },
              ]}
            />
          ))}
          {over ? (
            <View style={StyleSheet.absoluteFill}>
              <View style={[styles.overlayBackdrop, { backgroundColor: `${theme.bg}E6` }]} />
              <View style={styles.overlayCenter}>
                <Text style={[styles.overlayTitle, { color: theme.text }]}>💥 Game over</Text>
                <Text style={[styles.overlaySub, { color: theme.sub }]}>
                  Length {snake.length} · score {eaten} · best {best}
                </Text>
                <Pressable onPress={newGame} style={({ pressed }) => [styles.overlayBtn, pressed && { opacity: 0.85 }]}>
                  <LinearGradient colors={['#34D399', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.overlayGrad}>
                    <Text style={styles.overlayBtnText}>Play again</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <ArrowPad />

        <SpeedSlider
          pref={pref}
          onChange={(p) => {
            setPref(p);
          }}
        />
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
    paddingTop: 10,
  },
  chipBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  scoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 7,
    minWidth: 86,
  },
  scoreLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1 },
  scoreValue: { fontSize: 18, fontWeight: '800', marginTop: 1 },
  newBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  newGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  newText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  board: { borderWidth: 1, overflow: 'hidden' },
  segment: { position: 'absolute' },
  food: { width: '62%', height: '62%' },
  overlayBackdrop: { ...StyleSheet.absoluteFill },
  overlayCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 4 },
  overlayTitle: { fontSize: 24, fontWeight: '900' },
  overlaySub: { fontSize: 13.5, fontWeight: '600', marginTop: 2 },
  overlayBtn: { marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  overlayGrad: { paddingHorizontal: 26, paddingVertical: 12 },
  overlayBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  padWrap: { marginTop: 14, gap: 8, alignItems: 'center' },
  padRow: { flexDirection: 'row', gap: 8 },
  arrowBtn: {
    width: 56,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 30,
    marginTop: 14,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  sliderLabel: { fontSize: 16 },
  track: {
    flex: 1,
    maxWidth: 260,
    height: KNOB_H + 14,
    borderRadius: (KNOB_H + 14) / 2,
    justifyContent: 'center',
  },
  fill: { position: 'absolute', left: 0, height: KNOB_H, borderRadius: KNOB_H / 2 },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    borderWidth: 2.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
