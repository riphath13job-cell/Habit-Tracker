import type { ChatMsg, ChatResponse, ClientToolDef, ToolCallMsg, ToolParameters } from './types';

/** One tool exposed to the model. */
export interface AiTool {
  name: string;
  description: string;
  parameters: ToolParameters;
  handler: (args: Record<string, unknown>) => Promise<string>;
  /**
   * When present this is a WRITE tool: called after a successful handler to
   * produce the human-readable "action" line shown in the chat transcript.
   */
  actionText?: (args: Record<string, unknown>, resultJson: string) => string;
}

/** A single chat-completion round (injected so tests can fake it). */
export type RunCall = (
  provider: { baseUrl: string; model: string; apiKey: string },
  messages: ChatMsg[],
  tools: ClientToolDef[],
  opts?: { maxTokens?: number },
) => Promise<ChatResponse>;

export interface LoopHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface LoopDeps {
  call: RunCall;
  tools: AiTool[];
  /** Load prior chat history (oldest first). */
  loadHistory: () => Promise<LoopHistoryEntry[]>;
  /** Persist the user message + final assistant reply. */
  persist: (entries: LoopHistoryEntry[]) => Promise<void>;
  systemPrompt: string;
  /**
   * Called after every completion round with the raw result and the 1-based
   * round index. Used to track token usage reported by the provider.
   */
  onAssistantRound?: (res: ChatResponse, round: number) => Promise<void> | void;
}

export interface LoopResult {
  reply: string;
  /** Human-readable lines for WRITE tools that ran. */
  actions: string[];
}

const MAX_ROUNDS = 6;
const TOOL_RESULT_MAX = 8000;

function truncate(text: string, max = TOOL_RESULT_MAX): string {
  return text.length > max ? `${text.slice(0, max)}\n…(truncated)` : text;
}

function parseArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function toolDefs(tools: AiTool[]): ClientToolDef[] {
  return tools.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

/**
 * The tool-calling chat loop. Pure orchestration: every side effect (HTTP,
 * the database, the provider) is injected, which keeps this module testable
 * on Node and platform-agnostic.
 */
export async function runLoop(userText: string, deps: LoopDeps): Promise<LoopResult> {
  const history = await deps.loadHistory();
  const messages: ChatMsg[] = [
    { role: 'system', content: deps.systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content } as ChatMsg)),
    { role: 'user', content: userText },
  ];

  const actions: string[] = [];
  let round = 0;

  for (;;) {
    round += 1;
    if (round > MAX_ROUNDS) break;

    const res = await deps.call(
      { baseUrl: '', model: '', apiKey: '' },
      messages,
      toolDefs(deps.tools),
    );

    if (deps.onAssistantRound) {
      await deps.onAssistantRound(res, round);
    }

    const toolCalls: ToolCallMsg[] = res.toolCalls ?? [];
    if (res.finish !== 'tool_calls' || toolCalls.length === 0) {
      const content = (res.content ?? '').trim();
      if (content) {
        await deps.persist([{ role: 'user', content: userText }, { role: 'assistant', content }]);
        return { reply: content, actions };
      }
      await deps.persist([{ role: 'user', content: userText }, { role: 'assistant', content: '(no response)' }]);
      return { reply: '(the assistant returned no text)', actions };
    }

    messages.push({ role: 'assistant', content: null, tool_calls: toolCalls });
    for (const tc of toolCalls) {
      const tool = deps.tools.find((t) => t.name === tc.function?.name);
      let resultText: string;
      if (!tool) {
        resultText = JSON.stringify({ error: `unknown tool: ${tc.function?.name}` });
      } else {
        const args = parseArgs(tc.function?.arguments);
        try {
          const out = await tool.handler(args);
          resultText = truncate(out);
          if (tool.actionText) {
            actions.push(tool.actionText(args, resultText));
          }
        } catch (e) {
          resultText = JSON.stringify({
            error: e instanceof Error ? e.message : 'the tool failed',
          });
        }
      }
      messages.push({ role: 'tool', tool_call_id: tc.id, content: resultText });
    }
  }

  const last = [...messages].reverse().find((m) => m.role === 'assistant' && m.content && m.content.trim());
  const reply = (last?.content ?? 'I could not finish that in time — try narrowing the question.').trim();
  await deps.persist([{ role: 'user', content: userText }, { role: 'assistant', content: reply }]);
  return { reply, actions };
}