import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../../icons';
import type { Completion, Habit } from '../../types';
import { allCompletions, listHabits, listGoals } from '../../db';
import { dayKeys, habitAccuracy, habitConsistency, heatmap, hitDays } from '../../evolve/stats';
import { EVO, EVO_GAP, EVO_STYLES, neon } from '../../evolve/palette';

const GAUGE_W = 320;
const GAUGE_H = 190;
const GAUGE_R = 130;
const GAUGE_STROKE = 22;
const HEAT_DAYS = 60;

const HEAT_COLORS = [
  'rgba(0,217,255,0.07)',
  'rgba(0,217,255,0.22)',
  'rgba(0,217,255,0.48)',
  'rgba(0,217,255,1)',
  EVO.green,
];

function shortDate(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function StartupPrompt({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[EVO_STYLES.card, styles.empty, EVO_STYLES.content]}>
      <View style={[styles.emptyBadge, neon(EVO.accent, 14)]}>
        <Icon name="bolt" size={30} color={EVO.accent} />
      </View>
      <Text style={[EVO_STYLES.title, styles.emptyTitle]}>Welcome to Evolve</Text>
      <Text style={[EVO_STYLES.sub, styles.emptyText]}>
        Add a habit to unlock your accuracy, consistency and heatmap.
      </Text>
      <View style={[styles.emptyBtn, neon(EVO.accent, 16)]}>
        <Text style={styles.emptyBtnText}>CREATE A HABIT</Text>
      </View>
    </Pressable>
  );
}

export function EvolveDashboardScreen() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
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

  const hits = hitDays(habits, completions, HEAT_DAYS);
  const accuracy = habitAccuracy(habits, completions, 30);
  const consistency = habitConsistency(habits, completions, 30);
  const heat = heatmap(habits, completions, HEAT_DAYS);
  const keys = dayKeys(HEAT_DAYS);
  const range = `${shortDate(keys[0])} – ${shortDate(keys[keys.length - 1])}`;

  const hasHabits = habits.length > 0;
  const frac = hits / HEAT_DAYS;
  const cx = GAUGE_W / 2;
  const cy = GAUGE_H - 6;
  const largeArc = frac > 0.5 ? 1 : 0;
  const theta = Math.PI * (1 + Math.min(1, Math.max(0, frac)));
  const xE = cx + GAUGE_R * Math.cos(theta);
  const yE = cy + GAUGE_R * Math.sin(theta);
  const progressPath = `M ${cx - GAUGE_R} ${cy} A ${GAUGE_R} ${GAUGE_R} 0 ${largeArc} 1 ${xE.toFixed(2)} ${yE.toFixed(2)}`;
  const trackPath = `M ${cx - GAUGE_R} ${cy} A ${GAUGE_R} ${GAUGE_R} 0 1 1 ${cx + GAUGE_R} ${cy}`;

  return (
    <SafeAreaView style={EVO_STYLES.safe} edges={['top']}>
      <View style={EVO_STYLES.headerRow}>
        <Text style={EVO_STYLES.title}>Evolve</Text>
        <Pressable onPress={() => navigation.navigate('EvolveProfileTab')} hitSlop={8} style={styles.gear}>
          <Icon name="bolt" size={22} color={EVO.accent} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: EVO_GAP }}>
        {!hasHabits ? (
          <StartupPrompt onPress={() => navigation.navigate('EvolveHabitsTab')} />
        ) : (
          <>
            <View style={[EVO_STYLES.card, styles.gaugeCard]}>
              <Text style={[EVO_STYLES.section, { marginBottom: 8 }]}>Habit Accuracy Over 60 Days</Text>
              <View style={styles.gaugeWrap}>
                <Svg width={GAUGE_W} height={GAUGE_H}>
                  <Path d={trackPath} stroke={EVO.border} strokeWidth={GAUGE_STROKE} fill="none" strokeLinecap="round" />
                  <Path
                    d={progressPath}
                    stroke={EVO.accent}
                    strokeWidth={GAUGE_STROKE}
                    fill="none"
                    strokeLinecap="round"
                  />
                </Svg>
                <View style={styles.gaugeCenter}>
                  <View style={styles.gaugeNumberRow}>
                    <Text style={[styles.gaugeValue, neon(EVO.accent, 16)]}>{hits}</Text>
                    <Text style={styles.gaugeOf}>/ {HEAT_DAYS}</Text>
                  </View>
                  <Text style={styles.gaugeLabel}>DAYS ACTIVE</Text>
                  <Text style={styles.gaugeRange}>{range}</Text>
                </View>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={[EVO_STYLES.card, styles.metricCard, neon(EVO.blue, 12)]}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(91,140,255,0.14)' }]}>
                  <Icon name="bolt" size={16} color={EVO.blue} />
                </View>
                <View>
                  <Text style={styles.metricLabel}>HABIT ACCURACY</Text>
                  <Text style={styles.metricValue}>{accuracy}%</Text>
                </View>
              </View>
              <View style={[EVO_STYLES.card, styles.metricCard, neon(EVO.green, 12)]}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(34,255,136,0.14)' }]}>
                  <Icon name="bar-chart" size={16} color={EVO.green} />
                </View>
                <View>
                  <Text style={styles.metricLabel}>CONSISTENCY SCORE</Text>
                  <Text style={styles.metricValue}>{consistency}%</Text>
                </View>
              </View>
            </View>

            <View>
              <Text style={EVO_STYLES.section}>
                {hits}/{HEAT_DAYS} DAYS
              </Text>
              <View style={[EVO_STYLES.card, styles.heatCard]}>
                <View style={styles.heatGrid}>
                  {heat.map((cell) => (
                    <View key={cell.day} style={[styles.heatCell, { backgroundColor: HEAT_COLORS[cell.level] }]} />
                  ))}
                </View>
                <View style={styles.heatLegend}>
                  <Text style={[EVO_STYLES.sub, styles.heatLegendText]}>Less</Text>
                  {HEAT_COLORS.map((c) => (
                    <View key={c} style={[styles.heatLegendCell, { backgroundColor: c }]} />
                  ))}
                  <Text style={[EVO_STYLES.sub, styles.heatLegendText]}>More</Text>
                </View>
              </View>
            </View>

            {goalCount > 0 ? (
              <View style={[EVO_STYLES.card, styles.goalHint]}>
                <Icon name="flag" size={15} color={EVO.orange} />
                <Text style={[EVO_STYLES.sub, styles.goalHintText]}>
                  {goalCount} active goal{goalCount === 1 ? '' : 's'} — track them in Performance.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gear: {
    padding: 6,
  },
  gaugeCard: {
    padding: 16,
    alignItems: 'center',
  },
  gaugeWrap: {
    alignItems: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
    top: GAUGE_H - 86,
    alignItems: 'center',
  },
  gaugeNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  gaugeValue: {
    color: EVO.accent,
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  gaugeOf: {
    color: EVO.sub,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  gaugeLabel: {
    color: EVO.sub,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  gaugeRange: {
    color: EVO.sub,
    fontSize: 12.5,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: EVO_GAP,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    color: EVO.sub,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metricValue: {
    color: EVO.text,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 2,
  },
  heatCard: {
    padding: 14,
  },
  heatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  heatCell: {
    width: 20,
    height: 20,
    borderRadius: 5,
  },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 10,
  },
  heatLegendCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  heatLegendText: {
    fontSize: 10.5,
    marginHorizontal: 3,
  },
  goalHint: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalHintText: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 44,
  },
  emptyBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,217,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: EVO.accent,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyBtnText: {
    color: '#03121A',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});