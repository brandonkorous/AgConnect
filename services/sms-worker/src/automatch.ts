// Auto-match consumer — when a job publishes with auto_match_enabled, score
// workers in the area and SMS the top 30 with a job invitation. Same scoring
// model as the in-form match-preview endpoint, capped at 30 sends.
//
// Idempotency: each (jobId, workerId) tuple is keyed via the SMS queue's
// singleton key, so retries fold instead of double-sending.

import type { Job, PgBoss } from 'pg-boss';
import { prisma } from '@agconn/db';
import { enqueueSms } from '@agconn/sms';

export const AUTOMATCH_QUEUE = 'job.publish.automatch' as const;

export type AutomatchJob = {
    tenantId: string;
    jobId: string;
};

const TOP_MATCH_CAP = 30;
const QUALIFY_THRESHOLD = 0.55;

const COUNTY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
    Fresno: { lat: 36.7378, lng: -119.7871 },
    Kern: { lat: 35.3733, lng: -119.0187 },
    Kings: { lat: 36.0758, lng: -119.8155 },
    Madera: { lat: 36.9613, lng: -120.0607 },
    Tulare: { lat: 36.2077, lng: -119.3473 },
};

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 3958.7613;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
        Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

async function handle(job: Job<AutomatchJob>): Promise<void> {
    const { tenantId, jobId } = job.data;

    const posting = await prisma.jobPosting.findFirst({
        where: { id: jobId, tenantId, deletedAt: null },
        include: {
            employer: { include: { employerProfile: true } },
        },
    });
    if (!posting || !posting.autoMatchEnabled || posting.status !== 'active') {
        console.log('[automatch] skipping', { jobId, status: posting?.status });
        return;
    }

    const employerName =
        posting.employer.employerProfile?.dbaName ??
        posting.employer.employerProfile?.legalName ??
        'AGCONN employer';

    const origin: { lat: number; lng: number } | null =
        posting.siteLat != null && posting.siteLng != null
            ? { lat: posting.siteLat, lng: posting.siteLng }
            : COUNTY_CENTROIDS[posting.county] ?? null;

    const wantedSkills = (posting.skills ?? []).map((s) => s.toLowerCase());

    // Pre-filter to same county (cheap), then score in JS.
    const workers = await prisma.workerProfile.findMany({
        where: {
            tenantId,
            county: posting.county,
            deletedAt: null,
        },
        select: { id: true, skills: true, county: true },
        take: 1000,
    });

    type Scored = { userId: string; score: number };
    const scored: Scored[] = [];
    for (const w of workers) {
        const wSkills = (w.skills ?? []).map((s) => s.toLowerCase());
        const skillOverlap = wantedSkills.length
            ? wSkills.filter((s) => wantedSkills.includes(s)).length / wantedSkills.length
            : 0.5;
        let radiusFit = 0.7;
        const wCentroid = w.county ? COUNTY_CENTROIDS[w.county] : null;
        if (origin && wCentroid) {
            const d = haversineMiles(origin, wCentroid);
            radiusFit = d <= 25 ? 1 : Math.max(0, 1 - (d - 25) / 25);
        }
        const score = 0.6 * skillOverlap + 0.4 * radiusFit;
        if (score >= QUALIFY_THRESHOLD) scored.push({ userId: w.id, score });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, TOP_MATCH_CAP);

    console.log('[automatch] dispatching', {
        jobId,
        qualifying: scored.length,
        sending: top.length,
    });

    const startDate = posting.startDate.toISOString().slice(0, 10);
    for (const w of top) {
        await enqueueSms({
            tenantId,
            userId: w.userId,
            template: 'job.match.invitation',
            vars: {
                jobTitle: posting.titleEn,
                county: posting.county,
                wageMin: String(Number(posting.wageMin)),
                wageMax: String(Number(posting.wageMax)),
                startDate,
                keyword: posting.smsApplyKeyword ?? `JOB-${posting.id.slice(0, 4)}`,
            },
            jobKey: `automatch-${jobId}-${w.userId}`,
        });
    }
}

export async function startAutomatchWorker(boss: PgBoss): Promise<void> {
    await boss.createQueue(AUTOMATCH_QUEUE);
    await boss.work<AutomatchJob>(
        AUTOMATCH_QUEUE,
        { batchSize: 1, pollingIntervalSeconds: 5 },
        async (jobs) => {
            for (const j of jobs) {
                try {
                    await handle(j);
                } catch (err) {
                    console.error('[automatch] failed', { id: j.id, err });
                    throw err;
                }
            }
        },
    );
    console.log('[automatch] started — listening on', AUTOMATCH_QUEUE);
}
