import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '../../icons';
import { useTheme } from '../../theme';
import { ProgressRing } from '../ProgressRing';

export function RestTimer({
  totalSec,
  endsAt,
  onAdd15,
  onCancel,
}: {
  totalSec: number;
  endsAt: number;
  onAdd15: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
  const buzzed = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  useEffect(() => {
    if (remaining <= 0 && !buzzed.current) {
      buzzed.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [remaining]);

  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <ProgressRing
        size={62}
        stroke={6}
        progress={totalSec > 0 ? remaining / totalSec : 0}
        label={remaining > 0 ? `${remaining}` : 'GO'}
        color={remaining > 0 ? theme.accent : theme.good}
        trackColor={theme.border}
        textColor={theme.text}
      />
      <Text style={[styles.restLabel, { color: theme.sub }]}>Rest</Text>
      <View style={styles.btns}>
        <Pressable onPress={onAdd15} style={[styles.chip, { backgroundColor: theme.chipBg }]}>
          <Text style={[styles.chipText, { color: theme.text }]}>+15s</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={[styles.chip, { backgroundColor: theme.danger }]}>
          <Icon name="close" size={18} color="#FFFFFF" />
          <Text style={[styles.chipText, { color: '#FFFFFF' }]}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  restLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  btns: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
