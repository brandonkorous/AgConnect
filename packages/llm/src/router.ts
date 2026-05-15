import { createRouter, type ModelRoute, type ProviderId, type Router } from 'llm-harness';

type Aliases =
  | 'translate'
  | 'resume-parser';

const ALIAS_ENV: Record<Aliases, { env: string; fallback: string }> = {
  translate: {
    env: 'LLM_TRANSLATE_MODEL',
    fallback: 'claude-haiku-4-5-20251001',
  },
  'resume-parser': {
    env: 'LLM_RESUME_PARSER_MODEL',
    fallback: 'claude-haiku-4-5-20251001',
  },
};

let router: Router | null = null;

function providerForModel(modelId: string): ProviderId {
  if (modelId.startsWith('claude-')) return 'anthropic';
  if (modelId.startsWith('gpt-') || modelId.startsWith('o1') || modelId.startsWith('o3')) {
    return 'openai';
  }
  return 'anthropic';
}

function buildRouter(): Router {
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? '';
  const openaiKey = process.env.OPENAI_API_KEY ?? '';

  const providers: Record<string, { apiKey: string }> = {};
  if (anthropicKey) providers.anthropic = { apiKey: anthropicKey };
  if (openaiKey) providers.openai = { apiKey: openaiKey };

  const models: Record<string, ModelRoute> = {};
  for (const [alias, { env, fallback }] of Object.entries(ALIAS_ENV) as [
    Aliases,
    { env: string; fallback: string },
  ][]) {
    const modelId = process.env[env] ?? fallback;
    models[alias] = { provider: providerForModel(modelId), modelId };
  }

  const fallbacks = (process.env.LLM_FALLBACKS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s in providers);

  return createRouter({ providers, models, fallbacks });
}

export function getLlmRouter(): Router {
  if (!router) router = buildRouter();
  return router;
}

export function resetLlmRouter(): void {
  router = null;
}

export const llm = new Proxy({} as Router, {
  get(_target, prop) {
    const r = getLlmRouter();
    const value = r[prop as keyof Router];
    return typeof value === 'function' ? value.bind(r) : value;
  },
}) as Router;

export function isProviderConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}
