import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { Theme } from '../theme';

export type AiTab = 'chat' | 'usage';

interface Props {
  active: AiTab;
  theme: Theme;
  onChat: () => void;
  onUsage: () => void;
}

export function AiTabBar({ active, theme, onChat, onUsage }: Props) {
  return (
    <View style={[styles.wrap, { backgroundColor: theme.chipBg }]}>
      <Pressable
        onPress={onChat}
        style={({ pressed }) => [
          styles.tab,
          active === 'chat' && { backgroundColor: theme.card, borderColor: theme.accent },
          pressed && { opacity: 0.8 },
        ]}>
        <Icon name="chat" size={15} color={active === 'chat' ? theme.accent : theme.sub} />
        <Text style={[styles.label, { color: active === 'chat' ? theme.accent : theme.sub }]}>Chat</Text>
      </Pressable>
      <Pressable
        onPress={onUsage}
        style={({ pressed }) => [
          styles.tab,
          active === 'usage' && { backgroundColor: theme.card, borderColor: theme.accent },
          pressed && { opacity: 0.8 },
        ]}>
        <Icon name="usage" size={15} color={active === 'usage' ? theme.accent : theme.sub} />
        <Text style={[styles.label, { color: active === 'usage' ? theme.accent : theme.sub }]}>Usage</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 6,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 8,
  },
  label: { fontSize: 13, fontWeight: '700' },
});