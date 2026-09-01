import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '../../icons';
import type { WaterLog, WaterPrefs } from '../../types';
import { allWaterLogs, getWaterPrefs } from '../../db';
import { todayKey } from '../../date-utils';
import { evaluateChallenges, rollupByDay } from '../../water/stats';
import { useTheme } from '../../theme';

export function WaterChallengesScreen() {
  const theme = useTheme();
  const [allLogs, setAllLogs] = useState<WaterLog[]>([]);
  const [prefs, setPrefs] = useState<WaterPrefs>({
    target_ml: 2500,
    reminder_start: null,
    reminder_end: null,
    reminder_interval: null,
    notification_id: null,
  });

  const load = useCallback(async () => {
    const [logs, storedPrefs] = await Promise.all([allWaterLogs(), getWaterPrefs()]);
    setAllLogs(logs);
    setPrefs(storedPrefs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = rollupByDay(allLogs);
  const totalMl = allLogs.reduce((sum, l) => sum + l.ml, 0);
  const challenges = evaluateChallenges(totals, prefs.target_ml, todayKey(), allLogs.length, totalMl);
  const doneCount = challenges.filter((c) => c.done).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Challenges</Text>
        <Text style={[styles.headerSub, { color: theme.sub }]}>
          {doneCount}/{challenges.length} done
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {challenges.map((c) => (
          <View key={c.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardTopRow}>
              <Icon name={c.done ? 'check-circle' : 'emoji-events'} size={20} color={c.done ? theme.good : theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.challengeTitle, { color: theme.text }]}>{c.title}</Text>
                <Text style={[styles.challengeDetail, { color: theme.sub }]}>{c.detail}</Text>
              </View>
              <Text style={[styles.progressLabel, { color: c.done ? theme.good : theme.sub }]}>
                {c.progressLabel}
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.chipBg }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.max(c.progress * 100, c.progress > 0 ? 2 : 0)}%` as `${number}%`,
                    backgroundColor: c.done ? theme.good : theme.accent,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 10,
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengeTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  challengeDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  progressLabel: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  track: {
    height: 8,
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});