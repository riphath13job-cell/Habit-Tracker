import { secureDeleteItem, secureGetItem, secureSetItem } from '../storage';
import { getPref, setPref } from '../db';

export type ProviderId = 'openrouter' | 'groq' | 'gemini' | 'custom';

export interface ProviderConfig {
  preset: ProviderId;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface ProviderPreset {
  id: ProviderId;
  label: string;
  baseUrl: string;
  model: string;
  needsKey: boolean;
  hint: string;
  freeModels?: string[];
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    needsKey: true,
    hint: 'Free account + key at openrouter.ai (no card). Pick a model with ":free" in its name to pay nothing.',
    freeModels: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'qwen/qwen3-30b:free',
      'deepseek/deepseek-chat-v3-0324:free',
    ],
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    needsKey: true,
    hint: 'Free-tier key at console.groq.com (no card). Fast Llama models with generous free limits.',
    freeModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    needsKey: true,
    hint: 'Free API key at aistudio.google.com/apikey. Uses Gemini’s OpenAI-compatible endpoint.',
    freeModels: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  },
  {
    id: 'custom',
    label: 'Custom endpoint',
    baseUrl: '',
    model: '',
    needsKey: true,
    hint: 'Any OpenAI-compatible API. Base URL only (no /chat/completions). For a local model on your PC, e.g. http://192.168.1.5:11434/v1 (Ollama).',
  },
];

const CFG_PREF_KEY = 'ai_provider';
const API_KEY_STORE_KEY = 'ai_api_key';

export function needsApiKey(preset: ProviderId): boolean {
  const p = PROVIDER_PRESETS.find((x) => x.id === preset);
  return p ? p.needsKey : true;
}

export function presetById(id: ProviderId): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((x) => x.id === id);
}

/** User-facing summary of the active config, e.g. 'OpenRouter · llama-3.3-70b-instruct:free'. */
export function configSummary(cfg: ProviderConfig): string {
  const p = presetById(cfg.preset);
  const base = p?.label ?? cfg.preset;
  const model = cfg.model || 'default model';
  return `${base} · ${model}`;
}

export async function loadProviderConfig(): Promise<ProviderConfig> {
  const stored = await getPref(CFG_PREF_KEY);
  let fields: Partial<ProviderConfig> = {};
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') fields = parsed;
    } catch {
      fields = {};
    }
  }
  const preset = (fields.preset ?? 'openrouter') as ProviderId;
  const resolvedId = presetById(preset) ? preset : 'openrouter';
  const p = presetById(resolvedId)!;
  const apiKey = (await secureGetItem(API_KEY_STORE_KEY)) ?? '';
  return {
    preset: resolvedId,
    baseUrl: stripSlash(fields.baseUrl || p.baseUrl),
    model: fields.model && fields.model.length > 0 ? fields.model : p.model,
    apiKey,
  };
}

export async function saveProviderConfig(cfg: ProviderConfig): Promise<void> {
  const pref = JSON.stringify({
    preset: cfg.preset,
    baseUrl: stripSlash(cfg.baseUrl),
    model: cfg.model!,
  });
  await setPref(CFG_PREF_KEY, pref);
  if (cfg.apiKey) {
    await secureSetItem(API_KEY_STORE_KEY, cfg.apiKey.trim());
  } else {
    await secureDeleteItem(API_KEY_STORE_KEY);
  }
}

function stripSlash(url: string): string {
  return url.replace(/\/+$/, '');
}