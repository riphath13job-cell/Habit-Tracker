import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { useTheme } from '../../theme';
import { isSyncEnabled, setSyncEnabled, initSync, syncNow, hasRemoteChanges } from '../../sync';
import { getSyncMeta, setSyncMeta } from '../../db';

export function SyncScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [enabled, setEnabled] = useState(false);
  const [lastPull, setLastPull] = useState<string | null>(null);
  const [lastPush, setLastPush] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'synced' | 'pending' | 'error'>('idle');
  const [remoteNewer, setRemoteNewer] = useState(false);

  const load = useCallback(async () => {
    setEnabled(isSyncEnabled());
    const pull = await getSyncMeta('last_pull_at');
    const push = await getSyncMeta('last_push_at');
    setLastPull(pull);
    setLastPush(push);
    try {
      const newer = await hasRemoteChanges();
      setRemoteNewer(newer);
    } catch {
      setRemoteNewer(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleToggle = async (v: boolean) => {
    setEnabled(v);
    setSyncEnabled(v);
    await setSyncMeta('sync_enabled', v ? '1' : '0');
    if (v) {
      await doSync();
    }
  };

  const doSync = async () => {
    setSyncing(true);
    setStatus('pending');
    try {
      const res = await syncNow();
      setStatus(res.pulled || res.pushed ? 'synced' : 'idle');
      await load();
      if (res.pulled || res.pushed) {
        setTimeout(() => setStatus('synced'), 1500);
      }
    } catch (e: any) {
      setStatus('error');
      Alert.alert('Sync failed', e?.message ?? String(e));
    } finally {
      setSyncing(false);
    }
  };

  const fmt = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main toggle card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="cloud" size={22} color={theme.accent} />
              <View>
                <Text style={[styles.label, { color: theme.text }]}>Cloud Sync</Text>
                <Text style={[styles.sub, { color: theme.sub }]}>Sync data across devices via Supabase</Text>
              </View>
            </View>
            <Switch value={enabled} onValueChange={handleToggle} trackColor={{ true: theme.accent }} />
          </View>

          {enabled && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.infoRow}>
                <View>
                  <Text style={[styles.metaLabel, { color: theme.sub }]}>Last pull</Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>{fmt(lastPull)}</Text>
                </View>
                <View>
                  <Text style={[styles.metaLabel, { color: theme.sub }]}>Last push</Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>{fmt(lastPush)}</Text>
                </View>
              </View>

              {remoteNewer && (
                <View style={[styles.banner, { backgroundColor: theme.orange }]}>
                  <Text style={styles.bannerText}>New data on another device — tap Sync to pull it</Text>
                </View>
              )}

              <Pressable
                onPress={doSync}
                disabled={syncing}
                style={({ pressed }) => [
                  styles.syncBtn,
                  { backgroundColor: theme.accent },
                  (syncing || pressed) && { opacity: 0.7 },
                ]}>
                {syncing ? (
                  <ActivityIndicator color="#fff" size={20} />
                ) : (
                  <Text style={styles.syncBtnText}>Sync Now</Text>
                )}
              </Pressable>

              {status === 'synced' && (
                <Text style={[styles.statusText, { color: theme.good }]}>
                  ✓ All devices in sync
                </Text>
              )}

              {status === 'error' && (
                <Text style={[styles.statusText, { color: theme.danger }]}>
                  Sync failed — check connection and try again
                </Text>
              )}
            </>
          )}
        </View>

        {/* Info card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>How it works</Text>
          <Text style={[styles.infoText, { color: theme.sub }]}>
            Your data is stored in a free Supabase project. When sync is enabled, every device
            pushes its data to the cloud and pulls the latest version. Changes are merged
            automatically — newest edit wins per row.
          </Text>
          <Text style={[styles.infoText, { color: theme.sub }]}>
            No login required — just your project URL and anon key. The key is embedded in the
            app and is safe to ship (Row-Level Security protects your data).
          </Text>
        </View>

        {/* Device info card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Device</Text>
          <DeviceInfoRow label="Platform" value={typeof navigator !== 'undefined' ? navigator.platform : 'Unknown'} theme={theme} />
          <DeviceInfoRow label="Sync enabled" value={enabled ? 'Yes' : 'No'} theme={theme} />
          <DeviceInfoRow label="Last pull" value={fmt(lastPull)} theme={theme} />
          <DeviceInfoRow label="Last push" value={fmt(lastPush)} theme={theme} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeviceInfoRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={styles.deviceRow}>
      <Text style={[styles.deviceLabel, { color: theme.sub }]}>{label}</Text>
      <Text style={[styles.deviceValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  label: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginVertical: 14 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaLabel: { fontSize: 12, fontWeight: '600' },
  metaValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  banner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  syncBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  statusText: { marginTop: 10, textAlign: 'center', fontWeight: '600', fontSize: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  infoText: { fontSize: 13, lineHeight: 19, marginBottom: 6 },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  deviceLabel: { fontSize: 14, fontWeight: '500' },
  deviceValue: { fontSize: 14, fontWeight: '600' },
});
