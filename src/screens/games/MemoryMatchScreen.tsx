import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getBestScore, recordLowScore } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

const EMOJI_POOL = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🐵', '🦄', '🐙', '🦋', '🌈', '⭐️', '🍀', '🌸', '🍉', '🚀'];
const PAIRS = 8;

interface Card {
  id: number;
  emoji: string;
  matched: boolean;
}

function buildDeck(): Card[] {
  const picked = [...EMOJI_POOL].sort(() => Math.random() - 0.5).slice(0, PAIRS);
  return [...picked, ...picked]
    .map((emoji, i) => ({ emoji, sort: Math.random(), id: i }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ emoji, id }) => ({ id, emoji, matched: false }));
}

function GameCard({
  card,
  flipped,
  size,
  onPress,
}: {
  card: Card;
  flipped: boolean;
  size: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const rot = useRef(new Animated.Value(flipped || card.matched ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(rot, {
      toValue: flipped || card.matched ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, [flipped, card.matched, rot]);

  const rotateY = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });
  const backOpacity = rot.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [1, 1, 0, 0],
    extrapolate: 'clamp',
  });
  const faceOpacity = rot.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp',
  });

  return (
    <Pressable onPress={onPress} disabled={card.matched} style={{ width: size, height: size }}>
      <Animated.View style={[styles.cardInner, { width: size, height: size, transform: [{ rotateY }] }]}>
        <Animated.View
          style={[
            styles.face,
            styles.backFace,
            {
              width: size,
              height: size,
              borderRadius: Math.round(size * 0.16),
              opacity: backOpacity,
              backgroundColor: card.matched ? '#A7F3D0' : '#DB2777',
              borderColor: '#9D174D',
            },
          ]}>
          <Text style={{ fontSize: size * 0.34 }}>❓</Text>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.face,
            styles.frontFace,
            {
              width: size,
              height: size,
              borderRadius: Math.round(size * 0.16),
              opacity: faceOpacity,
              backgroundColor: card.matched ? '#D1FAE5' : theme.card,
              borderColor: card.matched ? '#059669' : theme.border,
            },
          ]}>
          <Text style={{ fontSize: size * 0.52 }}>{card.emoji}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export function MemoryMatchScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();

  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [best, setBest] = useState(0);

  const busyRef = useRef(false);
  const movesRef = useRef(0);
  const bestRef = useRef(0);
  const deckRef = useRef(deck);
  deckRef.current = deck;

  useFocusEffect(
    useCallback(() => {
      void getBestScore('memory').then((b) => {
        bestRef.current = b;
        setBest(b);
      });
    }, []),
  );

  function newGame() {
    setDeck(buildDeck());
    setFlipped([]);
    setMoves(0);
    movesRef.current = 0;
    setMatched(0);
    busyRef.current = false;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function handleFlip(index: number) {
    if (busyRef.current) return;
    if (flipped.includes(index) || deck[index].matched) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const next = [...flipped, index];
    setFlipped(next);
    if (next.length < 2) return;

    movesRef.current += 1;
    setMoves(movesRef.current);

    const [a, b] = next;
    if (deck[a].emoji === deck[b].emoji) {
      busyRef.current = true;
      setTimeout(() => {
        const marked = deck.map((card) =>
          card.id === deck[a].id || card.id === deck[b].id ? { ...card, matched: true } : card,
        );
        setDeck(marked);
        setFlipped([]);
        busyRef.current = false;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const total = marked.filter((card) => card.matched).length / 2;
        setMatched(total);
        if (total === PAIRS) {
          if (bestRef.current === 0 || movesRef.current < bestRef.current) {
            bestRef.current = movesRef.current;
            setBest(movesRef.current);
            void recordLowScore('memory', movesRef.current);
          }
        }
      }, 380);
    } else {
      busyRef.current = true;
      setTimeout(() => {
        setFlipped([]);
        busyRef.current = false;
      }, 720);
    }
  }

  const { width: windowW } = useWindowDimensions();
  const gap = 10;
  const cardSize = Math.floor((Math.min(windowW - 40, 380) - gap * 3) / 4);
  const won = matched === PAIRS;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>🧠 Memory</Text>
        <Pressable
          onPress={openFolder}
          hitSlop={12}
          style={({ pressed }) => [styles.chipBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="folder" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <View style={styles.scoreRow}>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>MOVES</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>{moves}</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>PAIRS</Text>
          <Text style={[styles.scoreValue, { color: '#0891B2' }]}>{matched}/8</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.scoreLabel, { color: theme.sub }]}>BEST</Text>
          <Text style={[styles.scoreValue, { color: '#F59E0B' }]}>{best > 0 ? `${best} mv` : '—'}</Text>
        </View>
        <Pressable onPress={newGame} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, styles.newBtn]}>
          <LinearGradient colors={['#22D3EE', '#0891B2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.newGrad}>
            <Icon name="refresh" size={17} color="#FFFFFF" />
            <Text style={styles.newText}>New</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={{ alignItems: 'center' }}>
        <View style={[styles.grid, { gap }]}>
          {deck.map((card, i) => (
            <GameCard
              key={`${card.id}-${card.emoji}`}
              card={card}
              flipped={flipped.includes(i)}
              size={cardSize}
              onPress={() => handleFlip(i)}
            />
          ))}
        </View>

        {won ? (
          <View style={[styles.winCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.winTitle, { color: theme.text }]}>🎉 Cleared in {moves} moves!</Text>
            <Text style={[styles.winSub, { color: theme.sub }]}>Best: {best > 0 ? `${best} moves` : '—'}</Text>
            <Pressable onPress={newGame} style={({ pressed }) => [pressed && { opacity: 0.85 }, styles.winBtn]}>
              <LinearGradient colors={['#22D3EE', '#0891B2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.winGrad}>
                <Text style={styles.winBtnText}>Shuffle again</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.hint, { color: theme.sub }]}>Find all 8 pairs in as few moves as you can</Text>
        )}
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
  },
  scoreLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  scoreValue: { fontSize: 17, fontWeight: '800', marginTop: 1 },
  newBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  newGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  newText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  cardInner: { position: 'absolute', left: 0, top: 0 },
  face: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  backFace: { zIndex: 1 },
  frontFace: { transform: [{ rotateY: '180deg' }], zIndex: 2 },
  winCard: {
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    gap: 4,
  },
  winTitle: { fontSize: 17, fontWeight: '800' },
  winSub: { fontSize: 13.5 },
  winBtn: { marginTop: 10, borderRadius: 12, overflow: 'hidden' },
  winGrad: { paddingHorizontal: 22, paddingVertical: 11 },
  winBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  hint: { fontSize: 12.5, textAlign: 'center', marginTop: 16, paddingHorizontal: 30 },
});
