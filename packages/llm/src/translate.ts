import { getLlmRouter } from './router';

export type TranslateInput = {
  text: string;
  fromLocale: 'en' | 'es';
  toLocale: 'en' | 'es';
  context?: 'job_title' | 'job_description' | 'generic';
};

export type TranslateResult = {
  translation: string;
  untranslated: boolean;
  model: string | null;
};

const SYSTEM_PROMPT = [
  'You translate farm-job postings between English and Spanish for a Central Valley',
  'California farmworker audience. Keep the tone professional. Preserve specific job',
  'titles and certification names. Match Mexican-Spanish register where applicable.',
  'Return ONLY the translated text — no commentary, no markdown, no quotes.',
].join(' ');

export async function translate(input: TranslateInput): Promise<TranslateResult> {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    return { translation: input.text, untranslated: true, model: null };
  }

  if (input.fromLocale === input.toLocale) {
    return { translation: input.text, untranslated: false, model: null };
  }

  const router = getLlmRouter();
  const userPrompt = buildUserPrompt(input);

  try {
    const result = await router.complete({
      model: 'translate',
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      maxTokens: Math.min(2000, input.text.length * 3),
      temperature: 0.2,
    });

    const translation = (result.text ?? '').trim();
    if (!translation) {
      return { translation: input.text, untranslated: true, model: null };
    }
    return { translation, untranslated: false, model: result.model ?? null };
  } catch {
    return { translation: input.text, untranslated: true, model: null };
  }
}

function buildUserPrompt(input: TranslateInput): string {
  const fromLang = input.fromLocale === 'en' ? 'English' : 'Spanish';
  const toLang = input.toLocale === 'en' ? 'English' : 'Spanish';
  const contextHint =
    input.context === 'job_title'
      ? 'This is a short job title (≤120 chars). Keep it concise.'
      : input.context === 'job_description'
        ? 'This is a job posting description. Preserve paragraph structure.'
        : '';

  return [
    `Translate the following from ${fromLang} to ${toLang}.`,
    contextHint,
    '---',
    input.text,
  ]
    .filter(Boolean)
    .join('\n');
}
