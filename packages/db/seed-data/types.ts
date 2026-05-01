// Shared types for namespace seed files.
export interface TranslationPair {
    en: string;
    es: string;
}

export type TranslationBundle = Record<string, TranslationPair>;
