import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Habit } from '../types';
import { addDays, dayKey, isScheduled, monthLabel, todayKey, WEEKDAY_LETTERS } from '../date-utils';
import { useTheme } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

/** Read-only month grid showing this habit's completion history. */
export function CalendarView({ habit, done }: { habit: Habit; done: ReadonlySet<string> }) {
  const theme = useTheme();
  const now = new Date();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const created = new Date(habit.created_at);
  const earliestMonth = new Date(created.getFullYear(), created.getMonth(), 1);
  const latestMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const canPrev = monthStart > earliestMonth;
  const canNext = monthStart < latestMonth;

  const leading = monthStart.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const todayK = todayKey();

  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          disabled={!canPrev}
          onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          style={styles.arrowBtn}
          hitSlop={8}>
          <MaterialIcons
            name="chevron-left"
            size={22}
            color={canPrev ? theme.text : theme.border}
          />
        </Pressable>
        <Text style={[styles.monthText, { color: theme.text }]}>{monthLabel(cursor)}</Text>
        <Pressable
          disabled={!canNext}
          onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          style={styles.arrowBtn}
          hitSlop={8}>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={canNext ? theme.text : theme.border}
          />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LETTERS.map((letter, i) => (
          <Text key={i} style={[styles.weekLetter, { color: theme.sub }]}>
            {letter}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={`blank-${i}`} style={styles.cell} />;
          const key = dayKey(date);
          const scheduled = isScheduled(habit, date);
          const completed = done.has(key);
          const future = key > todayK;
          return (
            <View key={key} style={styles.cell}>
              <View
                style={[
                  styles.day,
                  completed && { backgroundColor: habit.color, borderColor: habit.color },
                  !completed && scheduled && { borderColor: habit.color },
                  !completed && !scheduled && { borderColor: 'transparent', opacity: 0.45 },
                  future && !completed && { opacity: 0.5 },
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    { color: completed ? '#FFFFFF' : scheduled ? theme.text : theme.sub },
                  ]}>
                  {date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: habit.color }]} />
        <Text style={[styles.legendText, { color: theme.sub }]}>done</Text>
        <View style={[styles.legendDot, { borderColor: habit.color, borderWidth: 1.5 }]} />
        <Text style={[styles.legendText, { color: theme.sub }]}>missed / upcoming</Text>
        <View style={[styles.legendDot, { opacity: 0.4 }]} />
        <Text style={[styles.legendText, { color: theme.sub }]}>not scheduled</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  arrowBtn: {
    padding: 4,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekLetter: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  day: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    marginRight: 8,
  },
});
