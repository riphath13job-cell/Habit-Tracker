import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Icon } from '../../icons';
import { AiError } from '../../ai/client';
import { configSummary, loadProviderConfig, needsApiKey } from '../../ai/provider';
import { fetchProviderUsage, type ProviderUsageReport } from '../../ai/usage';
import { getAiUsageTotals, listAiUsage, type AiUsageRow } from '../../db';
import { useTheme } from '../../theme';
import { todayKey } from '../../date-utils';
import { AiTabBar } from '../../components/AiTabBar';

function fmt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

type CheckState = 'idle' | 'loading' | 'done' | 'error';

export function AiUsageScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [summary, setSummary] = useState('');
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [report, setReport] = useState<ProviderUsageReport | null>(null);
  const [checkError, setCheckError] = useState('');
  const [totals, setTotals] = useState<AiUsageRow | null>(null);
  const [todayRow, setTodayRow] = useState<AiUsageRow | null>(null);
  const [days, setDays] = useState<AiUsageRow[]>([]);

  const runCheck = useCallback(async () => {
    setCheckState('loading');
    setCheckError('');
    try {
      const cfg = await loadProviderConfig();
      const ok = !!cfg.baseUrl && (!needsApiKey(cfg.preset) || !!cfg.apiKey);
      setConfigured(ok);
      setSummary(ok ? configSummary(cfg) : '');
      if (ok) {
        const rep = await fetchProviderUsage(cfg);
        setReport(rep);
        setCheckState('done');
      } else {
        setCheckState('idle');
      }
    } catch (e) {
      setCheckState('error');
      setCheckError(e instanceof AiError ? e.message : 'Something went wrong while checking usage.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const local = await listAiUsage(7);
        const totalsRow = await getAiUsageTotals();
        setDays(local);
        setTotals(totalsRow);
        if (local.length > 0 && local[local.length - 1].day === todayKey()) setTodayRow(local[local.length - 1]);
        else setTodayRow(null);
        void runCheck();
      })();
    }, [runCheck]),
  );

  function openConfig() {
    navigation.navigate('AiConfig');
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [styles.headerBtn, { backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>AI Usage</Text>
          <Text style={[styles.subtitle, { color: theme.sub }]} numberOfLines={1}>
            {configured ? summary : 'Free usage that’s left'}
          </Text>
        </View>
        <Pressable
          onPress={() => void runCheck()}
          disabled={checkState === 'loading'}
          hitSlop={8}
          style={({ pressed }) => [
            styles.headerBtn,
            { backgroundColor: theme.card },
            pressed && { opacity: 0.7 },
            checkState === 'loading' && { opacity: 0.5 },
          ]}>
          <Icon name="refresh" size={22} color={theme.accent} />
        </Pressable>
      </View>

      <AiTabBar active="usage" theme={theme} onChat={() => navigation.goBack()} onUsage={() => {}} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {configured === false ? (
          <Pressable
            onPress={openConfig}
            style={({ pressed }) => [
              styles.banner,
              { backgroundColor: theme.card, borderColor: theme.accent },
              pressed && { opacity: 0.8 },
            ]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: theme.text }]}>Set up the AI assistant first</Text>
              <Text style={[styles.bannerSub, { color: theme.sub }]}>
                Choose a provider and add your free key, then come back here to see what’s left.
              </Text>
            </View>
            <Icon name="chevron-right" size={22} color={theme.accent} />
          </Pressable>
        ) : null}

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>PROVIDER</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {checkState === 'loading' ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.sub} />
              <Text style={[styles.hintText, { color: theme.sub }]}>Checking with {summary || 'provider'}…</Text>
            </View>
          ) : null}

          {checkState === 'error' ? (
            <View style={styles.errorRow}>
              <Icon name="warning" size={20} color={theme.danger} />
              <Text style={[styles.errorText, { color: theme.danger }]}>{checkError}</Text>
            </View>
          ) : null}

          {checkState === 'done' && report ? (
            <View style={styles.cardInner}>
              {report.summary ? (
                <Text style={[styles.cardTitle, { color: theme.text }]}>{report.summary}</Text>
              ) : null}
              {report.lines.map((l, i) => (
                <View key={i} style={styles.lineRow}>
                  <Text style={[styles.lineLabel, { color: theme.sub }]}>{l.label}</Text>
                  <Text style={[styles.lineValue, { color: theme.text }]}>{l.value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {checkState === 'idle' && configured !== false ? (
            <Text style={[styles.hintText, { color: theme.sub }]}>
              Provider usage checks run on demand. Tap the refresh icon above.
            </Text>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>THIS APP’S METER</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardInner}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>All time through Blueprint</Text>
            <View style={styles.lineRow}>
              <Text style={[styles.lineLabel, { color: theme.sub }]}>Requests</Text>
              <Text style={[styles.lineValue, { color: theme.text }]}>{fmt(totals?.requests ?? 0)}</Text>
            </View>
            <View style={styles.lineRow}>
              <Text style={[styles.lineLabel, { color: theme.sub }]}>Prompt tokens</Text>
              <Text style={[styles.lineValue, { color: theme.text }]}>{fmt(totals?.prompt_tokens ?? 0)}</Text>
            </View>
            <View style={styles.lineRow}>
              <Text style={[styles.lineLabel, { color: theme.sub }]}>Output tokens</Text>
              <Text style={[styles.lineValue, { color: theme.text }]}>{fmt(totals?.completion_tokens ?? 0)}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.cardInner}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Today</Text>
            {todayRow ? (
              <>
                <View style={styles.lineRow}>
                  <Text style={[styles.lineLabel, { color: theme.sub }]}>Requests</Text>
                  <Text style={[styles.lineValue, { color: theme.text }]}>{fmt(todayRow.requests)}</Text>
                </View>
                <View style={styles.lineRow}>
                  <Text style={[styles.lineLabel, { color: theme.sub }]}>Tokens</Text>
                  <Text style={[styles.lineValue, { color: theme.text }]}>
                    {fmt(todayRow.prompt_tokens + todayRow.completion_tokens)}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={[styles.hintText, { color: theme.sub }]}>No AI calls yet today.</Text>
            )}
          </View>

          {days.length > 0 ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.cardInner}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Last {days.length} days</Text>
                {days.map((d) => (
                  <View key={d.day} style={styles.lineRow}>
                    <Text style={[styles.lineLabel, { color: theme.sub }]}>{d.day}</Text>
                    <Text style={[styles.lineValue, { color: theme.text }]}>
                      {fmt(d.requests)} req · {fmt(d.prompt_tokens + d.completion_tokens)} tok
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>

        <Text style={[styles.footer, { color: theme.sub }]}>
          The meter counts every model call made by the assistant and what the provider reports. Free-tier caps
          refresh daily; the provider check above shows the live leftovers when available.
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
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  content: { padding: 20, paddingBottom: 60 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 18 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  bannerTitle: { fontSize: 15, fontWeight: '700' },
  bannerSub: { fontSize: 12, marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardInner: { padding: 14, gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineLabel: { fontSize: 13 },
  lineValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  hintText: { fontSize: 12, lineHeight: 17 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer: { fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 24 },
});