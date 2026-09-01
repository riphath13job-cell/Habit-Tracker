import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getBestScore } from '../../db';
import { useHub } from '../../hub/HubContext';
import { useTheme } from '../../theme';

interface GameCardDef {
  route: string;
  emoji: string;
  name: string;
  desc: string;
  colors: [string, string];
  scoreKey: string;
  /** how to render the stored best score */
  format?: (best: number) => string;
}

const GAMES: GameCardDef[] = [
  {
    route: 'Game2048',
    emoji: '🔢',
    name: '2048',
    desc: 'Swipe to merge the tiles',
    colors: ['#F472B6', '#DB2777'],
    scoreKey: '2048',
    format: (b) => `Best ${b}`,
  },
  {
    route: 'Snake',
    emoji: '🐍',
    name: 'Snake',
    desc: 'Steer, feast, don’t bite yourself',
    colors: ['#34D399', '#059669'],
    scoreKey: 'snake',
    format: (b) => `Best ${b}`,
  },
  {
    route: 'Minesweeper',
    emoji: '💣',
    name: 'Minesweeper',
    desc: 'Clear the field, dodge the bombs',
    colors: ['#60A5FA', '#2563EB'],
    scoreKey: 'minesweeper-easy',
    format: (b) => (b > 0 ? `Best ${b}s` : 'Best —'),
  },
  {
    route: 'MemoryMatch',
    emoji: '🧠',
    name: 'Memory Match',
    desc: 'Find every emoji pair',
    colors: ['#22D3EE', '#0891B2'],
    scoreKey: 'memory',
    format: (b) => (b > 0 ? `Best ${b} moves` : 'Best —'),
  },
  {
    route: 'TicTacToe',
    emoji: '⭕',
    name: 'Tic-Tac-Toe',
    desc: 'Beat the unbeatable AI',
    colors: ['#A78BFA', '#7C3AED'],
    scoreKey: 'ttt',
    format: (b) => (b > 0 ? `Best ${b} in a row` : 'No wins yet'),
  },
  {
    route: 'ReactionTap',
    emoji: '⚡',
    name: 'Reaction Tap',
    desc: 'Tap the dot the moment it turns green',
    colors: ['#FBBF24', '#D97706'],
    scoreKey: 'reaction',
    format: (b) => (b > 0 ? `Best ${b}ms` : 'Best —'),
  },
  {
    route: 'Sudoku',
    emoji: '🧮',
    name: 'Sudoku',
    desc: 'Fill 1–9 with no repeats',
    colors: ['#38BDF8', '#0284C7'],
    scoreKey: 'sudoku-easy',
    format: (b) => (b > 0 ? `Best ${Math.floor(b / 60)}:${String(b % 60).padStart(2, '0')} · easy` : 'Best —'),
  },
  {
    route: 'FifteenPuzzle',
    emoji: '🧩',
    name: '15 Puzzle',
    desc: 'Slide the tiles into order',
    colors: ['#A3E635', '#4D7C0F'],
    scoreKey: 'fifteen',
    format: (b) => (b > 0 ? `Best ${b} moves` : 'Best —'),
  },
  {
    route: 'Mastermind',
    emoji: '🎨',
    name: 'Mastermind',
    desc: 'Crack the 4-color code',
    colors: ['#FB7185', '#BE123C'],
    scoreKey: 'mastermind',
    format: (b) => (b > 0 ? `Best ${b} guesses` : 'Best —'),
  },
];

export function GamesHomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();
  const [bests, setBests] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      void Promise.all(
        GAMES.map(async (g) => [g.scoreKey, await getBestScore(g.scoreKey)] as const),
      ).then((pairs) => setBests(Object.fromEntries(pairs)));
    }, []),
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>Games</Text>
          <Text style={[styles.subtitle, { color: theme.sub }]}>Take a break, play a round</Text>
        </View>
        <Pressable
          onPress={openFolder}
          hitSlop={8}
          style={({ pressed }) => [
            styles.folderBtn,
            { backgroundColor: theme.card },
            pressed && { opacity: 0.7 },
          ]}>
          <Icon name="folder" size={24} color={theme.accent} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {GAMES.map((game) => (
          <Pressable
            key={game.route}
            onPress={() => navigation.navigate(game.route)}
            style={({ pressed }) => [
              styles.gameCard,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}>
            <LinearGradient
              colors={game.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gameGrad}>
              <Text style={styles.gameEmoji}>{game.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.gameDesc}>{game.desc}</Text>
                <View style={styles.bestChip}>
                  <Icon name="emoji-events" size={14} color="#FDE68A" />
                  <Text style={styles.bestText}>
                    {game.format
                      ? game.format(bests[game.scoreKey] ?? 0)
                      : `Best ${bests[game.scoreKey] ?? 0}`}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={28} color="rgba(255,255,255,0.85)" />
            </LinearGradient>
          </Pressable>
        ))}

        <View style={[styles.soonCard, { borderColor: theme.border }]}>
          <Icon name="sports-esports" size={22} color={theme.sub} />
          <Text style={[styles.soonText, { color: theme.sub }]}>More games coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  folderBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  gameCard: { borderRadius: 22, overflow: 'hidden' },
  gameGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  gameEmoji: { fontSize: 42 },
  gameName: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  gameDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
  bestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 10,
  },
  bestText: { color: '#FDE68A', fontSize: 12, fontWeight: '700' },
  soonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 22,
    paddingVertical: 26,
  },
  soonText: { fontSize: 14, fontWeight: '600' },
});
