import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from '../../icons';
import { useTheme } from '../../theme';
import { ProgressRing } from '../../components/ProgressRing';
import { useHub } from '../../hub/HubContext';
import { switchToApp, type AppKey } from '../../hub/navigation';
import type {
  BudgetPrefs,
  DailyRoutineItem,
  FocusSession,
  Habit,
  SleepEntry,
  Todo,
  Transaction,
} from '../../types';
import {
  allCompletions,
  dailyRoutineCompletions,
  getBudgetPrefs,
  getFocusSessionsBetween,
  getMoodEntry,
  getTransactionsBetween,
  getWaterPrefs,
  listAllDailyRoutineItems,
  listAllTodos,
  listHabits,
  listSleepEntries,
  sleepDurationMinutes,
  waterLogsFor,
} from '../../db';
import {
  addDays,
  dayKey,
  isScheduled,
  routineDayKey,
  todayKey,
} from '../../date-utils';
import {
  currentMonthKey,
  formatMoney,
  monthRange,
  totalSpent,
} from '../../spend/stats';

const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});
const TIME_FMT = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

const MOOD_FACE = ['', '😞', '😕', '😐', '🙂', '😄'];
const BUCKETS: Record<'habits' | 'tasks' | 'water' | 'focus' | 'routines' | 'mood' | 'sleep' | 'spend', IconName> = {
  habits: 'check-circle',
  tasks: 'edit-note',
  water: 'water',
  focus: 'alarm',
  routines: 'sync',
  mood: 'favorite',
  sleep: 'bedtime',
  spend: 'shopping-cart',
};

interface Dashboard {
  habits: Habit[];
  doneToday: Set<number>;
  todos: Todo[];
  waterTodayMl: number;
  waterTargetMl: number;
  focusTodayMinutes: number;
  focusCompleted: number;
  routineItems: DailyRoutineItem[];
  routineComps: Set<number>;
  moodToday: number | null;
  lastSleep: SleepEntry | null;
  monthSpent: number;
  monthlyBudget: number | null;
}

export function HomeScreen() {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const { width: winWidth } = useWindowDimensions();
  const { openFolder } = useHub();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [now, setNow] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, []),
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function loadDashboard() {
    const today = todayKey();
    const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const [habits, completions, todos, waterLogs, waterPrefs, focusSessions, routineItems, routineComps, mood, sleepEntries, monthTxs, budgetPrefs] =
      await Promise.all([
        listHabits(),
        allCompletions(),
        listAllTodos(),
        waterLogsFor(today),
        getWaterPrefs(),
        getFocusSessionsBetween(startMs, Date.now()),
        listAllDailyRoutineItems(),
        dailyRoutineCompletions(routineDayKey()),
        getMoodEntry(today),
        listSleepEntries(2),
        getTransactionsOfMonth(),
        getBudgetPrefs(),
      ]);

    const doneToday = new Set<number>();
    for (const c of completions) if (c.day === today) doneToday.add(c.habit_id);

    const focusMin = focusSessions.reduce((s, f: FocusSession) => s + (f.focus_minutes || 0), 0);
    const focusDone = focusSessions.filter((f: FocusSession) => f.completed === 1).length;

    let lastSleep: SleepEntry | null = null;
    for (const e of sleepEntries) {
      if (e.day === today || e.day === dayKey(addDays(new Date(), -1))) {
        lastSleep = e;
        break;
      }
    }

    setDashboard({
      habits,
      doneToday,
      todos,
      waterTodayMl: waterLogs.reduce((s, w) => s + w.ml, 0),
      waterTargetMl: waterPrefs?.target_ml ?? 0,
      focusTodayMinutes: focusMin,
      focusCompleted: focusDone,
      routineItems,
      routineComps: new Set(routineComps.map((c) => c.item_id)),
      moodToday: mood?.mood ?? null,
      lastSleep,
      monthSpent: totalSpent(monthTxs),
      monthlyBudget: budgetPrefs?.monthly_budget_cents ?? null,
    });
  }

  async function getTransactionsOfMonth(): Promise<Transaction[]> {
    const r = monthRange(currentMonthKey());
    return getTransactionsBetween(r.start, r.end);
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const scheduled = dashboard.habits.filter((h) => isScheduled(h, now));
  const doneCount = scheduled.filter((h) => dashboard.doneToday.has(h.id)).length;
  const openTodos = dashboard.todos.filter((t) => !t.done);
  const overdue = openTodos.filter((t) => t.due_at && t.due_at < Date.now()).length;
  const habitsUndone = scheduled.filter((h) => !dashboard.doneToday.has(h.id)).slice(0, 3);

  const waterPct = dashboard.waterTargetMl > 0 ? dashboard.waterTodayMl / dashboard.waterTargetMl : 0;
  const habitsPct = scheduled.length > 0 ? doneCount / scheduled.length : 0;
  const routineTotal = dashboard.routineItems.length;
  const routineDone = routineTotal
    ? dashboard.routineItems.filter((i) => dashboard.routineComps.has(i.id)).length
    : routineTotal;
  const routinePct = routineTotal > 0 ? routineDone / routineTotal : 0;
  const sleepHours = dashboard.lastSleep
    ? Math.round(sleepDurationMinutes(dashboard.lastSleep.bed_minutes, dashboard.lastSleep.wake_minutes) / 6) / 10
    : null;
  const spendPct =
    dashboard.monthlyBudget && dashboard.monthlyBudget > 0
      ? dashboard.monthSpent / dashboard.monthlyBudget
      : 0;

  const isWide = winWidth >= 900;
  const cardMinWidth = isWide ? 320 : 0;
  const cardStyle = isWide
    ? { flexBasis: '46%', flexGrow: 1, minWidth: cardMinWidth }
    : { flexBasis: '100%' };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Clock / header */}
        <View style={styles.clockCard}>
          <BlurView
            intensity={dark ? 30 : 50}
            tint={dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={
              dark
                ? ['rgba(99, 102, 241, 0.22)', 'rgba(0, 0, 0, 0)']
                : ['rgba(99, 102, 241, 0.18)', 'rgba(255, 255, 255, 0)']
            }
            locations={[0, 0.8]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.clockRow}>
            <View style={styles.clockMain}>
              <Text style={[styles.clockTime, { color: theme.text }]}>{TIME_FMT.format(now)}</Text>
              <Text style={[styles.clockDate, { color: theme.sub }]}>{DATE_FMT.format(now)}</Text>
            </View>
            <Pressable style={styles.folderBtn} onPress={openFolder} hitSlop={8}>
              <Icon name="widgets" size={22} color={theme.accent} />
            </Pressable>
          </View>
        </View>

        <View style={styles.grid}>
          {/* Habits */}
          <Widget
            style={cardStyle}
            theme={theme}
            dark={dark}
            title="Habits"
            icon={BUCKETS.habits}
            accent={dark ? '#818CF8' : '#6366F1'}
            onPress={() => switchToApp('HabitApp' as AppKey)}>
            <View style={styles.widgetBody}>
              <ProgressRing
                size={96}
                stroke={9}
                progress={habitsPct}
                label={`${doneCount}/${scheduled.length}`}
                sub="today"
                color={dark ? '#818CF8' : '#6366F1'}
                trackColor={theme.border}
                textColor={theme.text}
              />
              <View style={styles.checkList}>
                {habitsUndone.length === 0 ? (
                  <Text style={[styles.emptyLine, { color: theme.sub }]}>All done — great job! 🎉</Text>
                ) : (
                  habitsUndone.map((h) => (
                    <View key={h.id} style={styles.checkRow}>
                      <Text style={styles.smallEmoji}>{h.emoji}</Text>
                      <Text style={[styles.checkText, { color: theme.text }]} numberOfLines={1}>
                        {h.name}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </Widget>

          {/* Tasks */}
          <Widget
            style={cardStyle}
            theme={theme}
            dark={dark}
            title="Tasks"
            icon={BUCKETS.tasks}
            accent={dark ? '#4ADE80' : '#059669'}
            onPress={() => switchToApp('TodoApp' as AppKey)}>
            <View style={styles.widgetBody}>
              <View style={styles.bigStat}>
                <Text style={[styles.bigNum, { color: theme.text }]}>{openTodos.length}</Text>
                <Text style={[styles.bigLabel, { color: theme.sub }]}>open</Text>
              </View>
              <View style={styles.checkList}>
                <View style={styles.checkRow}>
                  <Icon name="alarm" size={16} color={theme.sub} />
                  <Text style={[styles.checkText, { color: theme.sub }]}>
                    {overdue} overdue
                  </Text>
                </View>
                {openTodos.slice(0, 2).map((t) => (
                  <Text key={t.id} style={[styles.checkText, { color: theme.text }]} numberOfLines={1}>
                    • {t.title}
                  </Text>
                ))}
              </View>
            </View>
          </Widget>

          {/* Water */}
          <Widget
            style={cardStyle}
            theme={theme}
            dark={dark}
            title="Water"
            icon={BUCKETS.water}
            accent="#0EA5E9"
            onPress={() => switchToApp('WaterApp' as AppKey)}>
            <View style={styles.widgetBody}>
              <ProgressRing
                size={96}
                stroke={9}
                progress={waterPct}
                label={`${Math.round(dashboard.waterTodayMl / 250)}`}
                sub="glasses"
                color="#0EA5E9"
                trackColor={theme.border}
                textColor={theme.text}
              />
              <Text style={[styles.subStat, { color: theme.sub }]}>
                {dashboard.waterTodayMl.toLocaleString()} / {dashboard.waterTargetMl.toLocaleString()} ml
              </Text>
            </View>
          </Widget>

          {/* Focus / Pomodoro */}
          <Widget
            style={cardStyle}
            theme={theme}
            dark={dark}
            title="Focus"
            icon={BUCKETS.focus}
            accent="#F43F5E"
            onPress={() => switchToApp('FocusApp' as AppKey)}>
            <View style={styles.widgetBody}>
              <View style={styles.bigStat}>
                <Text style={[styles.bigNum, { color: theme.text }]}>{dashboard.focusTodayMinutes}</Text>
                <Text style={[styles.bigLabel, { color: theme.sub }]}>min focused today</Text>
              </View>
              <Text style={[styles.subStat, { color: theme.sub }]}>
                {dashboard.focusCompleted} block{dashboard.focusCompleted === 1 ? '' : 's'} completed
              </Text>
            </View>
          </Widget>

          {/* Routines */}
          <Widget
            style={cardStyle}
            theme={theme}
            dark={dark}
            title="Routines"
            icon={BUCKETS.routines}
            accent={dark ? '#2DD4BF' : '#0F766E'}
            onPress={() => switchToApp('RoutinesApp' as AppKey)}>
            <View style={styles.widgetBody}>
              <ProgressRing
                size={96}
                stroke={9}
                progress={routinePct}
                label={`${routineDone}/${routineTotal}`}
                sub="today"
                color={dark ? '#2DD4BF' : '#0F766E'}
                trackColor={theme.border}
                textColor={theme.text}
              />
              <View style={styles.checkList}>
                {routineTotal === 0 ? (
                  <Text style={[styles.emptyLine, { color: theme.sub }]}>No routines yet</Text>
                ) : (
                  dashboard.routineItems.slice(0, 3).map((i) => (
                    <View key={i.id} style={styles.checkRow}>
                      <Icon
                        name={dashboard.routineComps.has(i.id) ? 'check-circle' : 'radio-button-unchecked'}
                        size={17}
                        color={dashboard.routineComps.has(i.id) ? '#10B981' : theme.sub}
                      />
                      <Text style={[styles.checkText, { color: theme.text }]} numberOfLines={1}>
                        {i.title}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </Widget>

          {/* Mood */}
          <Widget
            style={cardStyle}
            theme={theme}
            dark={dark}
            title="Mood"
            icon={BUCKETS.mood}
            accent="#EC4899"
            onPress={() => switchToApp('MoodApp' as AppKey)}>
            <View style={styles.widgetBody}>
              <Text style={styles.moodFace}>
                {dashboard.moodToday ? MOOD_FACE[dashboard.moodToday] : '—'}
              </Text>
              <Text style={[styles.subStat, { color: theme.sub }]}>
                {dashboard.moodToday ? `Today: ${MOOD_FACE[dashboard.moodToday]}` : 'No mood logged today'}
              </Text>
            </View>
          </Widget>

          {/* Sleep */}
          <Widget
            style={cardStyle}
            theme={theme}
            dark={dark}
            title="Sleep"
            icon={BUCKETS.sleep}
            accent="#818CF8"
            onPress={() => switchToApp('SleepApp' as AppKey)}>
            <View style={styles.widgetBody}>
              <View style={styles.bigStat}>
                <Text style={[styles.bigNum, { color: theme.text }]}>
                  {sleepHours == null ? '—' : `${sleepHours}h`}
                </Text>
                <Text style={[styles.bigLabel, { color: theme.sub }]}>last night</Text>
              </View>
            </View>
          </Widget>

          {/* Spending */}
          <Widget
            style={cardStyle}
            theme={theme}
            dark={dark}
            title="Spending this month"
            icon={BUCKETS.spend}
            accent="#10B981"
            onPress={() => switchToApp('SpendApp' as AppKey)}>
            <View style={styles.widgetBody}>
              <View style={styles.bigStat}>
                <Text style={[styles.bigNum, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatMoney(dashboard.monthSpent)}
                </Text>
                <Text style={[styles.bigLabel, { color: theme.sub }]}>
                  {dashboard.monthlyBudget ? `of ${formatMoney(dashboard.monthlyBudget)} budget` : 'this month'}
                </Text>
              </View>
              {dashboard.monthlyBudget && dashboard.monthlyBudget > 0 ? (
                <View style={[styles.bar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(100, spendPct * 100)}%`, backgroundColor: spendPct > 1 ? '#F43F5E' : '#10B981' },
                    ]}
                  />
                </View>
              ) : null}
            </View>
          </Widget>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Widget({
  title,
  icon,
  accent,
  theme,
  dark,
  style,
  onPress,
  children,
}: {
  title: string;
  icon: IconName;
  accent: string;
  theme: ReturnType<typeof useTheme>;
  dark: boolean;
  style: object;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        style,
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.92 },
      ]}>
      <BlurView
        intensity={dark ? 26 : 40}
        tint={dark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
      />
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: `${accent}22` }]}>
          <Icon name={icon} size={18} color={accent} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  clockCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 160, 0.16)',
    overflow: 'hidden',
    padding: 20,
    marginBottom: 16,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clockMain: {
    flex: 1,
  },
  clockTime: {
    fontSize: 44,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  clockDate: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  folderBtn: {
    padding: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    minHeight: 170,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  widgetBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkList: {
    flex: 1,
    gap: 6,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  smallEmoji: {
    fontSize: 15,
  },
  emptyLine: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  bigStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bigNum: {
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  bigLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  subStat: {
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  moodFace: {
    fontSize: 44,
  },
  bar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 200,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});