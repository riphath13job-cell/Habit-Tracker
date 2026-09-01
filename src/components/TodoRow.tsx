import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { useTheme } from '../theme';

export function TodoRow({
  title,
  sub,
  done,
  onToggle,
  onDelete,
  onPress,
}: {
  title: string;
  sub?: string;
  done: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable
        onPress={onToggle}
        hitSlop={6}
        style={[
          styles.check,
          { borderColor: done ? theme.good : theme.border },
          done && { backgroundColor: theme.good },
        ]}>
        {done ? <Icon name="check" size={18} color="#FFFFFF" /> : null}
      </Pressable>
      <Pressable disabled={!onPress} onPress={onPress} style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.text }, done && styles.done]} numberOfLines={2}>
          {title}
        </Text>
        {sub ? <Text style={[styles.sub, { color: theme.sub }]}>{sub}</Text> : null}
      </Pressable>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
          <Icon name="close" size={20} color={theme.sub} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '600',
  },
  sub: {
    fontSize: 12.5,
    marginTop: 2,
  },
  done: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  deleteBtn: {
    padding: 4,
  },
});
