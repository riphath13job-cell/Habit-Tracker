import { addAiMessage, listAiMessages, recordAiUsage } from '../db';
import { todayKey } from '../date-utils';
import { chatCompletions, AiError } from './client';
import { runLoop, type AiTool, type LoopResult, type RunCall } from './loop-core';
import { buildSystemPrompt } from './prompt';
import { loadProviderConfig, needsApiKey, type ProviderConfig } from './provider';
import { ALL_TOOLS } from './tools';

async function loadHistory() {
  const history = await listAiMessages(24);
  return history.map((h) => ({ role: h.role, content: h.content }));
}

async function persist(entries: Array<{ role: 'user' | 'assistant'; content: string }>) {
  for (const e of entries) {
    await addAiMessage(e.role, e.content);
  }
}

function assertConfigured(cfg: ProviderConfig): void {
  if (!cfg.baseUrl) throw new AiError('no_config', 'Set up the AI assistant first — open AI settings.');
  if (needsApiKey(cfg.preset) && !cfg.apiKey) {
    throw new AiError('no_config', 'Add your API key in the AI settings to start chatting.');
  }
}

/**
 * Runs one user turn end-to-end: loads config + chat history, executes the
 * tool-calling loop, and persists the exchange. Throws AiError when unconfigured.
 */
export async function askAssistant(
  userText: string,
  overrides?: { cfg?: ProviderConfig; call?: RunCall; tools?: AiTool[] },
): Promise<LoopResult> {
  const cfg = overrides?.cfg ?? (await loadProviderConfig());
  assertConfigured(cfg);

  const calls: RunCall = async (_, messages, tools, opts) => {
    const fn = overrides?.call ?? chatCompletions;
    return fn(cfg, messages, tools, opts);
  };

  return runLoop(userText, {
    call: calls,
    tools: overrides?.tools ?? ALL_TOOLS,
    loadHistory,
    persist,
    systemPrompt: buildSystemPrompt(),
    onAssistantRound: (res) => {
      if (res.usage) {
        return recordAiUsage(todayKey(), res.usage.promptTokens ?? 0, res.usage.completionTokens ?? 0);
      }
    },
  });
}