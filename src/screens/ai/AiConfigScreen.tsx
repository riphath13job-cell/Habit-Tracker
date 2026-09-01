import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import {
  PROVIDER_PRESETS,
  loadProviderConfig,
  needsApiKey,
  presetById,
  saveProviderConfig,
  type ProviderConfig,
  type ProviderId,
} from '../../ai/provider';
import { testProvider, AiError } from '../../ai/client';
import { clearAiMessages } from '../../db';
import { useTheme } from '../../theme';

export function AiConfigScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [preset, setPreset] = useState<ProviderId>('openrouter');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadProviderConfig().then((cfg) => {
      setPreset(cfg.preset);
      setBaseUrl(cfg.baseUrl);
      setModel(cfg.model);
      setApiKey(cfg.apiKey);
      setLoaded(true);
    });
  }, []);

  const activePreset = presetById(preset) ?? PROVIDER_PRESETS[0];

  function pickPreset(id: ProviderId) {
    const p = presetById(id);
    setPreset(id);
    if (p && id !== 'custom') {
      setBaseUrl(p.baseUrl);
      setModel(p.model);
    }
  }

  function currentConfig(): ProviderConfig {
    return { preset, baseUrl: baseUrl.trim(), model: model.trim(), apiKey: apiKey.trim() };
  }

  function validate(cfg: ProviderConfig): string | null {
    if (!cfg.baseUrl) return 'Enter a base URL (or pick a preset).';
    if (needsApiKey(preset) && !cfg.apiKey) return 'Add your API key — the assistant needs it to reach the model.';
    return null;
  }

  async function onTest() {
    const cfg = currentConfig();
    const problem = validate(cfg);
    if (problem) {
      Alert.alert('Incomplete', problem);
      return;
    }
    try {
      await testProvider(cfg);
      Alert.alert('Connection OK', 'The provider answered successfully — your key is accepted.');
    } catch (e) {
      Alert.alert('Connection failed', e instanceof AiError ? e.message : 'Something went wrong. Try again.');
    }
  }

  async function onSave() {
    const cfg = currentConfig();
    const problem = validate(cfg);
    if (problem) {
      Alert.alert('Incomplete', problem);
      return;
    }
    await saveProviderConfig(cfg);
    Alert.alert('Saved', 'Your AI assistant is ready to chat.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  function confirmClearChat() {
    Alert.alert('Clear chat history?', 'Your data is not affected. This just empties the conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => void clearAiMessages().then(() => Alert.alert('Done', 'Chat history cleared.')),
      },
    ]);
  }

  if (!loaded) return <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']} />;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>AI Settings</Text>
          <Text style={[styles.subtitle, { color: theme.sub }]}>Bring your own key — every provider has a free tier</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionLabel, { color: theme.sub }]}>PROVIDER</Text>
        <View style={styles.presetRow}>
          {PROVIDER_PRESETS.map((p) => {
            const active = preset === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => pickPreset(p.id)}
                style={({ pressed }) => [
                  styles.presetChip,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  active && { borderColor: theme.accent, borderWidth: 2 },
                  pressed && { opacity: 0.75 },
                ]}>
                <Text style={[styles.presetLabel, { color: active ? theme.accent : theme.text }]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: theme.sub }]}>{activePreset.hint}</Text>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>BASE URL</Text>
        <TextInput
          style={[styles.field, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="https://api.example.com/v1"
          placeholderTextColor={theme.sub}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>MODEL</Text>
        <TextInput
          style={[styles.field, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          value={model}
          onChangeText={setModel}
          placeholder="model name"
          placeholderTextColor={theme.sub}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {activePreset.freeModels && activePreset.freeModels.length > 0 ? (
          <View style={styles.modelRow}>
            {activePreset.freeModels.map((m) => {
              const activeModel = model === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setModel(m)}
                  style={({ pressed }) => [
                    styles.modelChip,
                    { backgroundColor: theme.chipBg, borderColor: theme.border },
                    activeModel && { borderColor: theme.accent },
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text style={[styles.modelChipText, { color: activeModel ? theme.accent : theme.text }]}>{m}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>API KEY</Text>
        <TextInput
          style={[styles.field, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder={needsApiKey(preset) ? 'sk-…' : 'No key needed for this provider'}
          placeholderTextColor={theme.sub}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={needsApiKey(preset)}
        />
        <Text style={[styles.hint, { color: theme.sub }]}>
          Free options (no card, ~2 minutes): OpenRouter ':free' models, Groq, or Google AI Studio — grab each key at the
          link shown under the provider hints above. The model list above that provider shows which free models work.
        </Text>
        <Text style={[styles.hint, { color: theme.sub }]}>
          Your key is stored only on this phone (iOS Keychain / secure storage). It is sent to the provider you chose when
          you chat; it is never included in backups and never leaves the device otherwise.
        </Text>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => void onTest()}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.chipBg }, pressed && { opacity: 0.8 }]}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Test connection</Text>
          </Pressable>
          <Pressable
            onPress={() => void onSave()}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.accent }, pressed && { opacity: 0.8 }]}>
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>CHAT</Text>
        <Pressable
          onPress={confirmClearChat}
          style={({ pressed }) => [
            styles.clearRow,
            { backgroundColor: theme.card, borderColor: theme.border },
            pressed && { opacity: 0.7 },
          ]}>
          <Icon name="delete-outline" size={20} color={theme.danger} />
          <Text style={[styles.clearText, { color: theme.danger }]}>Clear chat history</Text>
        </Pressable>

        <Text style={[styles.footer, { color: theme.sub }]}>
          The assistant reads from the same local database the rest of Blueprint uses. Conversations are stored on this
          phone only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  content: { padding: 20, paddingBottom: 60 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 18 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8, marginBottom: 2 },
  presetLabel: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  field: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  modelChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  modelChipText: { fontSize: 12, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  button: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  buttonText: { fontSize: 14, fontWeight: '700' },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  clearText: { fontSize: 14, fontWeight: '700' },
  footer: { fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 24 },
});