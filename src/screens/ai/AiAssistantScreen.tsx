import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { askAssistant } from '../../ai/loop';
import { AiError } from '../../ai/client';
import { configSummary, loadProviderConfig, needsApiKey } from '../../ai/provider';
import { clearAiMessages, listAiMessages } from '../../db';
import { useTheme } from '../../theme';
import { useHub } from '../../hub/HubContext';
import { AiTabBar } from '../../components/AiTabBar';

interface ChatEntry {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  actions: string[];
}

const QUICK_PROMPTS = [
  "Today's summary",
  'Catch me up on this week',
  'Am I consistent with my habits?',
  'What did I train in the gym?',
  'Find my notes about habits',
  'How have I been sleeping?',
];

let idCounter = 1;

function errorText(e: unknown): string {
  if (e instanceof AiError) return `Could not run: ${e.message}`;
  return 'Something went wrong. Try a shorter question.';
}

export function AiAssistantScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { openFolder } = useHub();
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [summary, setSummary] = useState('');

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const cfg = await loadProviderConfig();
        const ok = !!cfg.baseUrl && (!needsApiKey(cfg.preset) || !!cfg.apiKey);
        setConfigured(ok);
        setSummary(ok ? configSummary(cfg) : '');
        const history = await listAiMessages(60);
        setMessages(
          history.map((h) => ({ id: idCounter++, role: h.role, content: h.content, actions: [] })),
        );
      })();
    }, []),
  );

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    if (!configured) {
      Alert.alert('Set up the AI assistant', 'Choose a provider and add your API key first.');
      navigation.navigate('AiConfig');
      return;
    }
    setInput('');
    setMessages((m) => [...m, { id: idCounter++, role: 'user', content: text, actions: [] }]);
    setBusy(true);
    try {
      const { reply, actions } = await askAssistant(text);
      setMessages((m) => [...m, { id: idCounter++, role: 'assistant', content: reply, actions }]);
    } catch (e) {
      setMessages((m) => [...m, { id: idCounter++, role: 'assistant', content: errorText(e), actions: [] }]);
    } finally {
      setBusy(false);
    }
  }

  function confirmClear() {
    Alert.alert('Clear chat history?', 'Your data is not affected — only this conversation is deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void clearAiMessages();
          setMessages([]);
        },
      },
    ]);
  }

  const data = [...messages].reverse();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>AI Assistant</Text>
          <Text style={[styles.subtitle, { color: theme.sub }]} numberOfLines={1}>
            {configured ? summary : 'Chat with everything you track'}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AiConfig')}
          hitSlop={8}
          style={({ pressed }) => [styles.headerBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="settings" size={22} color={theme.accent} />
        </Pressable>
        <Pressable
          onPress={confirmClear}
          hitSlop={8}
          style={({ pressed }) => [styles.headerBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="delete-outline" size={22} color={theme.sub} />
        </Pressable>
        <Pressable
          onPress={openFolder}
          hitSlop={8}
          style={({ pressed }) => [styles.headerBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="folder" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <AiTabBar active="chat" theme={theme} onChat={() => {}} onUsage={() => navigation.navigate('AiUsage')} />

      {configured === false ? (
        <Pressable
          onPress={() => navigation.navigate('AiConfig')}
          style={({ pressed }) => [
            styles.banner,
            { backgroundColor: theme.card, borderColor: theme.accent },
            pressed && { opacity: 0.8 },
          ]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>Set up your AI assistant</Text>
            <Text style={[styles.bannerSub, { color: theme.sub }]}>
              Pick a free provider and add a key to start chatting with your data.
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={theme.accent} />
        </Pressable>
      ) : null}

      <FlatList
        style={{ flex: 1 }}
        data={data}
        inverted
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          busy ? (
            <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ActivityIndicator size="small" color={theme.sub} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.role === 'user') {
            return (
              <View style={[styles.bubble, styles.userBubble, { backgroundColor: theme.accent }]}>
                <Text style={styles.userText}>{item.content}</Text>
              </View>
            );
          }
          return (
            <View>
              {item.actions.length > 0 ? (
                <View style={styles.actionsWrap}>
                  {item.actions.map((a, i) => (
                    <View key={i} style={[styles.actionChip, { backgroundColor: theme.chipBg, borderColor: theme.border }]}>
                      <Text style={[styles.actionText, { color: theme.sub }]}>{a}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.assistantText, { color: theme.text }]}>{item.content}</Text>
              </View>
            </View>
          );
        }}
      />

      {messages.length <= 2 ? (
        <View style={styles.quickRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickContent}>
            {QUICK_PROMPTS.map((p) => (
              <Pressable
                key={p}
                onPress={() => void send(p)}
                style={({ pressed }) => [
                  styles.quickChip,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  pressed && { opacity: 0.7 },
                ]}>
                <Text style={[styles.quickText, { color: theme.text }]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, { backgroundColor: theme.bg }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your habits, notes…"
            placeholderTextColor={theme.sub}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={() => void send(input)}
            disabled={!input.trim() || busy}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: theme.accent },
              (!input.trim() || busy) && { opacity: 0.4 },
              pressed && { transform: [{ scale: 0.9 }] },
            ]}>
            <Icon name="arrow-upward" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    gap: 10,
  },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  bannerTitle: { fontSize: 15, fontWeight: '700' },
  bannerSub: { fontSize: 12, marginTop: 2 },
  listContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  userText: { color: '#FFFFFF', fontSize: 15, lineHeight: 21 },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  assistantText: { fontSize: 15, lineHeight: 21 },
  actionsWrap: { marginBottom: 6, gap: 4 },
  actionChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 2,
  },
  actionText: { fontSize: 12, fontWeight: '600' },
  quickRow: { paddingTop: 2 },
  quickContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  quickChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickText: { fontSize: 13, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});