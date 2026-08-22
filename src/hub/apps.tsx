import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

export interface AppTile {
  key: 'HabitApp' | 'NotesApp';
  name: string;
  emoji: string;
  colors: [string, string];
}

export const APPS: AppTile[] = [
  { key: 'HabitApp', name: 'Habit Tracker', emoji: '🎯', colors: ['#6366F1', '#4338CA'] },
  { key: 'NotesApp', name: 'Notes', emoji: '📝', colors: ['#FBBF24', '#F59E0B'] },
];

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.92 }], opacity: 0.85 }]}>
      <LinearGradient
        colors={app.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.icon, { width: size, height: size, borderRadius: Math.round(size * 0.3) }]}>
        <Text style={{ fontSize: Math.round(size * 0.46) }}>{app.emoji}</Text>
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
