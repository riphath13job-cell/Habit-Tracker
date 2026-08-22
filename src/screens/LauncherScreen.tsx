import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface AppTile {
  key: 'HabitApp' | 'NotesApp';
  name: string;
  emoji: string;
  colors: [string, string];
}

const APPS: AppTile[] = [
  { key: 'HabitApp', name: 'Habit Tracker', emoji: '🎯', colors: ['#6366F1', '#4338CA'] },
  { key: 'NotesApp', name: 'Notes', emoji: '📝', colors: ['#FBBF24', '#F59E0B'] },
];

/** Home-screen-style launcher: the hub of the little app collection. */
export function LauncherScreen() {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={require('../../assets/hub-icon.png')} style={styles.brandIcon} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>My Apps</Text>
            <Text style={[styles.subtitle, { color: theme.sub }]}>Your personal mini-apps</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {APPS.map((app) => (
            <Pressable
              key={app.key}
              onPress={() => navigation.navigate(app.key)}
              style={({ pressed }) => [
                styles.tile,
                pressed && { transform: [{ scale: 0.93 }], opacity: 0.85 },
              ]}>
              <LinearGradient
                colors={app.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tileIcon}>
                <Text style={styles.tileEmoji}>{app.emoji}</Text>
              </LinearGradient>
              <Text style={[styles.tileLabel, { color: theme.text }]}>{app.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
    marginTop: 12,
  },
  brandIcon: {
    width: 58,
    height: 56,
    borderRadius: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 22,
  },
  tile: {
    width: 130,
    alignItems: 'center',
    gap: 10,
  },
  tileIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  tileEmoji: {
    fontSize: 38,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
