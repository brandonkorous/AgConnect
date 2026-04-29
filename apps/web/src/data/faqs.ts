export const faqIds = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
export type FaqId = (typeof faqIds)[number];

export const defaultOpenFaqs: FaqId[] = ['1', '2'];
