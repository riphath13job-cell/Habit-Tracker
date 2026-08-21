import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { exportBundle, importBundle, listHabits } from '../db';
import { syncReminders } from '../notifications';
import { useTheme } from '../theme';
import type { ExportBundle } from '../types';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function SettingsScreen() {
  const theme = useTheme();
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const perms = await Notifications.getPermissionsAsync();
    setNotifStatus(perms.granted ? 'granted' : 'denied');
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function askPermission() {
    const { granted } = await Notifications.requestPermissionsAsync();
    setNotifStatus(granted ? 'granted' : 'denied');
    if (granted) {
      await syncReminders(await listHabits());
      Alert.alert('Notifications on', 'Reminders for your habits are now scheduled.');
    } else {
      Alert.alert(
        'Notifications blocked',
        'Enable them in iOS Settings → Habit Tracker → Notifications, then reopen the app.',
      );
    }
  }

  async function onExport() {
    setBusy(true);
    try {
      const bundle = await exportBundle();
      await Share.share({
        title: 'Habit Tracker backup',
        message: JSON.stringify(bundle, null, 2),
      });
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (pick.canceled) return;
    const asset = pick.assets?.[0];
    if (!asset) return;

    setBusy(true);
    let parsed: ExportBundle;
    try {
      const text = await FileSystem.readAsStringAsync(asset.uri);
      parsed = JSON.parse(text);
      if (parsed?.format !== 'habit-tracker-backup' || !Array.isArray(parsed.habits)) {
        throw new Error('not a backup');
      }
    } catch {
      setBusy(false);
      Alert.alert('Import failed', 'That file is not a valid Habit Tracker backup.');
      return;
    }

    Alert.alert(
      'Replace all data?',
      `The backup contains ${parsed.habits.length} habits and ${parsed.completions.length} check-ins. Your current data will be overwritten.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setBusy(false) },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            try {
              await importBundle(parsed);
              await syncReminders(await listHabits());
              Alert.alert('Import complete', 'Your habits and history were restored.');
            } catch {
              Alert.alert('Import failed', 'Something went wrong while restoring the backup.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>REMINDERS</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardRow}>
            <MaterialIcons
              name="notifications"
              size={22}
              color={notifStatus === 'granted' ? theme.good : theme.sub}
            />
            <View style={styles.cardRowText}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Notifications</Text>
              <Text style={[styles.cardSub, { color: theme.sub }]}>
                {notifStatus === 'granted'
                  ? 'Allowed — daily reminders will fire.'
                  : 'Blocked — reminders cannot fire until allowed.'}
              </Text>
            </View>
          </View>
          {notifStatus !== 'granted' ? (
            <Pressable
              onPress={askPermission}
              style={[styles.smallButton, { backgroundColor: theme.accent }]}>
              <Text style={styles.smallButtonText}>Allow notifications</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>BACKUP</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardSub, { color: theme.sub, marginBottom: 10 }]}>
            Your data lives only on this phone. If the app is ever deleted, its data goes with it —
            export a backup once in a while.
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={onExport}
              disabled={busy}
              style={[styles.smallButton, { backgroundColor: theme.accent }, busy && { opacity: 0.6 }]}>
              <Text style={styles.smallButtonText}>Export backup</Text>
            </Pressable>
            <Pressable
              onPress={onImport}
              disabled={busy}
              style={[styles.smallButton, { backgroundColor: theme.chipBg }, busy && { opacity: 0.6 }]}>
              <Text style={[styles.smallButtonText, { color: theme.text }]}>Import backup</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>ABOUT THIS APP</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardSub, { color: theme.sub }]}>
            This app is sideloaded with a free Apple ID, so iOS expires it every 7 days. That is
            normal — plug into the PC and re-sign the same IPA in Sideloadly to bring it back. Your
            habits and history survive re-signing as long as the app icon stays on the home screen.
          </Text>
        </View>

        <Text style={[styles.footer, { color: theme.sub }]}>Habit Tracker v{version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardRowText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  smallButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 8,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
