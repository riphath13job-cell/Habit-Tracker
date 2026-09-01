import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icon, type IconName } from '../../icons';
import type { Completion, Habit } from '../../types';
import { allCompletions, listGoals, listHabits } from '../../db';
import { bestStreak } from '../../date-utils';
import { hitDays, longestStreak, perHabitDone } from '../../evolve/stats';
import { EVO, EVO_GAP, EVO_SPHERE_COLORS, EVO_STYLES, neon } from '../../evolve/palette';

const SPHERE_ICON: Record<string, IconName> = {
  body: 'fitness-center',
  intellect: 'school',
  career: 'flag',
  life: 'favorite',
};

interface StatCard {
  label: string;
  value: string;
  color: string;
  icon: IconName;
}

export function EvolveProfileScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [goalCount, setGoalCount] = useState(0);

  const load = useCallback(async () => {
    const [hs, cs, gs] = await Promise.all([listHabits(), allCompletions(), listGoals()]);
    setHabits(hs);
    setCompletions(cs);
    setGoalCount(gs.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const doneByHabit = perHabitDone(completions);
  const dayCount = hitDays(habits, completions, 60);
  const streaks = habits
    .map((h) => ({ habit: h, streak: bestStreak(h, doneByHabit.get(h.id) ?? new Set()) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3);

  const sphereCount = new Map<string, number>();
  for (const h of habits) {
    const key = h.sphere ?? 'body';
    sphereCount.set(key, (sphereCount.get(key) ?? 0) + 1);
  }

  const stats: StatCard[] = [
    { label: 'Habits', value: String(habits.length), color: EVO.accent, icon: 'fitness-center' },
    { label: 'Check-ins', value: String(completions.length), color: EVO.green, icon: 'check' },
    { label: 'Best streak', value: `${longestStreak(habits, completions)}d`, color: EVO.orange, icon: 'emoji-events' },
    { label: 'Days active', value: `${dayCount}/60`, color: EVO.yellow, icon: 'today' },
  ];

  return (
    <SafeAreaView style={EVO_STYLES.safe} edges={['top']}>
      <View style={EVO_STYLES.headerRow}>
        <Text style={EVO_STYLES.title}>Profile</Text>
        <View style={[styles.onlineDot, neon(EVO.green, 10)]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: EVO_GAP }}>
        <View style={[EVO_STYLES.card, styles.hero, neon(EVO.blue, 14)]}>
          <View style={[styles.avatar, neon(EVO.accent, 18)]}>
            <Icon name="bolt" size={40} color={EVO.accent} />
          </View>
          <Text style={styles.heroTitle}>Evolve</Text>
          <Text style={[EVO_STYLES.sub, styles.heroSub]}>
            Gamified habit tracking · {habits.length} active habit{habits.length === 1 ? '' : 's'}
          </Text>
          <View style={styles.heroGoals}>
            <Text style={styles.heroGoalsText}>
              🎯 {goalCount} goal{goalCount === 1 ? '' : 's'} in flight
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[EVO_STYLES.card, styles.statCard, neon(s.color, 10)]}>
              <View style={[styles.statIcon, { backgroundColor: `${s.color}1f` }]}>
                <Icon name={s.icon} size={16} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View>
          <Text style={EVO_STYLES.section}>LIFE SPHERES</Text>
          <View style={[EVO_STYLES.card, styles.sphereCard]}>
            {habits.length === 0 ? (
              <Text style={[EVO_STYLES.sub, styles.hint]}>
                Assign a Life Sphere when creating habits to see the breakdown here.
              </Text>
            ) : (
              Object.entries(sphereCount)
                .sort((a, b) => b[1] - a[1])
                .map(([sphere, count]) => {
                  const color = EVO_SPHERE_COLORS[sphere] ?? EVO.blue;
                  const label = (() => {
                    switch (sphere) {
                      case 'body':
                        return 'Body';
                      case 'intellect':
                        return 'Intellect';
                      case 'career':
                        return 'Career';
                      case 'life':
                        return 'Life';
                      default:
                        return sphere;
                    }
                  })();
                  const pct = Math.round((count / habits.length) * 100);
                  return (
                    <View key={sphere} style={styles.sphereRow}>
                      <View style={[styles.sphereIcon, { backgroundColor: `${color}1f` }]}>
                        <Icon name={SPHERE_ICON[sphere] ?? 'bolt'} size={15} color={color} />
                      </View>
                      <Text style={styles.sphereLabel}>{label}</Text>
                      <Text style={[styles.sphereCount, { color }]}>{count}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                      </View>
                    </View>
                  );
                })
            )}
          </View>
        </View>

        <View>
          <Text style={EVO_STYLES.section}>TOP STREAKS</Text>
          {streaks.length === 0 ? (
            <View style={[EVO_STYLES.card, styles.emptyStreak]}>
              <Text style={[EVO_STYLES.sub, styles.hint]}>
                Complete habits on consecutive days to grow your streaks.
              </Text>
            </View>
          ) : (
            <View style={[EVO_STYLES.card, styles.streakCard]}>
              {streaks.map(({ habit, streak }, i) => {
                const color = streak > 0 ? EVO.orange : EVO.sub;
                return (
                  <View key={habit.id} style={[styles.streakRow, i < streaks.length - 1 && { borderBottomColor: EVO.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={styles.streakEmoji}>{habit.emoji ?? '✅'}</Text>
                    <Text style={styles.streakName}>{habit.name}</Text>
                    <View style={[styles.pill, streak > 0 && neon(EVO.orange, 10)]}>
                      <Text style={[styles.pillText, { color }]}>🔥 {streak} days</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: EVO.green,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 26,
    gap: 6,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(0,217,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    color: EVO.text,
    fontSize: 24,
    fontWeight: '800',
  },
  heroSub: {
    fontSize: 13,
  },
  heroGoals: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,210,63,0.1)',
  },
  heroGoalsText: {
    color: EVO.yellow,
    fontSize: 12.5,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: EVO_GAP,
  },
  statCard: {
    width: '47%',
    padding: 14,
    gap: 6,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    color: EVO.sub,
    fontSize: 12,
    fontWeight: '600',
  },
  sphereCard: {
    padding: 14,
    gap: 12,
  },
  hint: {
    fontSize: 13,
  },
  sphereRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sphereIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereLabel: {
    color: EVO.text,
    fontSize: 14,
    fontWeight: '700',
    width: 76,
  },
  sphereCount: {
    fontSize: 14,
    fontWeight: '800',
    width: 22,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: EVO.cardAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: 7,
    borderRadius: 4,
  },
  emptyStreak: {
    padding: 18,
  },
  streakCard: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakName: {
    color: EVO.text,
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,159,28,0.14)',
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
});