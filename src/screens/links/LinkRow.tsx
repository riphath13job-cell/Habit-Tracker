import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Icon } from '../../icons';
import type { LinkItem } from '../../types';
import { useTheme } from '../../theme';
import { categoryMeta, hostOf } from '../../links/categories';
import { formatNoteDate } from '../../date-utils';
import { deleteLink, setLinkFavorite } from '../../db';

function withScheme(url: string): string {
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
}

interface LinkRowProps {
  link: LinkItem;
  onChanged: () => void;
  onEdit: (link: LinkItem) => void;
}

export function LinkRow({ link, onChanged, onEdit }: LinkRowProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const meta = categoryMeta(link.category);
  const host = hostOf(link.url);
  const title = link.title.trim() || host;

  async function open() {
    try {
      await Linking.openURL(withScheme(link.url));
    } catch {
      Alert.alert('Can’t open link', 'That URL couldn’t be opened by this device.');
    }
  }

  async function copy() {
    await Clipboard.setStringAsync(link.url);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => setCopied(false), 1200);
  }

  function confirmDelete() {
    Alert.alert('Delete link?', `“${title}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLink(link.id);
          onChanged();
        },
      },
    ]);
  }

  function toggleFavorite() {
    void setLinkFavorite(link.id, link.favorite !== 1).then(onChanged);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.topRow}>
        <Pressable onPress={open} style={styles.main} hitSlop={6}>
          <View style={[styles.chip, { backgroundColor: `${meta.color}26` }]}>
            <Icon name={meta.icon} size={18} color={meta.color} />
          </View>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.meta, { color: theme.sub }]} numberOfLines={1}>
              {host} · saved {formatNoteDate(link.created_at)}
              {copied ? ' · copied ✓' : ''}
            </Text>
          </View>
          <Pressable onPress={toggleFavorite} hitSlop={8} style={styles.starBtn}>
            <Icon
              name={link.favorite === 1 ? 'star' : 'star-border'}
              size={20}
              color={link.favorite === 1 ? '#F59E0B' : theme.sub}
            />
          </Pressable>
        </Pressable>
      </View>

      {link.note.trim() !== '' && (
        <Text style={[styles.note, { color: theme.sub }]} numberOfLines={1}>
          {link.note}
        </Text>
      )}

      <View style={styles.actions}>
        <ActionBtn icon="open-in-new" label="Open" color={theme.accent} onPress={open} />
        <ActionBtn icon="content-copy" label={copied ? 'Copied' : 'Copy'} color={theme.sub} onPress={copy} />
        <ActionBtn icon="edit" label="Edit" color={theme.sub} onPress={() => onEdit(link)} />
        <ActionBtn icon="delete-outline" label="Delete" color="#EF4444" onPress={confirmDelete} />
      </View>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  onPress,
}: {
  icon: 'open-in-new' | 'content-copy' | 'edit' | 'delete-outline';
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn} hitSlop={4}>
      <Icon name={icon} size={15} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
  },
  starBtn: {
    padding: 4,
  },
  note: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(128,128,128,0.09)',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});