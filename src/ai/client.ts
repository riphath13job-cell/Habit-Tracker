import type { ChatMsg, ChatResponse, ClientToolDef, ToolCallMsg } from './types';

export type AiErrorCode = 'no_config' | 'auth' | 'rate_limit' | 'not_found' | 'offline' | 'other';

export class AiError extends Error {
  code: AiErrorCode;
  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = 'AiError';
    this.code = code;
  }
}

export interface ProviderTarget {
  baseUrl: string;
  model: string;
  apiKey: string;
}

const REQUEST_TIMEOUT_MS = 90_000;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function friendlyStatusError(status: number, raw: string): AiError {
  if (status === 401 || status === 403) {
    return new AiError('auth', 'The API key was rejected (401/403). Double-check it in AI settings.');
  }
  if (status === 429) {
    return new AiError('rate_limit', 'Rate limited by the provider. Wait a moment and try again.');
  }
  if (status === 404) {
    return new AiError(
      'not_found',
      'Model or endpoint not found (404). Check the model name and base URL in AI settings.',
    );
  }
  const detail = raw.length > 0 ? raw.slice(0, 300) : `HTTP ${status}`;
  return new AiError('other', `The provider returned ${detail}`);
}

/**
 * One OpenAI-compatible chat completion round, with optional tool definitions.
 * Pure HTTP — no device-only modules, safe to unit test in Node.
 */
export async function chatCompletions(
  provider: ProviderTarget,
  messages: ChatMsg[],
  tools: ClientToolDef[],
  opts: { maxTokens?: number } = {},
): Promise<ChatResponse> {
  const url = `${stripTrailingSlash(provider.baseUrl)}/chat/completions`;

  const body: Record<string, unknown> = { messages };
  if (provider.model) body.model = provider.model;
  if (tools.length > 0) body.tools = tools;
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data: any = null;
    let rawText = '';
    try {
      rawText = await res.text();
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      // non-JSON body (HTML error page, proxy, etc.)
      data = null;
    }

    if (!res.ok) {
      const detail = data?.error?.message ?? data?.message ?? rawText ?? '';
      throw friendlyStatusError(res.status, detail);
    }

    const choice = data?.choices?.[0];
    const message = choice?.message;
    const toolCalls: ToolCallMsg[] = message?.tool_calls ?? [];
    const content: string | null = message?.content ?? null;
    const rawUsage: any = data?.usage;
    const usage =
      rawUsage && typeof rawUsage === 'object'
        ? {
            promptTokens:
              typeof rawUsage.prompt_tokens === 'number' ? rawUsage.prompt_tokens : undefined,
            completionTokens:
              typeof rawUsage.completion_tokens === 'number' ? rawUsage.completion_tokens : undefined,
          }
        : undefined;

    if (toolCalls.length > 0) {
      return { finish: 'tool_calls', content, toolCalls, usage };
    }
    return { finish: choice?.finish_reason === 'length' ? 'length' : 'stop', content, toolCalls: [], usage };
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new AiError('other', 'The request timed out after 90s. Try a shorter question.');
    }
    throw new AiError('offline', 'Could not reach the provider. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

/** Verifies a provider+key by requesting a one-word reply. Throws AiError on failure. */
export async function testProvider(provider: ProviderTarget): Promise<void> {
  const res = await chatCompletions(
    provider,
    [
      { role: 'system', content: 'Reply with exactly one word: ok' },
      { role: 'user', content: 'ping' },
    ],
    [],
    { maxTokens: 8 },
  );
  if (res.finish !== 'stop' && res.finish !== 'length') {
    throw new AiError('other', 'Unexpected response from the provider.');
  }
}