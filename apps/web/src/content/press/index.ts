import type { PressRelease } from '../types';
import { launchAnnouncement } from './launch';
import { workforceBoardPartnership } from './workforce-board-partnership';
import { cdfaTrainingGrant } from './cdfa-training-grant';
import { milestone1000Workers } from './milestone-1000-workers';
import { productionLaunch } from './production-launch';

const ALL: PressRelease[] = [
    productionLaunch,
    milestone1000Workers,
    cdfaTrainingGrant,
    workforceBoardPartnership,
    launchAnnouncement,
];

export function getAllPressReleases(): PressRelease[] {
    return [...ALL].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getPressReleaseBySlug(slug: string): PressRelease | null {
    return ALL.find((r) => r.slug === slug) ?? null;
}

export function getAllPressSlugs(): string[] {
    return ALL.map((r) => r.slug);
}
