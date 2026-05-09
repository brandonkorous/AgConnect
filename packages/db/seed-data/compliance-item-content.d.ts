export type LocalizedString = {
    en: string;
    es: string;
};
export type ComplianceItemContent = {
    why: LocalizedString;
    how: LocalizedString[];
    acceptableEvidence: LocalizedString[];
    deadline: LocalizedString | null;
    source: {
        label: string;
        url: string;
    };
    extraSources?: {
        label: string;
        url: string;
    }[];
    lastVerified: string;
};
declare const EMPTY: ComplianceItemContent;
export declare const COMPLIANCE_ITEM_CONTENT: Record<string, ComplianceItemContent>;
export declare function getContentForItem(itemKey: string): ComplianceItemContent | null;
export { EMPTY as _EMPTY_COMPLIANCE_ITEM_CONTENT };
