import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, '.smoke-tmp');

// 1) Compile the pure AI modules to CommonJS for Node.
execFileSync(
  'npx',
  ['tsc', 'src/ai/types.ts', 'src/ai/client.ts', 'src/ai/loop-core.ts', '--outDir', `"${outDir}"`, '--module', 'commonjs', '--target', 'es2020', '--moduleResolution', 'node', '--esModuleInterop', '--skipLibCheck'],
  { cwd: root, stdio: 'pipe', shell: process.platform === 'win32' },
);

const require = createRequire(import.meta.url);
const { runLoop } = require(join(outDir, 'loop-core.js'));
const { chatCompletions, AiError, testProvider } = require(join(outDir, 'client.js'));

let passed = 0;
let failed = 0;
function check(name, cond, extra = '') {
  if (cond) {
    passed += 1;
    console.log(`ok   ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name} ${extra}`);
  }
}

function fakeStub(steps) {
  let i = 0;
  return async (_p, _m, _t) => steps[Math.min(i++, steps.length - 1)](_m);
}

function deps(call, tools = [], persistCollector = []) {
  return {
    call,
    tools,
    loadHistory: async () => [],
    persist: async (entries) => persistCollector.push(...entries),
    systemPrompt: 'test prompt',
  };
}

(async () => {
  // A) Straight reply, no tools.
  {
    const persist = [];
    const call = fakeStub([async () => ({ finish: 'stop', content: 'hello there', toolCalls: [] })]);
    const res = await runLoop('hi', deps(call, [], persist));
    check('A: short reply returned', res.reply === 'hello there');
    check('A: no actions for chat-only', res.actions.length === 0);
    check('A: user+assistant persisted', persist.length === 2 && persist[0].role === 'user' && persist[1].content === 'hello there');
  }

  // B) Tool-calling flow: model asks for get_overview, gets results, answers.
  {
    let sawToolResult = false;
    const call = fakeStub([
      async () => ({
        finish: 'tool_calls',
        content: null,
        toolCalls: [{ id: 'c1', type: 'function', function: { name: 'get_overview', arguments: '{}' } }],
      }),
      async (messages) => {
        const last = messages[messages.length - 1];
        sawToolResult = last.role === 'tool' && last.content.includes('habit_count');
        return { finish: 'stop', content: 'you have 3 habits', toolCalls: [] };
      },
    ]);
    const tools = [
      {
        name: 'get_overview',
        description: 'overview',
        parameters: { type: 'object', properties: {} },
        handler: async () => JSON.stringify({ habit_count: 3 }),
      },
    ];
    const res = await runLoop('summarize me', deps(call, tools));
    check('B: final reply from second round', res.reply === 'you have 3 habits');
    check('B: tool result fed back to model', sawToolResult);
    check('B: read tool produced no action line', res.actions.length === 0);
  }

  // C) Write tool with actionText surfaced.
  {
    const call = fakeStub([
      async () => ({
        finish: 'tool_calls',
        content: null,
        toolCalls: [{ id: 'c1', type: 'function', function: { name: 'set_todo_done', arguments: '{"todo_id":5}' } }],
      }),
      async () => ({ finish: 'stop', content: 'done', toolCalls: [] }),
    ]);
    const tools = [
      {
        name: 'set_todo_done',
        description: 'w',
        parameters: { type: 'object', properties: { todo_id: { type: 'number' } }, required: ['todo_id'] },
        handler: async (args) => JSON.stringify({ id: args.todo_id, done: true }),
        actionText: (_a, r) => {
          const d = JSON.parse(r);
          return `» Completed todo #${d.id}`;
        },
      },
    ];
    const res = await runLoop('tick off task 5', deps(call, tools));
    check('C: write action line recorded', res.actions.length === 1 && res.actions[0] === '» Completed todo #5');
    check('C: reply still works', res.reply === 'done');
  }

  // D) Unknown tool does not crash the loop.
  {
    let continued = false;
    const call = fakeStub([
      async () => ({
        finish: 'tool_calls',
        content: null,
        toolCalls: [{ id: 'c1', type: 'function', function: { name: 'nope', arguments: '{}' } }],
      }),
      async (messages) => {
        const last = messages[messages.length - 1];
        continued = last.role === 'tool' && last.content.includes('unknown tool');
        return { finish: 'stop', content: 'ok', toolCalls: [] };
      },
    ]);
    const res = await runLoop('do it', deps(call, []));
    check('D: loop survives unknown tool', continued && res.reply === 'ok');
  }

  // K) onAssistantRound captures provider-reported token usage.
  {
    const seen = [];
    const call = fakeStub([
      async () => ({
        finish: 'stop',
        content: 'watched',
        toolCalls: [],
        usage: { promptTokens: 5, completionTokens: 7 },
      }),
    ]);
    const res = await runLoop('hi', {
      ...deps(call, []),
      onAssistantRound: (r, round) => {
        seen.push(`${round}:${r.usage?.promptTokens}/${r.usage?.completionTokens}`);
      },
    });
    check('K: onAssistantRound got usage', seen.length === 1 && seen[0] === '1:5/7' && res.reply === 'watched');
  }

  // E–G) client.ts HTTP logic with a mocked global fetch.
  {
    const realFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: 'pong' }, finish_reason: 'stop' }] }) });
      const fine = await chatCompletions({ baseUrl: 'https://x/v1', model: 'm', apiKey: 'k' }, [{ role: 'user', content: 'ping' }], []);
      check('E: normal response content', fine.content === 'pong' && fine.finish === 'stop');

      globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ message: { tool_calls: [{ id: 'x' }], content: null }, finish_reason: 'tool_calls' }] }) });
      const tools = await chatCompletions({ baseUrl: 'https://x/v1', model: 'm', apiKey: 'k' }, [{ role: 'user', content: 'x' }], []);
      check('F: tool_calls finish detected', tools.finish === 'tool_calls' && tools.toolCalls.length === 1);

      globalThis.fetch = async () => ({ ok: false, status: 401, text: async () => JSON.stringify({ error: { message: 'bad key' } }) });
      let authErr = '';
      try {
        await chatCompletions({ baseUrl: 'https://x/v1', model: 'm', apiKey: 'bad' }, [{ role: 'user', content: 'x' }], []);
      } catch (e) {
        authErr = e instanceof AiError ? e.code : 'not-ai-error';
      }
      check('G: 401 maps to auth error', authErr === 'auth');

      globalThis.fetch = async () => {
        throw new TypeError('network down');
      };
      let offlineErr = '';
      try {
        await chatCompletions({ baseUrl: 'https://x/v1', model: 'm', apiKey: 'k' }, [{ role: 'user', content: 'x' }], []);
      } catch (e) {
        offlineErr = e instanceof AiError ? e.code : 'not-ai-error';
      }
      check('H: network failure maps to offline', offlineErr === 'offline');

      // testProvider happy path
      globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] }) });
      await testProvider({ baseUrl: 'https://x/v1', model: 'm', apiKey: 'k' });
      check('I: testProvider succeeds', true);
    } finally {
      globalThis.fetch = realFetch;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('smoke crashed', e);
  process.exit(1);
});