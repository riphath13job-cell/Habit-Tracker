import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { lastTrainedByMuscle } from '../../db';
import { MUSCLE_GROUPS, type MuscleKey } from '../../fitness/muscle-data';
import { useTheme } from '../../theme';
import { BodyMap, type MuscleStatus } from '../../components/fitness/BodyMap';

export function MusclesScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState<MuscleStatus>({});

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const lastTrained = await lastTrainedByMuscle();
        const next: MuscleStatus = {};
        for (const group of MUSCLE_GROUPS) {
          const last = lastTrained[group.key];
          if (!last) continue;
          const hoursSince = (Date.now() - last) / 3600000;
          if (hoursSince < group.recoveryHours) {
            next[group.key] = Math.max(0.08, 1 - hoursSince / group.recoveryHours);
          }
        }
        setStatus(next);
      })();
    }, []),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Muscles</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.hint, { color: theme.sub }]}>
          Tap a muscle to explore exercises. Green glow means it's still recovering from your last workout.
        </Text>

        <BodyMap status={status} onSelect={(muscle: MuscleKey) => navigation.navigate('MuscleDetail', { muscle })} />

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.legendText, { color: theme.sub }]}>Recovering</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <View style={[styles.dot, { backgroundColor: '#3B82F6', marginLeft: -6 }]} />
            <View style={[styles.dot, { backgroundColor: '#8B5CF6', marginLeft: -6 }]} />
            <Text style={[styles.legendText, { color: theme.sub, marginLeft: 4 }]}>Ready</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 16,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
