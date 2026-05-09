export type LocalizedString = { en: string; es: string };

export type ComplianceItemContent = {
    why: LocalizedString;
    how: LocalizedString[];
    acceptableEvidence: LocalizedString[];
    deadline: LocalizedString | null;
    source: { label: string; url: string };
    extraSources?: { label: string; url: string }[];
    lastVerified: string;
};
