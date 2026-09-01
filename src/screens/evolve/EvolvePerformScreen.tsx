import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Polygon, Text as SvgText } from 'react-native-svg';
import { Icon, type IconName } from '../../icons';
import type { Completion, Goal, Habit } from '../../types';
import { allCompletions, goalHabitIds, listGoals, listHabits } from '../../db';
import { categoryStats, goalProgress, overallScore } from '../../evolve/stats';
import { EVO, EVO_GAP, EVO_SPHERE_COLORS, EVO_STYLES, neon } from '../../evolve/palette';
import { todayKey } from '../../date-utils';
import { GoalEditorModal } from './GoalEditorModal';

const HONEY_W = 330;
const HONEY_H = 300;
const CX = HONEY_W / 2;
const CY = HONEY_H / 2;
const CENTER_R = 52;
const RING_R = 90;
const OUTER_R = 52;

const SPHERE_ICON: Record<string, IconName> = {
  body: 'fitness-center',
  intellect: 'school',
  career: 'flag',
  life: 'favorite',
};

function hexPoints(cx: number, cy: number, r: number): string {
  let pts = '';
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 180) * (30 + 60 * k);
    pts += `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)} `;
  }
  return pts.trim();
}

function ringCenter(k: number): { x: number; y: number } {
  const a = (Math.PI / 180) * (30 + 60 * k);
  return { x: CX + RING_R * Math.cos(a), y: CY + RING_R * Math.sin(a) };
}

export function EvolvePerformScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [links, setLinks] = useState<Map<number, number[]>>(new Map());
  const [editorGoal, setEditorGoal] = useState<Goal | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const load = useCallback(async () => {
    const [hs, cs, gs] = await Promise.all([listHabits(), allCompletions(), listGoals()]);
    setHabits(hs);
    setCompletions(cs);
    setGoals(gs);
    const map = new Map<number, number[]>();
    for (const g of gs) map.set(g.id, await goalHabitIds(g.id));
    setLinks(map);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const cats = categoryStats(habits, completions, 60);
  const score = overallScore(habits, completions, 60);
  const today = todayKey();

  function openNew() {
    setEditorGoal(null);
    setEditorOpen(true);
  }

  return (
    <SafeAreaView style={EVO_STYLES.safe} edges={['top']}>
      <View style={EVO_STYLES.headerRow}>
        <Text style={EVO_STYLES.title}>Performance</Text>
        <Pressable onPress={openNew} hitSlop={8} style={styles.addBtn}>
          <Icon name="add" size={22} color={EVO.accent} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: EVO_GAP }}>
        <View style={[EVO_STYLES.card, styles.honeyCard]}>
          <Svg width={HONEY_W} height={HONEY_H}>
            {[0, 1, 2, 3, 4, 5].map((k) => {
              const center = ringCenter(k);
              const cat = cats[k];
              const color = cat ? EVO_SPHERE_COLORS[cat.sphere] ?? EVO.blue : EVO.border;
              return (
                <Polygon
                  key={k}
                  points={hexPoints(center.x, center.y, OUTER_R)}
                  fill={cat ? 'rgba(12,14,22,0.85)' : 'transparent'}
                  stroke={color}
                  strokeWidth={cat ? 2 : 1}
                  opacity={cat ? 1 : 0.35}
                />
              );
            })}
            <Polygon points={hexPoints(CX, CY, CENTER_R)} fill="rgba(0,217,255,0.10)" stroke={EVO.accent} strokeWidth={2.5} />
            <SvgText x={CX} y={CY - 6} fill={EVO.accent} fontSize={40} fontWeight="800" textAnchor="middle">
              {score}
            </SvgText>
            <SvgText x={CX} y={CY + 18} fill={EVO.sub} fontSize={11} fontWeight="700" letterSpacing={1.2} textAnchor="middle">
              SCORE
            </SvgText>
            {[0, 1, 2, 3, 4, 5].map((k) => {
              const cat = cats[k];
              if (!cat) return null;
              const center = ringCenter(k);
              const color = EVO_SPHERE_COLORS[cat.sphere] ?? EVO.blue;
              return (
                <React.Fragment key={`lab-${k}`}>
                  <Icon2x x={center.x} y={center.y - 12} name={SPHERE_ICON[cat.sphere] ?? 'bolt'} color={color} size={22} />
                  <SvgText x={center.x} y={center.y + 14} fill={EVO.text} fontSize={12.5} fontWeight="800" textAnchor="middle">
                    {cat.rate}%
                  </SvgText>
                  <SvgText x={center.x} y={center.y + 30} fill={EVO.sub} fontSize={10} textAnchor="middle" fontWeight="700">
                    {cat.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        <View>
          <Text style={EVO_STYLES.section}>CATEGORIES</Text>
          <View style={[EVO_STYLES.card, styles.catCard]}>
            {cats.length === 0 ? (
              <Text style={[EVO_STYLES.sub, styles.hint]}>
                No categories yet. Assign a Life Sphere when creating habits.
              </Text>
            ) : (
              cats.map((cat) => {
                const color = EVO_SPHERE_COLORS[cat.sphere] ?? EVO.blue;
                return (
                  <View key={cat.sphere} style={styles.catRow}>
                    <View style={[styles.catDot, { backgroundColor: color }]} />
                    <Text style={styles.catLabel}>{cat.label}</Text>
                    <Text style={[styles.catPercent, { color }]}>{cat.rate}%</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${cat.rate}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View>
          <View style={styles.goalsHeader}>
            <Text style={EVO_STYLES.section}>GOALS</Text>
            <Pressable onPress={openNew} hitSlop={8} style={styles.newGoal}>
              <Icon name="add" size={14} color={EVO.accent} />
              <Text style={styles.newGoalText}>NEW GOAL</Text>
            </Pressable>
          </View>
          {goals.length === 0 ? (
            <View style={[EVO_STYLES.card, styles.goalCard, styles.emptyGoal]}>
              <Icon name="flag" size={26} color={EVO.orange} />
              <Text style={[EVO_STYLES.sub, styles.hint, { textAlign: 'center' }]}>
                Set a goal, link a few habits, and Evolve will tell you if you're ahead of schedule.
              </Text>
            </View>
          ) : (
            goals.map((g) => {
              const linked = habits.filter((h) => links.get(g.id)?.includes(h.id));
              const p = goalProgress(g, linked, completions, today);
              const color = EVO_SPHERE_COLORS[g.sphere] ?? EVO.blue;
              const overdue = g.target_day < today;
              const complete = p.percent >= 100;
              return (
                <Pressable key={g.id} onPress={() => { setEditorGoal(g); setEditorOpen(true); }} style={[EVO_STYLES.card, styles.goalCard]}>
                  <View style={styles.goalHead}>
                    <View style={[styles.goalTitleWrap]}>
                      <View style={[styles.goalSphereDot, { backgroundColor: color }]} />
                      <Text style={styles.goalTitle}>{g.title}</Text>
                    </View>
                    {p.ahead > 0 && !complete ? (
                      <View style={[styles.aheadBadge, neon(EVO.orange, 10)]}>
                        <Text style={styles.aheadText}>AHEAD BY {p.ahead}%</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.goalMeta}>
                    <Text style={[EVO_STYLES.sub, styles.goalMetaText]}>
                      {linked.length} habit{linked.length === 1 ? '' : 's'}
                    </Text>
                    <Text style={[EVO_STYLES.sub, styles.goalMetaText, overdue && styles.overdueText]}>
                      {overdue ? 'OVERDUE' : `DUE ${g.target_day}`}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.min(100, p.percent)}%`, backgroundColor: complete ? EVO.green : EVO.blue },
                      ]}
                    />
                  </View>
                  <Text style={[styles.goalPercent, complete && { color: EVO.green }]}>
                    {complete ? 'Goal complete' : `${p.percent}% Complete`}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <GoalEditorModal
        goal={editorGoal}
        visible={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={load}
      />
    </SafeAreaView>
  );
}

/** Re-mountable small icon placed inside the honeycomb via absolute positioning. */
function Icon2x({ x, y, name, color, size }: { x: number; y: number; name: IconName; color: string; size: number }) {
  return (
    <View style={[styles.svgIcon, { left: x - size / 2, top: y - size / 2 }]}>
      <Icon name={name} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,217,255,0.12)',
  },
  honeyCard: {
    padding: 12,
    alignItems: 'center',
  },
  svgIcon: {
    position: 'absolute',
  },
  catCard: {
    padding: 14,
    gap: 12,
  },
  hint: {
    fontSize: 13,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  catLabel: {
    color: EVO.text,
    fontSize: 13.5,
    fontWeight: '600',
    width: 64,
  },
  catPercent: {
    fontSize: 13.5,
    fontWeight: '800',
    width: 44,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: EVO.cardAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newGoal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,217,255,0.12)',
  },
  newGoalText: {
    color: EVO.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyGoal: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  goalCard: {
    padding: 15,
    marginBottom: EVO_GAP,
  },
  goalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  goalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  goalSphereDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  goalTitle: {
    color: EVO.text,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  aheadBadge: {
    backgroundColor: 'rgba(255,159,28,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  aheadText: {
    color: EVO.orange,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  goalMetaText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  overdueText: {
    color: EVO.red,
    fontWeight: '800',
  },
  goalPercent: {
    color: EVO.blue,
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 10,
  },
});