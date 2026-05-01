import type { CareerRole, CareerTeam } from '../types';
import { seniorFullstackEngineer } from './senior-fullstack-engineer';
import { promotoraLead } from './promotora-lead';
import { workforceBoardPartnerships } from './workforce-board-partnerships';
import { productDesigner } from './product-designer';
import { fieldOperationsCoordinator } from './field-operations-coordinator';

const ALL: CareerRole[] = [
    seniorFullstackEngineer,
    promotoraLead,
    workforceBoardPartnerships,
    productDesigner,
    fieldOperationsCoordinator,
];

export function getAllCareerRoles(): CareerRole[] {
    return [...ALL].sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1));
}

export function getCareerRoleBySlug(slug: string): CareerRole | null {
    return ALL.find((r) => r.slug === slug) ?? null;
}

export function getAllCareerSlugs(): string[] {
    return ALL.map((r) => r.slug);
}

export function getCareerTeams(): CareerTeam[] {
    const seen = new Set<CareerTeam>();
    for (const r of ALL) seen.add(r.team);
    const order: CareerTeam[] = ['engineering', 'design', 'data', 'partnerships', 'operations'];
    return order.filter((t) => seen.has(t));
}
