import type { ResourceArticle, ResourceCategory } from '../types';
import { heatIllnessPrevention } from './heat-illness-prevention';
import { wageTheftRecovery } from './wage-theft-recovery';
import { paidSickLeave } from './paid-sick-leave';
import { flcLicenseBasics } from './flc-license-basics';
import { mspaComplianceEssentials } from './mspa-compliance-essentials';
import { postingJobsThatFill } from './posting-jobs-that-fill';
import { forkliftCertification } from './forklift-certification';
import { pesticideHandlerCard } from './pesticide-handler-card';
import { foodSafetyGap } from './food-safety-gap';

const ALL: ResourceArticle[] = [
    heatIllnessPrevention,
    wageTheftRecovery,
    paidSickLeave,
    flcLicenseBasics,
    mspaComplianceEssentials,
    postingJobsThatFill,
    forkliftCertification,
    pesticideHandlerCard,
    foodSafetyGap,
];

export function getAllResources(): ResourceArticle[] {
    return [...ALL].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getResourcesByCategory(category: ResourceCategory): ResourceArticle[] {
    return getAllResources().filter((a) => a.category === category);
}

export function getResourceBySlug(slug: string): ResourceArticle | null {
    return ALL.find((a) => a.slug === slug) ?? null;
}

export function getAllResourceSlugs(): string[] {
    return ALL.map((a) => a.slug);
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
    'workers_rights',
    'employer_guides',
    'training_explainers',
];
