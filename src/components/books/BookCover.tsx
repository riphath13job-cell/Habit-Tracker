import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

/** Fixed 2:3 aspect cover. Shows a placeholder when there is no image or it fails to load. */
export function BookCover({
  uri,
  title,
  width,
  radius = 8,
}: {
  uri: string | null;
  title: string;
  width: number;
  radius?: number;
}) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const height = Math.round(width * 1.5);

  if (!uri || failed) {
    return (
      <View
        style={[
          styles.placeholder,
          { width, height, borderRadius: radius, backgroundColor: theme.chipBg, borderColor: theme.border },
        ]}>
        <Text style={styles.emoji}>📖</Text>
        <Text style={[styles.initial, { color: theme.sub }]} numberOfLines={1}>
          {(title.trim().charAt(0) || '?').toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width, height, borderRadius: radius, backgroundColor: theme.chipBg }}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 18,
  },
  initial: {
    fontSize: 13,
    fontWeight: '800',
  },
});