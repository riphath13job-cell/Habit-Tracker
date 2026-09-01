import { AiError } from './client';
import type { ProviderConfig } from './provider';

export interface UsageLine {
  label: string;
  value: string;
}

export interface ProviderUsageReport {
  ok: boolean;
  summary: string;
  lines: UsageLine[];
  error?: string;
}

const REQUEST_TIMEOUT_MS = 20_000;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function fmt(n: number | undefined | null): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Math.round(Number(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function money(v: number | undefined | null): string {
  if (v == null) return '—';
  return v < 0.001 ? '$0.00' : `$${Number(v).toFixed(2)}`;
}

const FREE_NOTES: Record<string, string> = {
  openrouter:
    "OpenRouter ':free' models have separate per-day request caps (published at openrouter.ai/docs#limits) that are not in the /key response.",
  groq: 'Groq free tier: 30 requests/min — around 6,000 tokens/min. The token number below resets every minute; the request number resets each day.',
  gemini: 'Google free tier: ~1,500 requests/day and 1M tokens/min. Google does not expose a live remaining-quota API, so this is the published cap.',
};

async function getJson(url: string, headers: Record<string, string>) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'GET', headers, signal: ctrl.signal });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // non-JSON body
    }
    return { status: res.status, ok: res.ok, json, headers: res.headers };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new AiError('other', 'Timed out while checking usage.');
    }
    throw new AiError('offline', 'Could not reach the provider to check usage.');
  } finally {
    clearTimeout(timer);
  }
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // non-JSON body
    }
    return { status: res.status, ok: res.ok, json, headers: res.headers };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new AiError('other', 'Timed out while checking usage.');
    }
    throw new AiError('offline', 'Could not reach the provider to check usage.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Live usage info for the active provider, best-effort. OpenRouter exposes
 * credit usage via GET /key; Groq exposes live remaining rate limits through
 * response headers. Gemini and custom endpoints have no usage API, so they
 * return the published free-tier caps instead.
 */
export async function fetchProviderUsage(cfg: ProviderConfig): Promise<ProviderUsageReport> {
  switch (cfg.preset) {
    case 'openrouter':
      return checkOpenRouter(cfg);
    case 'groq':
      return checkGroq(cfg);
    case 'gemini':
      return {
        ok: true,
        summary: 'Google Gemini free tier',
        lines: [
          { label: 'Requests / day (free)', value: '~1,500' },
          { label: 'Tokens / minute (free)', value: '~1,000,000' },
          { label: 'Note', value: FREE_NOTES.gemini },
        ],
      };
    case 'custom':
      return {
        ok: true,
        summary: 'Custom endpoint',
        lines: [
          { label: 'Note', value: 'Custom endpoints do not expose quota — watch the local meter in this tab instead.' },
        ],
      };
    default:
      return {
        ok: true,
        summary: 'Provider',
        lines: [{ label: 'Note', value: 'No usage check is available for this provider.' }],
      };
  }
}

async function checkOpenRouter(cfg: ProviderConfig): Promise<ProviderUsageReport> {
  const { status, ok, json } = await getJson(`${stripTrailingSlash(cfg.baseUrl)}/key`, {
    Authorization: `Bearer ${cfg.apiKey}`,
  });
  if (!ok) {
    const detail = json?.error?.message ?? `HTTP ${status}`;
    if (status === 401 || status === 403) {
      throw new AiError('auth', 'OpenRouter rejected the API key while checking usage.');
    }
    throw new AiError('other', `OpenRouter usage check failed: ${detail}`);
  }
  const d = json?.data ?? {};
  const lines: UsageLine[] = [];
  if (typeof d.is_free_tier === 'boolean') {
    lines.push({ label: 'Account tier', value: d.is_free_tier ? 'Free (no credits bought)' : 'Credits purchased' });
  }
  if (d.limit_remaining != null) {
    lines.push({ label: 'Credits left on key', value: money(d.limit_remaining) });
  } else if (d.usage != null) {
    lines.push({ label: 'Credits used (all time)', value: money(d.usage) });
  }
  if (d.usage_daily != null) {
    lines.push({ label: 'Credits used today', value: money(d.usage_daily) });
  }
  lines.push({ label: 'Note', value: FREE_NOTES.openrouter });
  return { ok: true, summary: 'OpenRouter account', lines };
}

async function checkGroq(cfg: ProviderConfig): Promise<ProviderUsageReport> {
  const base = stripTrailingSlash(cfg.baseUrl);
  const { status, ok, json, headers } = await postJson(
    `${base}/chat/completions`,
    {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    {
      model: cfg.model || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    },
  );

  const h = headers as Headers;
  const g = (k: string) => h.get?.(k) ?? null;
  const requestsLimit = g('x-ratelimit-limit-requests');
  const requestsRemaining = g('x-ratelimit-remaining-requests');
  const tokensLimit = g('x-ratelimit-limit-tokens');
  const tokensRemaining = g('x-ratelimit-remaining-tokens');

  const lines: UsageLine[] = [];
  if (requestsRemaining != null || requestsLimit != null) {
    const span = requestsLimit ? ` of ${fmt(parseInt(requestsLimit, 10))}` : '';
    lines.push({ label: 'Requests left today', value: `${fmt(parseInt(requestsRemaining ?? '0', 10))}${span}` });
  }
  if (tokensRemaining != null || tokensLimit != null) {
    const span = tokensLimit ? ` of ${fmt(parseInt(tokensLimit, 10))}` : '';
    lines.push({ label: 'Tokens left this minute', value: `${fmt(parseInt(tokensRemaining ?? '0', 10))}${span}` });
  }

  if (!ok) {
    const detail = json?.error?.message ?? `HTTP ${status}`;
    if (status === 401 || status === 403) {
      throw new AiError('auth', 'Groq rejected the API key while checking usage.');
    }
    if (status === 429) {
      lines.push({ label: 'Warning', value: 'Rate limited right now — limits below show ~0 until they reset.' });
    } else {
      throw new AiError('other', `Groq usage check failed: ${detail}`);
    }
  }

  if (lines.length === 0) {
    lines.push({ label: 'Note', value: 'Groq did not return rate-limit headers for this request.' });
  }
  lines.push({ label: 'Note', value: FREE_NOTES.groq });
  return { ok: true, summary: 'Groq live rate-limit check', lines };
}