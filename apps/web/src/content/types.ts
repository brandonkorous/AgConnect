export type Locale = 'en' | 'es';

export type Localized<T> = { en: T; es: T };
export type LocalizedString = Localized<string>;

export type ArticleSection = {
    heading: LocalizedString;
    body: LocalizedString;
};

export type ResourceCategory =
    | 'workers_rights'
    | 'employer_guides'
    | 'training_explainers';

export type ResourceArticle = {
    slug: string;
    category: ResourceCategory;
    publishedAt: string;
    readingMinutes: number;
    title: LocalizedString;
    summary: LocalizedString;
    sections: ArticleSection[];
};

export type PressRelease = {
    slug: string;
    publishedAt: string;
    location: string;
    headline: LocalizedString;
    summary: LocalizedString;
    body: LocalizedString[];
};

export type CareerTeam =
    | 'engineering'
    | 'partnerships'
    | 'operations'
    | 'design'
    | 'data';

export type CareerEmploymentType = 'full_time' | 'part_time' | 'contract';

export type CareerRole = {
    slug: string;
    team: CareerTeam;
    location: string;
    employmentType: CareerEmploymentType;
    salaryRange: string;
    postedAt: string;
    title: LocalizedString;
    summary: LocalizedString;
    responsibilities: LocalizedString[];
    qualifications: LocalizedString[];
    niceToHave?: LocalizedString[];
};

export function pickLocale(value: LocalizedString, locale: Locale): string {
    return value[locale] ?? value.en;
}
