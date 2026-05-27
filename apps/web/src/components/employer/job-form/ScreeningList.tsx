'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslations } from 'next-intl';
import type { JobScreeningQuestionView } from '@/lib/api/hooks/employer';

type Props = {
    questions: JobScreeningQuestionView[];
    onChange: (next: JobScreeningQuestionView[]) => void;
};

export function ScreeningList({ questions, onChange }: Props) {
    const t = useTranslations('employer.jobs.form_v2');
    const [draftEn, setDraftEn] = useState('');
    const [draftEs, setDraftEs] = useState('');

    function add() {
        const en = draftEn.trim();
        const es = draftEs.trim();
        if (!en || !es) return;
        onChange([
            ...questions,
            {
                id: `tmp-${Math.random().toString(36).slice(2, 8)}`,
                sortOrder: questions.length,
                questionEn: en,
                questionEs: es,
                answerType: 'yes_no',
                required: true,
            },
        ]);
        setDraftEn('');
        setDraftEs('');
    }

    function remove(id: string) {
        onChange(questions.filter((q) => q.id !== id));
    }

    return (
        <div className="space-y-2">
            {questions.map((q, i) => (
                <div
                    key={q.id}
                    className="bg-base-200 border-base-300 flex items-start gap-3 rounded-xl border px-3.5 py-3"
                >
                    <span className="bg-base-100 text-base-content/60 grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-xs font-bold">
                        {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-sm font-medium">{q.questionEn}</div>
                        <div className="text-base-content/60 text-xs italic">{q.questionEs}</div>
                        <div className="text-base-content/50 mt-0.5 font-mono text-[10px] uppercase tracking-wide">
                            {q.answerType === 'yes_no' ? t('answer_yes_no') : t('answer_text')}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => remove(q.id)}
                        aria-label={t('screening_remove')}
                        className="text-base-content/40 hover:text-error mt-0.5 transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            {questions.length < 10 && (
                <div className="border-base-300 grid grid-cols-1 gap-2 rounded-xl border border-dashed p-3.5 sm:grid-cols-2">
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend text-base-content/70 text-[12px] font-semibold">
                            {t('screening_q_en')}
                        </legend>
                        <input
                            type="text"
                            value={draftEn}
                            onChange={(e) => setDraftEn(e.target.value)}
                            maxLength={280}
                            placeholder={t('screening_q_en_placeholder')}
                            className="input input-bordered input-sm w-full"
                        />
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend text-base-content/70 text-[12px] font-semibold">
                            {t('screening_q_es')}
                        </legend>
                        <input
                            type="text"
                            value={draftEs}
                            onChange={(e) => setDraftEs(e.target.value)}
                            maxLength={280}
                            placeholder={t('screening_q_es_placeholder')}
                            className="input input-bordered input-sm w-full"
                        />
                    </fieldset>
                    <div className="sm:col-span-2">
                        <button
                            type="button"
                            onClick={add}
                            disabled={!draftEn.trim() || !draftEs.trim()}
                            className="btn btn-sm btn-ghost border-base-300 rounded-full border"
                        >
                            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                            {t('screening_add')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
