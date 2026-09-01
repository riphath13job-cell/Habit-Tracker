import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, APP_TILE_GLYPH } from '../icons';
import { useTheme } from '../theme';

export interface AppTile {
  key:
    | 'HomeApp'
    | 'HabitApp'
    | 'NotesApp'
    | 'TodoApp'
    | 'RoutinesApp'
    | 'FitnessApp'
    | 'SleepApp'
    | 'LucidApp'
    | 'BooksApp'
    | 'LooksmaxxingApp'
    | 'GamesApp'
    | 'LinksApp'
    | 'SettingsApp'
    | 'AiApp'
    | 'WaterApp'
    | 'EvolveApp'
    | 'FocusApp'
    | 'MoodApp'
    | 'SpendApp'
    | 'BusinessApp'
    | 'SyncApp';
  name: string;
  emoji: string;
  colors: [string, string];
}

export const APPS: AppTile[] = [
  { key: 'HomeApp', name: 'Home', emoji: '🏠', colors: ['#6366F1', '#4338CA'] },
  { key: 'HabitApp', name: 'Blueprint', emoji: '🎯', colors: ['#6366F1', '#4338CA'] },
  { key: 'NotesApp', name: 'Notes', emoji: '📝', colors: ['#FBBF24', '#F59E0B'] },
  { key: 'TodoApp', name: 'To-Do Lists', emoji: '✅', colors: ['#34D399', '#059669'] },
  { key: 'RoutinesApp', name: 'Routines', emoji: '🔁', colors: ['#2DD4BF', '#0F766E'] },
  { key: 'FitnessApp', name: 'Fitness', emoji: '💪', colors: ['#FB923C', '#EA580C'] },
  { key: 'SleepApp', name: 'Sleep', emoji: '😴', colors: ['#818CF8', '#4F46E5'] },
  { key: 'WaterApp', name: 'Water', emoji: '💧', colors: ['#0EA5E9', '#0369A1'] },
  { key: 'EvolveApp', name: 'Evolve', emoji: '🔥', colors: ['#00D9FF', '#0077FF'] },
  { key: 'LucidApp', name: 'Lucid', emoji: '🌀', colors: ['#A78BFA', '#7C3AED'] },
  { key: 'BooksApp', name: 'Books', emoji: '📚', colors: ['#38BDF8', '#0284C7'] },
  { key: 'LooksmaxxingApp', name: 'Looksmaxxing', emoji: '✨', colors: ['#FBBF24', '#D97706'] },
  { key: 'GamesApp', name: 'Games', emoji: '🎮', colors: ['#F472B6', '#DB2777'] },
  { key: 'LinksApp', name: 'Links', emoji: '🔗', colors: ['#22D3EE', '#0E7490'] },
  { key: 'SettingsApp', name: 'Settings', emoji: '⚙️', colors: ['#94A3B8', '#475569'] },
  { key: 'AiApp', name: 'AI', emoji: '🤖', colors: ['#F472B6', '#A21CAF'] },
  { key: 'FocusApp', name: 'Focus', emoji: '⏱️', colors: ['#F43F5E', '#9F1239'] },
  { key: 'MoodApp', name: 'Mood', emoji: '🫶', colors: ['#EC4899', '#BE185D'] },
  { key: 'SpendApp', name: 'Spending', emoji: '💸', colors: ['#10B981', '#047857'] },
  { key: 'BusinessApp', name: 'Business', emoji: '🏪', colors: ['#F59E0B', '#B45309'] },
  { key: 'SyncApp', name: 'Sync', emoji: '☁️', colors: ['#0EA5E9', '#0284C7'] },
]

/**
 * Apply a persisted app order (array of AppKey) to the master list. Apps missing
 * from the saved order — e.g. brand-new apps — are appended, so nothing is lost.
 */
export function resolveAppsOrder(order?: string[] | null): AppTile[] {
  if (!order || order.length === 0) return APPS;
  const byKey = new Map<string, AppTile>(APPS.map((app) => [app.key, app]));
  const out: AppTile[] = [];
  for (const key of order) {
    const app = byKey.get(key);
    if (app) out.push(app);
  }
  for (const app of APPS) {
    if (!out.some((a) => a.key === app.key)) out.push(app);
  }
  return out;
}

/** Squircle tile with gradient + emoji, used by the launcher and the folder overlay. */
export function AppTileButton({
  app,
  size,
  onPress,
}: {
  app: AppTile;
  size: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const borderRadius = Math.round(size * 0.3);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.92 }], opacity: 0.85 }]}>
      <LinearGradient
        colors={app.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.icon, { width: size, height: size, borderRadius }]}>
        <Icon name={APP_TILE_GLYPH[app.key]} size={Math.round(size * 0.5)} color="#FFFFFF" />
      </LinearGradient>
      <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
        {app.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    gap: 10,
    width: 130,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
