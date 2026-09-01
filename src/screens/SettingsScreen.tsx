import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { Icon, IconName, IconPreview, ICON_STYLES, useIconStyle, type IconStyleInfo } from '../icons';
import { exportBundle, importBundle, listHabits, clearAllData } from '../db';
import { syncReminders, syncFitnessReminder, syncSleepReminder, syncLucidReminder, syncWaterReminder } from '../notifications';
import { useTheme, useThemeSettings, THEME_MODES, resolveTheme, type ThemeMode } from '../theme';
import type { ExportBundle } from '../types';
import { isWeb } from '../platform';
import { downloadBackupFile, pickBackupFile } from '../files';

const SAMPLE_TABS: Array<{ icon: IconName; label: string }> = [
  { icon: 'today', label: 'Today' },
  { icon: 'list', label: 'Habits' },
  { icon: 'bar-chart', label: 'Stats' },
];

const SAMPLE_GLYPHS: IconName[] = [
  'add',
  'search',
  'star',
  'folder',
  'delete-outline',
  'chevron-right',
  'notifications',
];

function IconStyleCard({ info }: { info: IconStyleInfo }) {
  const theme = useTheme();
  const { style, setStyle } = useIconStyle();
  const active = style === info.id;
  return (
    <Pressable
      onPress={() => setStyle(info.id)}
      style={({ pressed }) => [
        styles.iconCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        active && { borderColor: theme.accent, borderWidth: 2 },
        pressed && { opacity: 0.75 },
      ]}>
      {active ? (
        <View style={styles.checkBadge}>
          <Icon name="check" size={13} color="#FFFFFF" />
        </View>
      ) : null}
      <View style={[styles.pill, { backgroundColor: theme.chipBg, borderColor: theme.border }]}>
        {SAMPLE_TABS.map((t, i) => (
          <View key={t.icon} style={styles.pillTab}>
            <IconPreview style={info.id} name={t.icon} size={20} color={i === 0 ? theme.accent : theme.sub} />
            <Text style={[styles.pillLabel, { color: theme.sub }]}>{t.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.glyphStrip}>
        {SAMPLE_GLYPHS.map((g) => (
          <IconPreview key={g} style={info.id} name={g} size={17} color={theme.sub} />
        ))}
      </View>
      <Text style={[styles.iconLabel, { color: theme.text }]}>{info.label}</Text>
      <Text style={[styles.iconDesc, { color: theme.sub }]}>{info.description}</Text>
    </Pressable>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { mode, setMode } = useThemeSettings();
  const systemDark = useColorScheme() === 'dark';
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (isWeb) {
      setNotifStatus('denied');
      return;
    }
    const perms = await Notifications.getPermissionsAsync();
    setNotifStatus(perms.granted ? 'granted' : 'denied');
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function askPermission() {
    if (isWeb) {
      Alert.alert('Notifications', 'Desktop notifications are not supported yet.');
      return;
    }
    const { granted } = await Notifications.requestPermissionsAsync();
    setNotifStatus(granted ? 'granted' : 'denied');
    if (granted) {
      await syncReminders(await listHabits());
      Alert.alert('Notifications on', 'Reminders for your habits are now scheduled.');
    } else {
      Alert.alert(
        'Notifications blocked',
        'Enable them in iOS Settings → Blueprint → Notifications, then reopen the app.',
      );
    }
  }

  async function onExport() {
    setBusy(true);
    try {
      const bundle = await exportBundle();
      const json = JSON.stringify(bundle, null, 2);
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `blueprint-backup-${stamp}.json`;
      if (await downloadBackupFile(json, filename)) return;
      // Native: share a real file so "Save to Files" is available on iOS.
      if (await Sharing.isAvailableAsync()) {
        const file = new File(Paths.cache, filename);
        file.write(json);
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Save your backup',
        });
      } else {
        await Share.share({ title: 'Blueprint backup', message: json });
      }
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    let text: string | null = null;
    if (isWeb) {
      text = await pickBackupFile();
      if (!text) return;
    } else {
      const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (pick.canceled) return;
      const asset = pick.assets?.[0];
      if (!asset) return;
      text = await FileSystem.readAsStringAsync(asset.uri);
    }

    setBusy(true);
    let parsed: ExportBundle;
    try {
      parsed = JSON.parse(text);
      if (parsed?.format !== 'habit-tracker-backup' || !Array.isArray(parsed.habits)) {
        throw new Error('not a backup');
      }
    } catch {
      setBusy(false);
      Alert.alert('Import failed', 'That file is not a valid Blueprint backup.');
      return;
    }

    Alert.alert(
      'Replace all data?',
      `The backup contains ${parsed.habits.length} habits, ${parsed.completions.length} check-ins, ${(parsed.todos ?? []).length} to-dos, ${(parsed.workouts ?? []).length} workouts, ${(parsed.sleep_entries ?? []).length} sleep logs, ${(parsed.dream_entries ?? []).length} dreams, ${(parsed.water_logs ?? []).length} water logs and ${(parsed.game_scores ?? []).length} high scores. Your current data will be overwritten.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setBusy(false) },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            try {
              await importBundle(parsed);
              await syncReminders(await listHabits());
              await syncFitnessReminder();
              await syncSleepReminder();
              await syncLucidReminder();
              await syncWaterReminder();
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

  async function confirmClearAll() {
    Alert.alert('Erase all data?', 'Habits, notes, to-dos, workouts, sleep and dream logs and high scores will be deleted forever. Your theme choice is kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase everything',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Really erase?', 'This cannot be undone. Consider exporting a backup first.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Erase',
              style: 'destructive',
              onPress: () =>
                void (async () => {
                  await clearAllData();
                  await syncReminders(await listHabits());
                  await syncFitnessReminder();
                  await syncSleepReminder();
                  await syncLucidReminder();
                  await syncWaterReminder();
                  Alert.alert('Done', 'All data has been erased.');
                })(),
            },
          ]);
        },
      },
    ]);
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>THEME</Text>
        <View style={styles.themeGrid}>
          {THEME_MODES.map(({ mode: m, label }) => {
            const preview = resolveTheme(m, systemDark);
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m as ThemeMode)}
                style={({ pressed }) => [
                  styles.themeCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  active && { borderColor: theme.accent, borderWidth: 2 },
                  pressed && { opacity: 0.75 },
                ]}>
                <View style={[styles.previewStrip, { backgroundColor: preview.bg }]}>
                  <View style={styles.previewDots}>
                    <View style={[styles.dot, { backgroundColor: preview.bg, borderColor: preview.border }]} />
                    <View style={[styles.dot, { backgroundColor: preview.card, borderColor: preview.border }]} />
                    <View style={[styles.dot, { backgroundColor: preview.accent }]} />
                  </View>
                  {active ? (
                    <View style={styles.checkBadge}>
                      <Icon name="check" size={13} color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.themeLabel, { color: theme.text }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>ICON STYLE</Text>
        <View style={styles.iconGrid}>
          {ICON_STYLES.map((s) => (
            <IconStyleCard key={s.id} info={s} />
          ))}
        </View>
        <Text style={[styles.iconHint, { color: theme.sub }]}>
          The launcher tiles and every icon in the app follow this style. The home-screen app icon
          keeps its own design and only changes with a fresh build.
        </Text>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>AI ASSISTANT</Text>
        <Pressable
          onPress={() => navigation.navigate('AiApp')}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
            pressed && { opacity: 0.75 },
          ]}>
          <View style={styles.cardRow}>
            <Icon name="chat" size={22} color={theme.accent} />
            <View style={styles.cardRowText}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>AI Assistant</Text>
              <Text style={[styles.cardSub, { color: theme.sub }]}>
                Chat with your data — habits, notes, workouts and more. Bring your own key, free providers included.
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.sub} />
          </View>
        </Pressable>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>REMINDERS</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardRow}>
            <Icon
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
            Your habits, notes, to-dos, workouts, sleep logs and dreams live only on this phone.
            If the app is ever deleted, its data goes with it — export a backup once in a while.
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

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>DANGER ZONE</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardSub, { color: theme.sub, marginBottom: 4 }]}>
            Wipes every habit, note, to-do, workout, sleep log, dream and high score on this phone.
          </Text>
          <Pressable
            onPress={confirmClearAll}
            style={({ pressed }) => [
              styles.smallButton,
              { backgroundColor: theme.danger },
              pressed && { opacity: 0.8 },
            ]}>
            <Text style={styles.smallButtonText}>Erase all data</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>ABOUT THIS APP</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardSub, { color: theme.sub }]}>
            This app is sideloaded with a free Apple ID, so iOS expires it every 7 days. That is
            normal — plug into the PC and re-sign the same IPA in Sideloadly to bring it back. Your
            habits and history survive re-signing as long as the app icon stays on the home screen.
          </Text>
        </View>

        <Text style={[styles.footer, { color: theme.sub }]}>Blueprint v{version}</Text>
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
    paddingBottom: 110,
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
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  themeCard: {
    width: '31.5%' as `${number}%`,
    borderRadius: 14,
    borderWidth: 1,
    padding: 7,
    alignItems: 'center',
    gap: 6,
  },
  previewStrip: {
    width: '100%',
    height: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  previewDots: { flexDirection: 'row', gap: 5 },
  dot: {
    width: 14,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
  },
  checkBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  iconCard: {
    width: '48%' as `${number}%`,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: 'space-evenly',
  },
  pillTab: {
    alignItems: 'center',
    gap: 2,
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  glyphStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  iconHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
