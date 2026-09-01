/** JSON Schema object describing a tool's parameters. */
export interface ToolParameters {
  type: 'object';
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
}

export interface ToolCallMsg {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMsg {
  role: ChatRole;
  content: string | null;
  tool_calls?: ToolCallMsg[];
  tool_call_id?: string;
}

export interface ClientToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: ToolParameters;
  };
}

export type FinishReason = 'stop' | 'tool_calls' | 'length';

export interface ChatUsage {
  promptTokens?: number;
  completionTokens?: number;
}

export interface ChatResponse {
  finish: FinishReason;
  content: string | null;
  toolCalls: ToolCallMsg[];
  /** Token counts reported by the provider, when available. */
  usage?: ChatUsage;
}